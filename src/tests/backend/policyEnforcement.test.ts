import { isUserAllowedTo } from "../../lib/policyEnforcement"
import type { Policy, User } from "../../lib/simple-comment-types"
import { Action } from "../../lib/simple-comment-types"

const mockPolicy: Policy = {
  isGuestAccountAllowed: false,
  canFirstVisitCreateTopic: false,
  canGuestCreateUser: false,
  canGuestReadDiscussion: false,
  canGuestReadUser: false,
  canPublicCreateUser: false,
  canPublicReadDiscussion: false,
  canPublicReadUser: false,
  canUserDeleteSelf: false,
  maxCommentLengthChars: 0,
}

const mockGuestUser: User = {
  id: "guest-ih517-c1m4i",
  name: "",
  email: "",
}

describe("isUserAllowedTo", () => {
  describe("isGuestAccountAllowed:false", () => {
    it("returns a policy error when a guest tries to post a comment and guest accounts are disabled", () => {
      const policyCheck = isUserAllowedTo(
        mockGuestUser.id,
        Action.postComment,
        { ...mockPolicy, isGuestAccountAllowed: false }
      )
      expect(policyCheck).toBe(
        "Guest accounts are forbidden to comment by policy isGuestAllowed: false"
      )
    })
  })

  describe("isGuestAccountAllowed:true", () => {
    it("allows a guest to post a comment when guest accounts are enabled", () => {
      const policyCheck = isUserAllowedTo(
        mockGuestUser.id,
        Action.postComment,
        { ...mockPolicy, isGuestAccountAllowed: true }
      )
      expect(policyCheck).toBe(true)
    })
  })
})
