import { AbstractNotificationService } from "./AbstractNotificationService"
import { Error, Success } from "./simple-comment-types"
import { MailService } from "@sendgrid/mail"
import { config as dotEnvConfig } from "dotenv"
dotEnvConfig()

const _sendGridApiKey = process.env.NOTIFICATION_SERVICE_API_KEY
const sendGridVerifiedSender = process.env.SENDGRID_VERIFIED_SENDER

if (sendGridVerifiedSender === undefined)
  throw "SENDGRID_VERIFIED_SENDER is not set in environmental variables"

const _moderatorContactEmails = process.env
  .SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL
  ? process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL.split(",")
  : undefined

export class SendGridNotificationService extends AbstractNotificationService {
  private readonly _mailService: MailService
  private readonly _moderatorContactEmails: string[]
  private readonly _sendGridApiKey: string

  constructor(
    mailService: MailService,
    sendGridApiKey?: string,
    moderatorContactEmails?: string[]
  ) {
    super()

    const apiKey = sendGridApiKey ?? _sendGridApiKey
    if (apiKey === undefined)
      throw "NOTIFICATION_SERVICE_API_KEY is not set in environmental variables"
    this._sendGridApiKey = apiKey

    const emails = moderatorContactEmails ?? _moderatorContactEmails

    if (emails === undefined || emails.length === 0)
      throw `SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL is not set in environmental variables`

    this._moderatorContactEmails = emails
    mailService.setApiKey(this._sendGridApiKey)
    this._mailService = mailService
  }

  notifyModerators = async (body: string): Promise<Error | Success> => {
    const messages = this._moderatorContactEmails.map(email => ({
      to: email,
      from: sendGridVerifiedSender, // Sender's email address
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
