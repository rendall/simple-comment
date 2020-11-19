class Policy {
  canPublicCreateTopic = true
  canPublicCreateUser = true
  canPublicRead = true
  canUserDeleteSelf = true
  maxCommentLengthChars = 5000
  refererRestrictions = true
}

export const policy = new Policy()
