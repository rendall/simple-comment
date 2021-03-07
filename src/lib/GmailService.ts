import { NotifyService } from "./NotifyService"
import nodemailer from "nodemailer"
import * as dotenv from "dotenv"
import Mail from "nodemailer/lib/mailer"
dotenv.config()
// cribbed from here: https://blog.mailtrap.io/nodemailer-gmail/

export class GmailService extends NotifyService {
  transporter: Mail

  constructor() {
    super()
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NOTIFY_FROM_EMAIL,
        pass: process.env.NOTIFY_FROM_EMAIL_PASSWORD
      }
    })
  }

  sendNotice = (to: string, subject: string, text: string) => {
    const mailOptions = {
      from: process.env.NOTIFY_FROM_EMAIL,
      to,
      subject,
      text
    }
    this.transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        throw error
      } else {
        console.log("Email sent: " + info.response)
      }
    })
  }
}
