import { AbstractNotificationService } from "./AbstractNotificationService"
import { Error, Success } from "./simple-comment-types"
import { MailService } from "@sendgrid/mail"
import {
  EnvContractError,
  getBackendEnv,
  getOptionalNotificationEnv,
} from "./env"

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

    const { moderatorContactEmail } = getBackendEnv()
    const { notificationServiceApiKey, sendGridVerifiedSender } =
      getOptionalNotificationEnv()

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

    const envModeratorContactEmails = moderatorContactEmail
      .split(",")
      .map(email => email.trim())
      .filter(email => email.length > 0)
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

  notifyModerators = async (body: string): Promise<Error | Success> => {
    const messages = this._moderatorContactEmails.map(email => ({
      to: email,
      from: this._sendGridVerifiedSender, // Sender's email address
      subject: "Simple Comment Notification",
      text: `${body}`,
    }))

    const sendPromises = messages.map(message =>
      this._mailService.send(message)
    )
    const sendResults = await Promise.race(sendPromises)

    if (sendResults[0]?.statusCode !== 202) {
      const { statusCode, body } = sendResults[0]
      const resultsBody = JSON.stringify(body)
      return { statusCode, body: resultsBody }
    } else {
      return { statusCode: 202, body: "Emails sent successfully" }
    }
  }
}
