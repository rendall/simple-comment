import type { ActionType, Policy, UserId } from "./simple-comment-types"
import { Action } from "./simple-comment-types"
import policy from "../policy.json"
import { isGuestId } from "../lib/utilities"

/** Return true iff action can be performed by user according to
 * policy, false otherwise
 *
 * This is the central enforcement for policy and all logic should be moved here
 * */
export const isUserAllowedTo = (
  userId: UserId,
  action: ActionType,
  p: Policy = policy
): true | string => {
  switch (action) {
    case Action.postComment:
      if (!p.isGuestAccountAllowed && isGuestId(userId))
        return "Guest accounts are forbidden to comment by policy isGuestAllowed: false"
      return true

    default:
      console.error(`Unknown action ${action} in policy enforcement`)
      return `Error in policy enforcement`
  }
}
