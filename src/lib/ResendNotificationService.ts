import { Resend } from "resend"
import { AbstractNotificationService } from "./AbstractNotificationService"
import { EnvContractError } from "./env"
import type { NotificationConfiguration } from "./env"
import type { Error, Success } from "./simple-comment-types"
import {
  error502NotificationFailed,
  error502NotificationAuthenticationFailed,
  error502NotificationSendingRefused,
  error502NotificationAllowanceExceeded,
  error503NotificationRateLimited,
  error503NotificationUnavailable,
  error504NotificationTimeout,
} from "./messages"

type ResendMailService = {
  emails: Pick<Resend["emails"], "send">
}

type FailureOutcome =
  | "failed"
  | "authentication"
  | "sendingRefused"
  | "allowance"
  | "rateLimited"
  | "unavailable"
  | "timedOut"
type NotificationOutcome = "accepted" | FailureOutcome
const notificationTimeoutMs = 5000

// Fixed order keeps summaries and guidance independent of completion order.
const failureCategories: {
  outcome: FailureOutcome
  message: Error
  label: string
  plural: string
  action?: string
}[] = [
  {
    outcome: "failed",
    message: error502NotificationFailed,
    label: "upstream failure",
    plural: "upstream failures",
  },
  {
    outcome: "authentication",
    message: error502NotificationAuthenticationFailed,
    label: "authentication failure",
    plural: "authentication failures",
    action: "Check RESEND_API_KEY and your Resend account status.",
  },
  {
    outcome: "sendingRefused",
    message: error502NotificationSendingRefused,
    label: "sending restriction",
    plural: "sending restrictions",
    action:
      "Check RESEND_FROM, domain verification, and API key permissions in Resend.",
  },
  {
    outcome: "allowance",
    message: error502NotificationAllowanceExceeded,
    label: "allowance restriction",
    plural: "allowance restrictions",
    action:
      "Check Resend usage limits and wait for the quota to reset or adjust your plan.",
  },
  {
    outcome: "rateLimited",
    message: error503NotificationRateLimited,
    label: "rate limit",
    plural: "rate limits",
    action: "Reduce the sending rate and try again later.",
  },
  {
    outcome: "unavailable",
    message: error503NotificationUnavailable,
    label: "unavailable",
    plural: "unavailable",
    action:
      "Check network access and Resend's service status, then try again later.",
  },
  {
    outcome: "timedOut",
    message: error504NotificationTimeout,
    label: "timed out",
    plural: "timed out",
  },
]

