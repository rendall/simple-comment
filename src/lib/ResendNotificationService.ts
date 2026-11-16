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

  notifyModerators = async (message: string): Promise<Success | Error> => {
    const responses = await Promise.all(
      this._moderatorContactEmails.map(to =>
        this._mailService.emails.send({
          from: this._from,
          to,
          subject: "Simple Comment Notification",
          text: message,
        })
      )
    )

    const allAccepted = responses.every(
      ({ data, error }) =>
        error === null &&
        typeof data?.id === "string" &&
        data.id.trim().length > 0
    )
    return allAccepted
      ? { statusCode: 202, body: "Emails sent successfully" }
      : error502NotificationFailed
  }
}
