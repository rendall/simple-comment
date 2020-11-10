import type { AuthToken, Comment, CommentId, Discussion, TopicId, Error, NewComment, Success, User, UserId, Topic } from "./simple-comment";
import { Service } from "./Service";
import { Collection, Db, InsertOneWriteOpResult, MongoClient, WithId } from "mongodb";
import { comparePassword, getAuthToken, hashPassword } from "./crypt";
import { success200OK, error404CommentNotFound, success201UserCreated, error401BadCredentials, error404UserUnknown, error400UserExists, error401UserNotAuthenticated, error403UserNotAuthorized, error400TopicExists, error400UserIdMissing, error500ServerError, success202UserDeleted } from "./messages";
import { removeProps } from "./utilities";
import { policy } from "../policy";

export class MongodbService extends Service {

  private genericError: Error = {
    code: 500,
    message: "Implementation error: Method not implemented"
  }

  readonly connectionString: string
  readonly dbName: string
  private _client: MongoClient
  private _db: Db

  getClient = async () => {
    if (this._client && this._client.isConnected()) return this._client
    this._client = await MongoClient.connect(this.connectionString, {
      useNewUrlParser: true, useUnifiedTopology: true
    });
    return this._client
  }

  getDb = async () => {
    if (this._db && this._client.isConnected()) return this._db
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
        if (user === null) reject(error404UserUnknown)
        else {
          const isSame = await comparePassword(password, user.hash)
          if (!isSame) reject(error401BadCredentials)
          else {
            const authToken = getAuthToken(user.id)
            resolve(authToken)
          }
        }
      })
  );

  /**
   * User created
   * returns User
   **/
  userPOST = (newUser: User, newUserPassword: string) => new Promise<Success<User> | Error>(async (resolve, reject) => {
    const users: Collection<User> = (await this.getDb()).collection("users")
    const oldUser = await users.findOne({ id: newUser.id })
    if (oldUser) {
      reject(error400UserExists)
      return
    }
    const hash = await hashPassword(newUserPassword)
    const user: User = { ...newUser, hash } as User
    users.insertOne(user).then((result: InsertOneWriteOpResult<WithId<User>>) => {
      resolve({ ...success201UserCreated, message: `User '${user.id}' created` })
    })
  });

  /**
   * Read user
   *
   * userId byte[] 
   * returns User
   **/
  userGET = (userId?: UserId, authUserId?: UserId) => new Promise<Success<Partial<User>> | Error>(async (resolve, reject) => {
    const users: Collection<User> = (await this.getDb()).collection("users")
    const foundUser = await users.findOne({ id: userId })
    if (!foundUser) {
      reject(error404UserUnknown)
      return
    }
    const authUser = await users.findOne({ id: authUserId })
    const isAdmin = authUser ? authUser.isAdmin : false
    const outUser = isAdmin ? removeProps(foundUser, ["hash"]) : removeProps(foundUser, ["hash", "email"])
    resolve({ ...success200OK, body: outUser })
  });

  /**
   * List users
   *
   * returns List
   **/
  userListGET = (authUserId?: UserId) => new Promise<Success<User[]> | Error>(async (resolve, reject) => {
    const usersCollection: Collection<User> = (await this.getDb()).collection("users")
    const users = await usersCollection.find({}).toArray()
    const authUser = users.find(u => u.id === authUserId)
    const isAdmin = authUser ? authUser.isAdmin : false

    const outUsers = isAdmin ? users.map(u => ({ ...u, hash: undefined })) : users.map(u => ({ ...u, email: undefined, hash: undefined }))

    resolve({ ...success200OK, body: outUsers })
  });

  /**
   * Update a user
   *
   * userId byte[] 
   * returns Success
   **/
  userPUT = (user: Partial<User>, authUserId?: UserId) => new Promise<Success<User> | Error>(async (resolve, reject) => {
    const users: Collection<User> = (await this.getDb()).collection("users")
    if (!user.hasOwnProperty("id")) {
      reject(error400UserIdMissing)
      return
    }
    const foundUser = await users.findOne({ id: user.id })
    if (!foundUser) {
      reject(error404UserUnknown)
      return
    }
    const authUser = await users.findOne({ id: authUserId })
    const canPut = authUser ? authUser.isAdmin || authUserId === foundUser.id : false
    if (!canPut) {
      reject(error403UserNotAuthorized)
      return
    }
    users.updateOne({ id: user.id }, user).then(x => resolve(success200OK)).catch(e => reject(error500ServerError))
  });

  /**
   * Delete a user
   *
   * userId byte[] 
   * returns Success
   **/
  userDELETE = (userId: UserId, authUserId?: UserId) => new Promise<Success | Error>(async(resolve, reject) => {
    const users: Collection<User> = (await this.getDb()).collection("users")
    const foundUser = await users.findOne({ id: userId })
    if (!foundUser) {
      reject(error404UserUnknown)
      return
    }
    const authUser = await users.findOne({ id: authUserId })
    if (!authUser) {
      reject(error401UserNotAuthenticated)
      return
    }
    const canDelete = authUser.isAdmin || (authUserId === userId && policy.userCanDeleteSelf)
    if (!canDelete) {
      reject(error403UserNotAuthorized)
      return
    }
    users.deleteOne({id:userId})
     .then(x => resolve(success202UserDeleted))
     .catch(e => authUser.isAdmin? reject({ ...error500ServerError, body:e }): reject( error500ServerError ))
  });

  /**
   * Create a comment
   *
   * parentId byte[] 
   * returns Comment
   **/
  commentPOST = (parentId: (TopicId | CommentId), comment: Pick<Comment, "text" | "user">, authUserId?: UserId) => new Promise<Success<Comment> | Error>(async (resolve, reject) => {
    if (!authUserId) {
      reject(error401UserNotAuthenticated)
      return
    }
    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.findOne({ id: authUserId })
    if (!authUser) {
      reject(error401UserNotAuthenticated)
      return
    }
    const comments: Collection<Comment | NewComment | Discussion> = (await this.getDb()).collection("comments")
    const parent = await comments.findOne({ id: parentId })
    if (!parent) {
      reject({ ...error404CommentNotFound, message: `parentId '${parentId}' not found` })
      return
    }
    const insertComment: NewComment = { ...comment, dateCreated: new Date(), parentId } as NewComment
    comments.insertOne(insertComment).then((response: InsertOneWriteOpResult<WithId<Comment>>) => {
      const insertedComment: Comment = response.ops.find(x => true)
      if (insertComment.parentId !== parentId) reject({ code: 500, message: "Database insertion error" })
      else resolve({ code: 201, message: `Comment '${insertComment.id}' created`, body: insertedComment })
    }).catch(e => {
      console.error(e)
      authUser.isAdmin? reject({...error500ServerError, body:e}) : reject(error500ServerError)
    })
  })

  /**
   * Read a comment
   *
   * discussionId byte[] 
   * commentId byte[] 
   * returns Comment
   **/
  commentGET = (targetId: (TopicId | CommentId), authUserId?: UserId) => new Promise<Success<Comment> | Error>(async (resolve, reject) => {
    if (!authUserId && !policy.publicCanRead) {
      reject(error401UserNotAuthenticated)
      return
    }
    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.findOne({ id: authUserId })
    if (!authUser && !policy.publicCanRead) {
      reject(error401UserNotAuthenticated)
      return
    }
    const isAdmin = authUser? authUser.isAdmin : false
    const comments: Collection<Comment | NewComment | Discussion> = (await this.getDb()).collection("comments")
    const comment = await comments.findOne({ id: targetId })
    if (!comment) {
      reject({ ...error404CommentNotFound, message: `comment '${targetId}' not found` })
      return
    }
    
  });

  /**
   * Update a comment
   *
   * discussionId byte[] 
   * commentId byte[] 
   * returns Comment
   **/
  commentPUT = (comment: Comment, authUserId?: UserId) => new Promise<Success<Comment> | Error>((resolve, reject) => {
    reject(this.genericError)
  });

  /**
   * Delete a comment
   *
   * discussionId byte[] 
   * commentId byte[] 
   * returns Success
   **/
  commentDELETE = (commentId: CommentId, authUserId?: UserId) => new Promise<Success | Error>((resolve, reject) => {
    reject(this.genericError)
  });

  /**
   * Create a discussion
   * 
   * Discussion
   * 
   * discussionId
   * authUserId
   * returns Success 201
   **/
  topicPOST = (topic: Topic, authUserId?: UserId) => new Promise<Success<Topic> | Error>(async (resolve, reject) => {
    if (!authUserId) {
      reject(error401UserNotAuthenticated)
      return
    }
    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.findOne({ id: authUserId })
    if (!authUser) {
      reject(error401UserNotAuthenticated)
      return
    }
    if (!authUser.isAdmin) {
      reject(error403UserNotAuthorized)
      return
    }
    const discussions: Collection<Discussion> = (await this.getDb()).collection("discussions")
    const oldDiscussion = await discussions.findOne({ id: topic.id })
    if (oldDiscussion) {
      reject(error400TopicExists)
      return
    }
    discussions.insertOne(topic).then((response: InsertOneWriteOpResult<WithId<Discussion>>) => {
      const insertedDiscussion: Discussion = response.ops.find(x => true)
      if (insertedDiscussion.id !== topic.id) reject({ code: 500, message: "Database insertion error" })
      else resolve({ code: 201, message: `Discssion '${topic.title}' created` })
    }).catch(e => {
      console.error(e)
      reject({ code: 500, message: "Server error" })
    })
  });

  /**
   * Read a discussion
   *
   * discussionId byte[] 
   * returns Discussion
   **/
  topicGET = (discussionId: TopicId, authUserId?: UserId) => new Promise<Success<Discussion> | Error>((resolve, reject) => {
    reject(this.genericError)
  });

  /**
   * Read the list of discussions
   * Discussion discovery
   *
   * returns List
   **/
  topicListGET = (authUserId?: UserId) => new Promise<Success<Topic[]> | Error>((resolve, reject) => {
    reject(this.genericError)
  });

  /**
   * Update a discussion (lock it)
   *
   * discussionId byte[] 
   * returns Success
   **/
  topicPUT = (topic: Topic, authUser: UserId) => new Promise<Success<Topic> | Error>((resolve, reject) => {
    reject(this.genericError)
  });

  /**
   * Delete a discussion
   *
   * discussionId byte[] 
   * returns Success
   **/
  topicDELETE = (topicId: TopicId, authUserId?: UserId) => new Promise<Success | Error>((resolve, reject) => {
    reject(this.genericError)
  });

  destroy = async () => {
    await this.getClient().then(client => client.close())
  }
}