// Match documented name/status pairs, not HTTP status or message text alone.
// https://resend.com/docs/api-reference/errors
const errorSignals: {
  name: string
  statusCode: number | null
  outcome: FailureOutcome
}[] = [
  { name: "missing_api_key", statusCode: 401, outcome: "authentication" },
  // Resend's SDK maps this credential error to 403, rather than 401:
  // https://github.com/resend/resend-python/blob/11cb1ee50a26301182b752f10a88ce029a4e42e8/resend/exceptions.py#L212-L218
  { name: "invalid_api_key", statusCode: 403, outcome: "authentication" },
  { name: "restricted_api_key", statusCode: 403, outcome: "authentication" },
  { name: "suspended_api_key", statusCode: 403, outcome: "authentication" },
  { name: "restricted_api_key", statusCode: 401, outcome: "sendingRefused" },
  { name: "invalid_permission", statusCode: 403, outcome: "sendingRefused" },
  { name: "daily_quota_exceeded", statusCode: 429, outcome: "allowance" },
  { name: "monthly_quota_exceeded", statusCode: 429, outcome: "allowance" },
  { name: "rate_limit_exceeded", statusCode: 429, outcome: "rateLimited" },
  { name: "service_unavailable", statusCode: 503, outcome: "unavailable" },
  { name: "dns_lookup_failed", statusCode: 503, outcome: "unavailable" },
  { name: "application_error", statusCode: 500, outcome: "unavailable" },
  // https://github.com/resend/resend-node/blob/v6.0.0/src/interfaces.ts#L15-L17
  { name: "internal_server_error", statusCode: 500, outcome: "unavailable" },
  // The SDK also uses application_error for non-JSON failures and failed fetches.
  { name: "application_error", statusCode: 502, outcome: "unavailable" },
  { name: "application_error", statusCode: 503, outcome: "unavailable" },
  { name: "application_error", statusCode: 504, outcome: "timedOut" },
  { name: "application_error", statusCode: null, outcome: "unavailable" },
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const classifyProviderError = (error: unknown): FailureOutcome => {
  if (!isRecord(error) || typeof error.message !== "string") return "failed"

  const recognized = errorSignals.find(
    signal =>
      signal.name === error.name && signal.statusCode === error.statusCode
  )
  if (recognized) return recognized.outcome

  // validation_error is overloaded. Only known credential/sender details justify
  // account guidance; other validation failures remain generic.
  if (error.name === "validation_error") {
    const detail = error.message.trim()
    if (
      (error.statusCode === 400 || error.statusCode === 401) &&
      detail === "API key is invalid"
    ) {
      return "authentication"
    }
    if (
      error.statusCode === 403 &&
      (/^The \S+ domain is not verified\.(?:\s|$)/.test(detail) ||
        detail.startsWith(
          "You can only send testing emails to your own email address ("
        ))
    ) {
      return "sendingRefused"
    }
  }
  return "failed"
}

const classifyResponse = (response: unknown): NotificationOutcome => {
  if (!isRecord(response)) return "failed"
  if (
    response.error === null &&
    isRecord(response.data) &&
    typeof response.data.id === "string" &&
    response.data.id.trim().length > 0
  ) {
    return "accepted"
  }
  return response.data === null
    ? classifyProviderError(response.error)
    : "failed"
}

export class ResendNotificationService extends AbstractNotificationService {
  private readonly _mailService: ResendMailService
  private readonly _from: string
  private readonly _moderatorContactEmails: string[]

  constructor(
    configuration: NotificationConfiguration,
    mailService?: ResendMailService
  ) {
    super()
    try {
      // Keep credentials and comment data on Resend's API regardless of SDK env defaults.
      this._mailService =
        mailService ??
        new Resend(configuration.apiKey, { baseUrl: "https://api.resend.com" })
    } catch {
      // SDK initialization errors can contain the key. Do not retain their cause.
      throw new EnvContractError(
        "RESEND_API_KEY",
        "Unable to initialize Resend. Check RESEND_API_KEY."
      )
    }
    this._from = configuration.from
    this._moderatorContactEmails = configuration.moderatorContactEmails
  }

  private sendNotification = async (
    to: string,
    message: string
  ): Promise<NotificationOutcome> => {
    let timeout: ReturnType<typeof setTimeout> | undefined
    try {
      // Bound each recipient's wait without cancelling the provider request.
      // Promise.race also handles a rejection that arrives after the deadline.
      return await Promise.race([
        (async (): Promise<NotificationOutcome> => {
          const response = await this._mailService.emails.send({
            from: this._from,
            to,
            subject: "Simple Comment Notification",
            text: message,
          })
          return classifyResponse(response)
        })(),
        new Promise<NotificationOutcome>(resolve => {
          timeout = setTimeout(() => resolve("timedOut"), notificationTimeoutMs)
        }),
      ])
    } catch {
      // Keep raw provider responses and exceptions out of results and logs.
      return "failed"
    } finally {
      clearTimeout(timeout)
    }
  }

  notifyModerators = async (message: string): Promise<Success | Error> => {
    const outcomes = await Promise.all(
      this._moderatorContactEmails.map(to => this.sendNotification(to, message))
    )
    const accepted = outcomes.filter(outcome => outcome === "accepted").length
    const failed = outcomes.length - accepted

    if (failed === 0) {
      return { statusCode: 202, body: "Emails sent successfully" }
    }

    const failures = failureCategories
      .map(category => ({
        ...category,
        count: outcomes.filter(outcome => outcome === category.outcome).length,
      }))
      .filter(category => category.count > 0)
    const failure =
      failures.length === 1 ? failures[0].message : error502NotificationFailed
    const breakdown =
      failures.length > 1
        ? ` (${failures.map(({ count, label, plural }) => `${count} ${count === 1 ? label : plural}`).join(", ")})`
        : ""
    const actions = failures
      .map(({ action }) => action)
      .filter(Boolean)
      .join(" ")
    const summary: Error = {
      ...failure,
      body: `${failure.body}: ${accepted} accepted, ${failed} failed${breakdown}.${actions ? ` ${actions}` : ""}`,
    }
    if (actions) {
      // This contains fixed messages and counts, never raw provider diagnostics.
      console.error("Notification provider error", summary)
    }
    return summary
  }
}
