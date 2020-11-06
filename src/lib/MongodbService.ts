import type { AuthToken, Comment, CommentId, Discussion, DiscussionId, Error, Success, User, UserId } from "./simple-comment";
import { Service } from "./Service";
import { Db, MongoClient } from "mongodb";
import { comparePassword, getAuthToken } from "./crypt";
import { user401, user404 } from "./errors";

export class MongodbService extends Service {

  private genericError: Error = {
    code: 500,
    message: "Implementation error: Method not implemented"
  }

  readonly connectionString: string
  readonly dbName: string

  private _client: MongoClient
  private _db: Db

  private getClient = async () => {
    if (this._client) return this._client

    this._client = await MongoClient.connect(this.connectionString, {
      useNewUrlParser: true, useUnifiedTopology: true
    });

    return this._client
  }

  private getDb = async () => {
    if (this._db) return this._db

    const client = await this.getClient()
    this._db = await client.db(this.dbName);

    return this._db
  }

  constructor(connectionString: string, dbName: string) {
    super()

    this.connectionString = connectionString
    this.dbName = dbName
  }

  /**
   * Accept a user name and password, return authentication token
   *
   * returns AuthToken
   **/
  authPOST = (username: string, password: string) => new Promise<AuthToken | Error>((resolve, reject) =>
    this.getDb()
      .then(db => db.collection("users"))
      .then(users => users.findOne({ id: username }))
      .then(async (user: User) => {
        if (user === null) reject(user404)
        else {
          const isSame = await comparePassword(password, user.hash)
          if (!isSame) reject(user401)
          else {
            const authToken = getAuthToken(user.id)
            resolve(authToken)
          }
        }
      })
  );



  /**
   * Delete a specific comment
   *
   * discussionId byte[] 
   * commentId byte[] 
   * returns Success
   **/
  commentDELETE = (discussionId: DiscussionId, commentId: CommentId, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
    reject(this.genericError)
  });



  /**
   * View a specific comment
   *
   * discussionId byte[] 
   * commentId byte[] 
   * returns Comment
   **/
  commentGET = (discussionId: DiscussionId, commentId: CommentId, authUser?: UserId) => new Promise<Comment | Error>((resolve, reject) => {
    reject(this.genericError)
  });



  /**
   * Edit a specific comment
   *
   * discussionId byte[] 
   * commentId byte[] 
   * returns Comment
   **/
  commentPUT = (discussionId: DiscussionId, commentId: CommentId, authUser: UserId) => new Promise<Comment | Error>((resolve, reject) => {
    reject(this.genericError)
  });



  /**
   * Delete a discussion
   *
   * discussionId byte[] 
   * returns Success
   **/
  discussionDELETE = (discussionId: DiscussionId, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
    reject(this.genericError)
  });



  /**
   * View specific discussion
   *
   * discussionId byte[] 
   * returns Discussion
   **/
  discussionGET = (discussionId: DiscussionId, authUser?: UserId) => new Promise<Discussion | Error>((resolve, reject) => {
    reject(this.genericError)
  });



  /**
   * Post a comment to specific discussion
   *
   * discussionId byte[] 
   * returns Comment
   **/
  commentPOST = (discussionId: DiscussionId, parentComment: (CommentId | null), authUser: UserId) => new Promise<Comment | Error>((resolve, reject) => {
    reject(this.genericError)
  });



  /**
   * Discussion discovery
   * Receive a listing of all discussions
   *
   * returns List
   **/
  discussionListGET = (authUser?: UserId) => new Promise<Discussion[] | Error>((resolve, reject) => {
    reject(this.genericError)
  });



  /**
   * List all users
   *
   * returns List
   **/
  userListGET = (authUser?: UserId) => new Promise<User[] | Error>((resolve, reject) => {
    reject(this.genericError)
  });



  /**
   * User created
   * returns User
   **/
  userPOST = () => new Promise<User | Error>((resolve, reject) => {
    reject(this.genericError)
  });



  /**
   * Delete a user
   *
   * userId byte[] 
   * returns Success
   **/
  userDELETE = (userId: UserId, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
    reject(this.genericError)
  });



  /**
   * View user
   *
   * userId byte[] 
   * returns User
   **/
  userGET = (userId: UserId, authUser?: UserId) => new Promise<User | Error>((resolve, reject) => {
    reject(this.genericError)
  });



  /**
   * Edit a user
   *
   * userId byte[] 
   * returns Success
   **/
  userPUT = (userId: UserId, authUser: UserId) => new Promise<Success | Error>((resolve, reject) => {
    reject(this.genericError)
  });

  destroy = async () => {
    await this.getClient().then(client => client.close())
  }
}