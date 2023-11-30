import { Success, Error } from "./simple-comment-types"

export abstract class AbstractNotificationService {
  /**
   * Send notification to moderators
   */
  abstract notifyModerators: (
    message: string
  ) => Promise<Success | Error> | void
}
