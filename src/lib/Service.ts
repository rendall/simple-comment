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
  private abstractError: Error = {
    statusCode: 500,
    body: "Implementation error: extend Service class"
  }

  /**
   * Accept a user name and password, return authentication token
   *
   * returns AuthToken
   **/
  abstract authPOST = (username: string, password: string) =>
    new Promise<AuthToken | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  /**
   * Accept a user name and password, return authentication token
   *
   * returns AuthToken
   **/
  abstract authGET = (username: string, password: string) =>
    new Promise<AuthToken | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  /**
   * Create user
   * returns Success | Error
   **/
  abstract userPOST = (newUser: NewUser, authUserId?: UserId) =>
    new Promise<Success<User> | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  /**
   * Read user
   *
   * userId byte[]
   * returns User
   **/
  abstract userGET = (userId?: UserId, authUserId?: UserId) =>
    new Promise<Success<Partial<User>> | Error>(async (resolve, reject) =>
      reject("Error: not implemented")
    )
  /**
   * Read all users
   *
   * returns List
   **/
  abstract userListGET = (authUserId?: UserId) =>
    new Promise<Success<AdminSafeUser[] | PublicSafeUser[]> | Error>(
      async (resolve, reject) => reject("Error: not implemented")
    )

  /**
   * Update user
   *
   * userId byte[]
   * returns Success
   **/
  abstract userPUT = (
    targetId: UserId,
    user: UpdateUser,
    authUserId?: UserId
  ) =>
    new Promise<Success<User> | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  /**
   * Delete user
   *
   * userId byte[]
   * returns Success
   **/
  abstract userDELETE = (userId: UserId, authUser: UserId) =>
    new Promise<Success | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  /**
   * Create a comment
   *
   * topicId byte[] or commentId byte[]
   * returns Comment
   **/
  abstract commentPOST = (
    parentId: TopicId | CommentId,
    text: string,
    authUser?: UserId
  ) =>
    new Promise<Success<Comment> | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  /**
   * Read a comment
   *
   * topicId byte[]
   * commentId byte[]
   * returns Comment
   **/
  abstract commentGET = (targetId: TopicId | CommentId, authUserId?: UserId) =>
    new Promise<Success<Comment | Discussion> | Error>(
      async (resolve, reject) => reject("Error: not implemented")
    )

  /**
   * Update a specific comment
   *
   * topicId byte[]
   * commentId byte[]
   * returns Comment
   **/
  abstract commentPUT = (
    targetId: CommentId,
    text: string,
    authUser?: UserId
  ) =>
    new Promise<Success<Comment> | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  /**
   * Delete a specific comment
   *
   * topicId byte[]
   * commentId byte[]
   * returns Success
   **/
  abstract commentDELETE = (
    topicId: TopicId,
    commentId: CommentId,
    authUser: UserId
  ) =>
    new Promise<Success | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  /**
   * returns an authenticated guest token
   **/
  abstract gauthGET = () =>
    new Promise<AuthToken | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  /**
   * Create a discussion
   *
   * topicId
   * authUserId
   * returns Success 201
   **/
  abstract topicPOST = (topic: Topic, authUserId?: UserId) =>
    new Promise<Success<Discussion> | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  /**
   * Read specific discussion
   *
   * topicId byte[]
   * returns Discussion
   **/
  abstract topicGET = (topicId: TopicId, authUser?: UserId) =>
    new Promise<Success<Discussion> | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  /**
   * Read a list of all discussions
   * Discussion discovery
   *
   * returns List
   **/
  abstract topicListGET = (authUser?: UserId) =>
    new Promise<Success<Discussion[]> | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  abstract topicPUT = (
    topicId: TopicId,
    topic: Pick<Topic, "title" | "isLocked">,
    authUserId?: UserId
  ) =>
    new Promise<Success<Topic> | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  /**
   * Delete a discussion
   *
   * topicId byte[]
   * returns Success
   **/
  abstract topicDELETE = (topicId: TopicId, authUser?: UserId) =>
    new Promise<Success | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  abstract authDELETE = () =>
    new Promise<Success | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  abstract verifyGET = (authToken: AuthToken) =>
    new Promise<Success<TokenClaim> | Error>((resolve, reject) =>
      reject("Error: not implemented")
    )

  /**
   * Close connections, cleanup
   **/
  abstract close = (): Promise<void> =>
    new Promise<void>((resolve, reject) => reject("Error: not implemented"))
}
