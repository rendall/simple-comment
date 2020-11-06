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
   * View a specific comment
   *
   * discussionId byte[] 
   * commentId byte[] 
   * returns Comment
   **/
  abstract commentGET = (discussionId: DiscussionId, commentId: CommentId, authUser?: UserId) => new Promise<Comment | Error>((resolve, reject) => {
    reject(this.abstractError)
  });



  /**
   * Edit a specific comment
   *
   * discussionId byte[] 
   * commentId byte[] 
   * returns Comment
   **/
  abstract commentPUT = (discussionId: DiscussionId, commentId: CommentId, authUser: UserId) => new Promise<Comment | Error>((resolve, reject) => {
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
   * View specific discussion
   *
   * discussionId byte[] 
   * returns Discussion
   **/
  abstract discussionGET = (discussionId: DiscussionId, authUser?: UserId) => new Promise<Discussion | Error>((resolve, reject) => {
    reject(this.abstractError)
  });



  /**
   * Post a comment to specific discussion
   *
   * discussionId byte[] 
   * returns Comment
   **/
  abstract commentPOST = (discussionId: DiscussionId, parentComment: (CommentId | null), authUser: UserId) => new Promise<Comment | Error>((resolve, reject) => {
    reject(this.abstractError)
  });



  /**
   * Discussion discovery
   * Receive a listing of all discussions
   *
   * returns List
   **/
  abstract discussionListGET = (authUser?: UserId) => new Promise<Discussion[] | Error>((resolve, reject) => {
    reject(this.abstractError)
  });



  /**
   * List all users
   *
   * returns List
   **/
  abstract userListGET = (authUser?: UserId) => new Promise<User[] | Error>((resolve, reject) => {
    reject(this.abstractError)
  });



  /**
   * User created
   * returns User
   **/
  abstract userPOST = () => new Promise<User | Error>((resolve, reject) => {
    reject(this.abstractError)
  });



  /**
   * Delete a user
   *
   * userId byte[] 
   * returns Success
   **/
  abstract userDELETE = (userId: UserId, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
    reject(this.abstractError)
  });



  /**
   * View user
   *
   * userId byte[] 
   * returns User
   **/
  abstract userGET = (userId: UserId, authUser?: UserId) => new Promise<User | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Edit a user
   *
   * userId byte[] 
   * returns Success
   **/
  abstract userPUT = (userId: UserId, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
    reject(this.abstractError)
  });

  /**
   * Close connections, cleanup
   **/
  abstract destroy = () => new Promise<void>((resolve, reject) => reject(this.abstractError))
}
