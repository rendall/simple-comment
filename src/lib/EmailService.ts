export abstract class EmailService {
  abstract sendEmail = (to: string, subject: string, text: string) => {}
}
