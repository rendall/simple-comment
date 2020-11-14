class Policy {
  maxCommentLengthChars = 5000
  userCanDeleteSelf = true
  publicCanRead = true
  publicCanCreateUser = true
}

export const policy = new Policy()