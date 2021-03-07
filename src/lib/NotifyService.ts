export abstract class NotifyService {
  abstract sendNotice = (to: string, subject: string, text: string) => {}
}
