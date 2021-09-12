import { NotifyService } from "./NotifyService"
import sgMail from "@sendgrid/mail";
import * as dotenv from "dotenv"
dotenv.config()

export class SendGridService extends NotifyService {
  constructor() {
    super()
    sgMail.setApiKey(process.env.NOTIFY_FROM_EMAIL_API_KEY)
  }

  sendNotice = (to: string, subject: string, text: string) => {
    const from = process.env.NOTIFY_FROM_EMAIL
    sgMail.send({to, from, text, subject })
  }
}
