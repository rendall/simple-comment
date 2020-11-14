class Policy {
  maxCommentLengthChars = 5000
  canUserDeleteSelf = true
  canPublicRead = true
  canPublicCreateUser = true
}

export const policy = new Policy()
