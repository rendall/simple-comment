import type { AuthToken, Comment, CommentId, Discussion, DiscussionId, Error, Success, User, UserId } from "./simple-comment";

export abstract class Service {

  private abstractError: Error = {
    code: 500,
    message: "Implementation error: extend Service class"
  }

  /**
   * Accept a user name and password, return authentication token
   *
   * returns AuthToken
   **/
  abstract authPOST = (username: string, password: string) => new Promise<AuthToken | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Create user
   * returns Success | Error
   **/
  abstract userPOST = (newUser: User, newPassword: string) => new Promise<User | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Read user
   *
   * userId byte[] 
   * returns User
   **/
  abstract userGET = (userId: UserId, authUser?: UserId) => new Promise<User | Error>((resolve, reject) => {
    reject(this.abstractError)
  });
  /**
   * Read all users
   *
   * returns List
   **/
  abstract userListGET = (authUser?: UserId) => new Promise<User[] | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Update user
   *
   * userId byte[] 
   * returns Success
   **/
  abstract userPUT = (user: Partial<User>, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Delete user
   *
   * userId byte[] 
   * returns Success
   **/
  abstract userDELETE = (userId: UserId, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Create a comment
   *
   * discussionId byte[] 
   * returns Comment
   **/
  abstract commentPOST = (parentId: (DiscussionId | CommentId), comment: Partial<Comment>, authUser?: UserId) => new Promise<Comment | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Read a comment
   *
   * discussionId byte[] 
   * commentId byte[] 
   * returns Comment
   **/
  abstract commentGET = (discussionId: DiscussionId, commentId: CommentId, authUser?: UserId) => new Promise<Comment | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Update a specific comment
   *
   * discussionId byte[] 
   * commentId byte[] 
   * returns Comment
   **/
  abstract commentPUT = (discussionId: DiscussionId, commentId: CommentId, authUser: UserId) => new Promise<Comment | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Delete a specific comment
   *
   * discussionId byte[] 
   * commentId byte[] 
   * returns Success
   **/
  abstract commentDELETE = (discussionId: DiscussionId, commentId: CommentId, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Create a discussion
   * 
   * discussionId
   * authUserId
   * returns Success 201
   **/
  abstract discussionPOST = (discussionId: DiscussionId, authUserId: UserId) => new Promise<Discussion | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Read specific discussion
   *
   * discussionId byte[] 
   * returns Discussion
   **/
  abstract discussionGET = (discussionId: DiscussionId, authUser?: UserId) => new Promise<Discussion | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Read a list of all discussions
   * Discussion discovery
   *
   * returns List
   **/
  abstract discussionListGET = (authUser?: UserId) => new Promise<Discussion[] | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  discussionPUT = (discussion: Discussion, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Delete a discussion
   *
   * discussionId byte[] 
   * returns Success
   **/
  abstract discussionDELETE = (discussionId: DiscussionId, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Close connections, cleanup
   **/
  abstract destroy = () => new Promise<void>((resolve, reject) => reject(this.abstractError))
}