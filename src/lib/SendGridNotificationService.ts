import { AbstractNotificationService } from "./AbstractNotificationService"
import type { Error, Success } from "./simple-comment-types"
import type { MailDataRequired, MailService } from "@sendgrid/mail"
import sendGridMail from "@sendgrid/mail"
import {
  error500NotificationError,
  error502NotificationFailed,
  error502NotificationAuthenticationFailed,
  error502NotificationSendingRefused,
  error502NotificationAllowanceExceeded,
  error503NotificationUnavailable,
  error504NotificationTimeout,
} from "./messages"
import {
  EnvContractError,
  getOptionalModeratorContactEmails,
  getOptionalNotificationEnv,
} from "./env"

const notificationTimeoutMs = 5000
type NotificationFailure = {
  message: Error
  label: string
  plural: string
  action?: string
}
type NotificationFailureOutcome = {
  failure: NotificationFailure
  providerMessages: string[]
}

const internalFailure: NotificationFailure = {
  message: error500NotificationError,
  label: "internal error",
  plural: "internal errors",
}
const upstreamFailure: NotificationFailure = {
  message: error502NotificationFailed,
  label: "upstream failure",
  plural: "upstream failures",
}
const authenticationFailure: NotificationFailure = {
  message: error502NotificationAuthenticationFailed,
  label: "authentication failure",
  plural: "authentication failures",
  action: "Check the API key and account.",
}
const sendingRefused: NotificationFailure = {
  message: error502NotificationSendingRefused,
  label: "sending restriction",
  plural: "sending restrictions",
  action: "Check permissions, sender verification, and account status.",
}
const allowanceExceeded: NotificationFailure = {
  message: error502NotificationAllowanceExceeded,
  label: "allowance restriction",
  plural: "allowance restrictions",
  action: "Check usage limits and billing.",
}
const unavailableFailure: NotificationFailure = {
  message: error503NotificationUnavailable,
  label: "unavailable",
  plural: "unavailable",
}
const timeoutFailure: NotificationFailure = {
  message: error504NotificationTimeout,
  label: "timed out",
  plural: "timed out",
}
const failureCategories = [
  internalFailure,
  upstreamFailure,
  authenticationFailure,
  sendingRefused,
  allowanceExceeded,
  unavailableFailure,
  timeoutFailure,
]

