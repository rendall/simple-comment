import { AbstractNotificationService } from "./AbstractNotificationService"

export class NoOpNotificationService extends AbstractNotificationService {
  notifyModerators = (message: string): void => {
    console.info(`NoOpNotificationService: ${message}`)
  }
}
