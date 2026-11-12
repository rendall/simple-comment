import { AbstractNotificationService } from "./AbstractNotificationService"
import type { Error, Success } from "./simple-comment-types"
import type { MailDataRequired, MailService } from "@sendgrid/mail"
import {
  error500NotificationError,
  error502NotificationFailed,
  error503NotificationUnavailable,
  error504NotificationTimeout,
} from "./messages"
import {
  EnvContractError,
  getOptionalModeratorContactEmails,
  getOptionalNotificationEnv,
} from "./env"

const notificationTimeoutMs = 5000
type NotificationStatus = 202 | 500 | 502 | 503 | 504

const failureCategories = [
  {
    message: error500NotificationError,
    label: "internal error",
    plural: "internal errors",
  },
  {
    message: error502NotificationFailed,
    label: "upstream failure",
    plural: "upstream failures",
  },
  {
    message: error503NotificationUnavailable,
    label: "unavailable",
    plural: "unavailable",
  },
  {
    message: error504NotificationTimeout,
    label: "timed out",
    plural: "timed out",
  },
]

const classifyResponse = (statusCode?: number): NotificationStatus => {
  if (statusCode === 202 || statusCode === 503 || statusCode === 504)
    return statusCode
  return 502
}

const classifyError = (error: unknown): NotificationStatus => {
  const code =
    typeof error === "object" && error !== null
      ? (error as { code?: unknown }).code
      : undefined

  if (code === 504 || code === "ECONNABORTED" || code === "ETIMEDOUT")
    return 504
  if (code === 503) return 503
  return error instanceof TypeError ? 500 : 502
}

export class SendGridNotificationService extends AbstractNotificationService {
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
  ): Promise<NotificationStatus> => {
    let timeout: ReturnType<typeof setTimeout> | undefined
    try {
      // Each recipient has its own deadline, so one failure cannot end other sends.
      // A deadline bounds the wait; it does not cancel an in-flight provider request.
      return await Promise.race([
        (async () => {
          const [response] = await this._mailService.send(message)
          return classifyResponse(response?.statusCode)
        })(),
        new Promise<NotificationStatus>(resolve => {
          timeout = setTimeout(() => resolve(504), notificationTimeoutMs)
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

    const statuses = await Promise.all(messages.map(this.sendNotification))
    const accepted = statuses.filter(status => status === 202).length
    const failed = statuses.length - accepted

    if (failed === 0) {
      return { statusCode: 202, body: "Emails sent successfully" }
    }

    // Fixed category order keeps the result independent of send completion order.
    const failures = failureCategories
      .map(category => ({
        ...category,
        count: statuses.filter(status => status === category.message.statusCode)
          .length,
      }))
      .filter(category => category.count > 0)
    const message =
      failures.length === 1 ? failures[0].message : error502NotificationFailed
    const breakdown =
      failures.length > 1
        ? ` (${failures.map(({ count, label, plural }) => `${count} ${count === 1 ? label : plural}`).join(", ")})`
        : ""

    return {
      ...message,
      body: `${message.body}: ${accepted} accepted, ${failed} failed${breakdown}.`,
    }
  }
}