const accountErrorSignals = [
  {
    statusCode: 401,
    message: "The provided authorization grant is invalid, expired, or revoked",
    failure: authenticationFailure,
  },
  {
    statusCode: 401,
    message: "Authenticated user is not authorized",
    failure: sendingRefused,
  },
  { statusCode: 403, message: "Access Forbidden", failure: sendingRefused },
  {
    statusCode: 403,
    message: "The from address does not match a verified Sender Identity",
    allowExplanationSuffix: true,
    failure: sendingRefused,
  },
  {
    statusCode: 401,
    message: "Maximum credits exceeded",
    failure: allowanceExceeded,
  },
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const getFullMessages = (body: unknown): string[] => {
  if (typeof body === "string") return body.trim() ? [body] : []
  if (!isRecord(body)) return []
  if (Array.isArray(body.errors)) {
    const messages = body.errors.flatMap((entry: unknown) =>
      isRecord(entry) &&
      typeof entry.message === "string" &&
      entry.message.trim()
        ? [entry.message]
        : []
    )
    if (messages.length > 0) return messages
  }
  const message = [body.message, body.error, body.errors].find(
    value => typeof value === "string" && value.trim()
  )
  return typeof message === "string" ? [message] : []
}

const recognizeAccountFailure = (
  statusCode: unknown,
  body: unknown
): NotificationFailure | undefined => {
  if (!isRecord(body) || !Array.isArray(body.errors)) return undefined

  // Only recognize documented status/message pairs. Unrecognized or conflicting
  // entries retain the generic failure instead of guessing an account diagnosis.
  const failures = body.errors.map((entry: unknown) => {
    if (!isRecord(entry) || typeof entry.message !== "string") return undefined
    const message = entry.message.trim().replace(/\.$/, "")
    return accountErrorSignals.find(
      signal =>
        signal.statusCode === statusCode &&
        (signal.message === message ||
          (signal.allowExplanationSuffix === true &&
            message.startsWith(signal.message) &&
            /^\.\s/.test(message.slice(signal.message.length))))
    )?.failure
  })
  const first = failures[0]
  return first && failures.every(failure => failure === first)
    ? first
    : undefined
}

const classifyResponse = (
  statusCode?: number,
  body?: unknown
): NotificationFailureOutcome | undefined => {
  if (statusCode === 202) return undefined
  const failure =
    recognizeAvailabilityFailure(statusCode) ??
    recognizeAccountFailure(statusCode, body) ??
    upstreamFailure
  return { failure, providerMessages: getFullMessages(body) }
}

const recognizeAvailabilityFailure = (
  code: unknown
): NotificationFailure | undefined => {
  if (code === 503) return unavailableFailure
  if (code === 504 || code === "ECONNABORTED" || code === "ETIMEDOUT")
    return timeoutFailure
  return undefined
}

const classifyError = (error: unknown): NotificationFailureOutcome => {
  const code = isRecord(error) ? error.code : undefined
  const body =
    isRecord(error) && isRecord(error.response)
      ? error.response.body
      : undefined
  const failure =
    recognizeAvailabilityFailure(code) ??
    (error instanceof TypeError
      ? internalFailure
      : (recognizeAccountFailure(code, body) ?? upstreamFailure))
  const providerMessages = getFullMessages(body)
  const fallbackMessage =
    typeof error === "string"
      ? error
      : isRecord(error)
        ? error.message
        : undefined
  return {
    failure,
    providerMessages:
      providerMessages.length > 0
        ? providerMessages
        : getFullMessages(fallbackMessage),
  }
}

export class SendGridNotificationService extends AbstractNotificationService {
  static override createNotificationService = ():
    | SendGridNotificationService
    | undefined => {
    const { notificationServiceApiKey } = getOptionalNotificationEnv()
    if (notificationServiceApiKey === undefined) return undefined

    return new SendGridNotificationService(
      sendGridMail,
      notificationServiceApiKey
    )
  }

  private readonly _mailService: MailService
  private readonly _moderatorContactEmails: string[]
  private readonly _sendGridApiKey: string
  private readonly _sendGridVerifiedSender: string

  constructor(
    mailService: MailService,
    sendGridApiKey?: string,
    moderatorContactEmails?: string[]
  ) {
    super()

    const { notificationServiceApiKey, sendGridVerifiedSender } =
      getOptionalNotificationEnv(undefined, sendGridApiKey)

    const apiKey = sendGridApiKey ?? notificationServiceApiKey
    if (apiKey === undefined)
      throw new EnvContractError(
        "NOTIFICATION_SERVICE_API_KEY",
        "NOTIFICATION_SERVICE_API_KEY is not set in environmental variables"
      )
    this._sendGridApiKey = apiKey

    if (sendGridVerifiedSender === undefined)
      throw new EnvContractError(
        "SENDGRID_VERIFIED_SENDER",
        "SENDGRID_VERIFIED_SENDER is not set in environmental variables"
      )
    this._sendGridVerifiedSender = sendGridVerifiedSender

    const envModeratorContactEmails = getOptionalModeratorContactEmails()
    const emails = moderatorContactEmails ?? envModeratorContactEmails

    if (emails === undefined || emails.length === 0)
      throw new EnvContractError(
        "SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL",
        "SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL is not set in environmental variables"
      )

    this._moderatorContactEmails = emails
    mailService.setApiKey(this._sendGridApiKey)
    this._mailService = mailService
  }

  private sendNotification = async (
    message: MailDataRequired
  ): Promise<NotificationFailureOutcome | undefined> => {
    let timeout: ReturnType<typeof setTimeout> | undefined
    try {
      // Each recipient has its own deadline, so one failure cannot end other sends.
      // A deadline bounds the wait; it does not cancel an in-flight provider request.
      return await Promise.race([
        (async () => {
          const [response] = await this._mailService.send(message)
          return classifyResponse(response?.statusCode, response?.body)
        })(),
        new Promise<NotificationFailureOutcome>(resolve => {
          timeout = setTimeout(
            () => resolve({ failure: timeoutFailure, providerMessages: [] }),
            notificationTimeoutMs
          )
        }),
      ])
    } catch (error) {
      return classifyError(error)
    } finally {
      clearTimeout(timeout)
    }
  }

  notifyModerators = async (body: string): Promise<Error | Success> => {
    const messages = this._moderatorContactEmails.map(email => ({
      to: email,
      from: this._sendGridVerifiedSender, // Sender's email address
      subject: "Simple Comment Notification",
      text: `${body}`,
    }))

    const outcomes = await Promise.all(messages.map(this.sendNotification))
    const accepted = outcomes.filter(outcome => outcome === undefined).length
    const failed = outcomes.length - accepted

    if (failed === 0) {
      return { statusCode: 202, body: "Emails sent successfully" }
    }

    // Fixed category order keeps the result independent of send completion order.
    const failures = failureCategories
      .map(category => ({
        ...category,
        count: outcomes.filter(outcome => outcome?.failure === category).length,
      }))
      .filter(category => category.count > 0)
    const message =
      failures.length === 1 ? failures[0].message : error502NotificationFailed
    const breakdown =
      failures.length > 1
        ? ` (${failures.map(({ count, label, plural }) => `${count} ${count === 1 ? label : plural}`).join(", ")})`
        : ""

    const actions = failures
      .flatMap(({ action }) => (action ? [action] : []))
      .join(" ")
    const summary: Error = {
      ...message,
      body: `${message.body}: ${accepted} accepted, ${failed} failed${breakdown}.${actions ? ` ${actions}` : ""}`,
    }

    if (actions) {
      // This body contains only fixed messages and counts, never provider payloads.
      console.error("Notification provider account error", summary)
    }

    // Preserve messages independently of recognition. Only message text is returned,
    // not SDK headers, configuration, or other provider response fields.
    const providerMessages = [
      ...new Set(outcomes.flatMap(outcome => outcome?.providerMessages ?? [])),
    ].sort()
    return providerMessages.length > 0
      ? {
          ...summary,
          body: `${summary.body} Provider details: ${providerMessages.join(" | ")}`,
        }
      : summary
  }
}
