import { isUserAllowedTo } from "../lib/policyEnforcement"
import { Action, Policy, User } from "../lib/simple-comment"

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
  maxCommentLengthChars: 0
}

const mockGuestUser: User = {
  id: "6e3c9dd2-fb1f-4c10-8d19-c6bdc0156b07",
  name: "",
  email: ""
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
