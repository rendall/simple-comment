import type { Success, Error } from "./simple-comment-types"

export abstract class AbstractNotificationService {
  // TypeScript cannot declare an abstract static method. Providers override this
  // factory to consume their own configuration and return their implementation.
  static createNotificationService = ():
    | AbstractNotificationService
    | undefined => {
    throw new globalThis.Error(
      "Notification providers must implement createNotificationService"
    )
  }

  /**
   * Send notification to moderators
   */
  abstract notifyModerators: (
    message: string
  ) => Promise<Success | Error> | void
}
