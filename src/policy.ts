class Policy {
  canGuestCreateUser = true // can a user with guest credentials create (their own) user profile? if 'canPublicCreateUser' is set to 'true' this setting is ignored
  canGuestReadDiscussion = true // can a user with guest credentials browse and read discussions? if 'canPublicReadDiscussion' is set to 'true' this setting is ignored
  canGuestReadUser = true // can a user with guest credentials view user profiles? if 'canPublicReadUser' is true, this setting is ignored
  canPublicCreateUser = false // can a user with no credentials create (their own) user profile?
  canPublicReadDiscussion = true // can a user with no credentials browse and read discussions?
  canPublicReadUser = true // can an anonymous visitor view any user's profile?
  canUserDeleteSelf = true // can a user delete their own profile?
  canFirstVisitCreateTopic = true // if a discussion does not exist for a page, shall it be created when visited for the first time, or does admin create all topics?
  maxCommentLengthChars = 5000 // Attempting to post a comment longer than this number of characters will be rejected by the API
}

export const policy = new Policy()
