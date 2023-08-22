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
    it("should not post comment", () => {
      const policyCheck = isUserAllowedTo(
        mockGuestUser.id,
        Action.postComment,
        { ...mockPolicy, isGuestAccountAllowed: false }
      )
      expect(policyCheck).not.toBe(true)
    })
  })

  describe("isGuestAccountAllowed:true", () => {
    it("should post comment", () => {
      const policyCheck = isUserAllowedTo(
        mockGuestUser.id,
        Action.postComment,
        { ...mockPolicy, isGuestAccountAllowed: true }
      )
      expect(policyCheck).toBe(true)
    })
  })
})
