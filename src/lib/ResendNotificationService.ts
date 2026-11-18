import { Resend } from "resend"
import { AbstractNotificationService } from "./AbstractNotificationService"
import type { NotificationConfiguration } from "./env"
import type { Error, Success } from "./simple-comment-types"
import { error502NotificationFailed } from "./messages"

type ResendMailService = {
  emails: Pick<Resend["emails"], "send">
}

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
  ): Promise<boolean> => {
    try {
      const response = await this._mailService.emails.send({
        from: this._from,
        to,
        subject: "Simple Comment Notification",
        text: message,
      })
      return (
        response?.error === null &&
        typeof response.data?.id === "string" &&
        response.data.id.trim().length > 0
      )
    } catch {
      // Keep raw provider responses and exceptions out of results and logs.
      return false
    }
  }

  notifyModerators = async (message: string): Promise<Success | Error> => {
    const outcomes = await Promise.all(
      this._moderatorContactEmails.map(to => this.sendNotification(to, message))
    )
    const accepted = outcomes.filter(Boolean).length
    const failed = outcomes.length - accepted

    return failed === 0
      ? { statusCode: 202, body: "Emails sent successfully" }
      : {
          ...error502NotificationFailed,
          body: `${error502NotificationFailed.body}: ${accepted} accepted, ${failed} failed.`,
        }
  }
}
