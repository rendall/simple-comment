import type {
  AuthToken,
  Comment,
  CommentId,
  Discussion,
  TopicId,
  Error,
  Success,
  User,
  UserId,
  Topic,
  AdminSafeUser,
  PublicSafeUser,
  UpdateUser,
  NewUser,
  TokenClaim
} from "./simple-comment"

export abstract class Service {
  /**
   * Accept a user name and password, return authentication token
   *
   * returns AuthToken
   **/
  abstract authPOST: (
    username: string,
    password: string
  ) => Promise<AuthToken | Error>

  /**
   * Accept a user name and password, return authentication token
   *
   * returns AuthToken
   **/
  abstract authGET: (
    username: string,
    password: string
  ) => Promise<AuthToken | Error>

  /**
   * Create user
   * returns Success | Error
   **/
  abstract userPOST: (
    newUser: NewUser,
    authUserId?: UserId
  ) => Promise<Success<User> | Error>

  /**
   * Read user
   *
   * userId byte[]
   * returns User
   **/
  abstract userGET: (
    userId?: UserId,
    authUserId?: UserId
  ) => Promise<Success<Partial<User>> | Error>
  /**
   * Read all users
   *
   * returns List
   **/
  abstract userListGET: (
    authUserId?: UserId
  ) => Promise<Success<AdminSafeUser[] | PublicSafeUser[]> | Error>

  /**
   * Update user
   *
   * userId byte[]
   * returns Success
   **/
  abstract userPUT: (
    targetId: UserId,
    user: UpdateUser,
    authUserId?: UserId
  ) => Promise<Success<User> | Error>

  /**
   * Delete user
   *
   * userId byte[]
   * returns Success
   **/
  abstract userDELETE: (
    userId: UserId,
    authUser: UserId
  ) => Promise<Success | Error>

  /**
   * Create a comment
   *
   * topicId byte[] or commentId byte[]
   * returns Comment
   **/
  abstract commentPOST: (
    parentId: TopicId | CommentId,
    text: string,
    authUser?: UserId
  ) => Promise<Success<Comment> | Error>

  /**
   * Read a comment
   *
   * topicId byte[]
   * commentId byte[]
   * returns Comment
   **/
  abstract commentGET: (
    targetId: TopicId | CommentId,
    authUserId?: UserId
  ) => Promise<Success<Comment | Discussion> | Error>

  /**
   * Update a specific comment
   *
   * topicId byte[]
   * commentId byte[]
   * returns Comment
   **/
  abstract commentPUT: (
    targetId: CommentId,
    text: string,
    authUser?: UserId
  ) => Promise<Success<Comment> | Error>

  /**
   * Delete a specific comment
   *
   * topicId byte[]
   * commentId byte[]
   * returns Success
   **/
  abstract commentDELETE: (
    topicId: TopicId,
    commentId: CommentId,
    authUser: UserId
  ) => Promise<Success | Error>

  /**
   * returns an authenticated guest token
   **/
  abstract gauthGET: () => Promise<AuthToken | Error>

  /**
   * Create a discussion
   *
   * topicId
   * authUserId
   * returns Success 201
   **/
  abstract topicPOST: (
    topic: Topic,
    authUserId?: UserId
  ) => Promise<Success<Discussion> | Error>

  /**
   * Read specific discussion
   *
   * topicId byte[]
   * returns Discussion
   **/
  abstract topicGET: (
    topicId: TopicId,
    authUser?: UserId
  ) => Promise<Success<Discussion> | Error>

  /**
   * Read a list of all discussions
   * Discussion discovery
   *
   * returns List
   **/
  abstract topicListGET: (
    authUser?: UserId
  ) => Promise<Success<Discussion[]> | Error>

  abstract topicPUT: (
    topicId: TopicId,
    topic: Pick<Topic, "title" | "isLocked">,
    authUserId?: UserId
  ) => Promise<Success<Topic> | Error>

  /**
   * Delete a discussion
   *
   * topicId byte[]
   * returns Success
   **/
  abstract topicDELETE: (
    topicId: TopicId,
    authUser?: UserId
  ) => Promise<Success | Error>

  abstract authDELETE: () => Promise<Success | Error>

  abstract verifyGET: (
    authToken: AuthToken
  ) => Promise<Success<TokenClaim> | Error>

  /**
   * Close connections, cleanup
   **/
  abstract close: () => Promise<void>
}
