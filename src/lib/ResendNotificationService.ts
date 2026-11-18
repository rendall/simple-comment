import { Resend } from "resend"
import { AbstractNotificationService } from "./AbstractNotificationService"
import type { NotificationConfiguration } from "./env"
import type { Error, Success } from "./simple-comment-types"
import {
  error502NotificationFailed,
  error504NotificationTimeout,
} from "./messages"

type ResendMailService = {
  emails: Pick<Resend["emails"], "send">
}

type NotificationOutcome = "accepted" | "failed" | "timedOut"
const notificationTimeoutMs = 5000

export class ResendNotificationService extends AbstractNotificationService {
  private readonly _mailService: ResendMailService
  private readonly _from: string
  private readonly _moderatorContactEmails: string[]

  constructor(
    configuration: NotificationConfiguration,
    mailService: ResendMailService = new Resend(configuration.apiKey)
  ) {
    super()
    this._mailService = mailService
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
          const accepted =
            response?.error === null &&
            typeof response.data?.id === "string" &&
            response.data.id.trim().length > 0
          return accepted ? "accepted" : "failed"
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

    const timedOut = outcomes.filter(outcome => outcome === "timedOut").length
    const upstreamFailures = failed - timedOut
    const failure =
      timedOut === failed
        ? error504NotificationTimeout
        : error502NotificationFailed
    const breakdown =
      timedOut > 0 && upstreamFailures > 0
        ? ` (${upstreamFailures} upstream ${upstreamFailures === 1 ? "failure" : "failures"}, ${timedOut} timed out)`
        : ""
    return {
      ...failure,
      body: `${failure.body}: ${accepted} accepted, ${failed} failed${breakdown}.`,
    }
  }
}
