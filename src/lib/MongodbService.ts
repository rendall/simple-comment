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
  DeletedComment,
  PublicSafeUser,
  NewUser,
  UpdateUser,
  TokenClaim
} from "./simple-comment"
import {
  Collection,
  Cursor,
  Db,
  FindAndModifyWriteOpResultObject,
  FindOneOptions,
  InsertOneWriteOpResult,
  MongoClient,
  UpdateWriteOpResult,
  WithId
} from "mongodb"
import { Service } from "./Service"
import {
  adminOnlyModifiableUserProperties,
  isComment,
  isDeleted,
  isDeletedComment,
  toAdminSafeUser,
  toPublicSafeUser,
  toSafeUser
} from "./utilities"
import { policy } from "../policy"
import {
  error400CommentIdMissing,
  error400NoUpdate,
  error400PasswordMissing,
  error400TopicExists,
  error400UserIdMissing,
  error401BadCredentials,
  error401UserNotAuthenticated,
  error403Forbidden,
  error403ForbiddenToModify,
  error403UserNotAuthorized,
  error404CommentNotFound,
  error404TopicNotFound,
  error404UserUnknown,
  error409UserExists,
  error413CommentTooLong,
  error425DuplicateComment,
  error500ServerError,
  success200OK,
  success201UserCreated,
  success202CommentDeleted,
  success202LoggedOut,
  success202TopicDeleted,
  success202UserDeleted,
  success204CommentUpdated,
  success204UserUpdated
} from "./messages"
import { comparePassword, getAuthToken, hashPassword, uuidv4 } from "./crypt"

export class MongodbService extends Service {
  private isProduction = process.env.SIMPLE_COMMENT_MODE === "production"
  private _client: MongoClient
  private _db: Db
  readonly _connectionString: string
  readonly _dbName: string

  getClient = async () => {
    if (this._client && this._client.isConnected()) return this._client
    this._client = await MongoClient.connect(this._connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    return this._client
  }

  getDb = async () => {
    if (this._db && this._client.isConnected()) return this._db
    const client = await this.getClient()
    this._db = await client.db(this._dbName)
    return this._db
  }

  constructor(connectionString: string, dbName: string) {
    super()
    this._connectionString = connectionString
    this._dbName = dbName
  }

  /**
   * Accept a user name and password, return authentication token
   *
   * returns AuthToken
   **/
  authPOST = (username: string, password: string) =>
    new Promise<Success<AuthToken> | Error>((resolve, reject) =>
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
              resolve({ ...success200OK, body: authToken })
            }
          }
        })
    )

  authGET = this.authPOST

  /**
   * User created
   * returns User
   **/
  userPOST = (newUser: NewUser, authUserId?: UserId) =>
    new Promise<Success<AdminSafeUser> | Error>(async (resolve, reject) => {
      if (!authUserId && !policy.canPublicCreateUser) {
        reject({ error401UserNotAuthenticated })
        return
      }

      if (!newUser.id) {
        reject(error400UserIdMissing)
        return
      }

      if (newUser.id === process.env.SIMPLE_COMMENT_MODERATOR_ID) {
        reject(error403ForbiddenToModify)
        return
      }

      if (!newUser.password) {
        reject(error400PasswordMissing)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = await users.find({ id: authUserId }).limit(1).next()

      if (authUserId && !authUser) {
        reject({
          ...error404UserUnknown,
          body: "Authenticating user is unknown"
        })
        return
      }

      const hasAdminOnlyProps = adminOnlyModifiableUserProperties.some(prop =>
        newUser.hasOwnProperty(prop)
      )

      if (hasAdminOnlyProps && (!authUser || !authUser.isAdmin)) {
        reject({ ...error403ForbiddenToModify })
        return
      }

      const oldUser = await users.find({ id: newUser.id }).limit(1).next()

      if (oldUser) {
        reject(error409UserExists)
        return
      }

      const hash = await hashPassword(newUser.password)
      const user: User = { ...toAdminSafeUser(newUser), hash } as User

      users
        .insertOne(user)
        .then((result: InsertOneWriteOpResult<WithId<User>>) => {
          const body = toAdminSafeUser(user)
          resolve({ ...success201UserCreated, body })
        })
    })

  /**
   * Read user
   *
   * userId byte[]
   * returns User
   **/
  userGET = (userId?: UserId, authUserId?: UserId) =>
    new Promise<Success<PublicSafeUser | AdminSafeUser> | Error>(
      async (resolve, reject) => {
        const users: Collection<User> = (await this.getDb()).collection("users")
        const foundUser = await users.find({ id: userId }).limit(1).next()
        if (!foundUser) {
          reject(error404UserUnknown)
          return
        }
        const authUser = await users.findOne({ id: authUserId })
        const isAdmin = authUser ? authUser.isAdmin : false
        const outUser = toSafeUser(foundUser, isAdmin)
        resolve({ ...success200OK, body: outUser })
      }
    )

  /**
   * List users
   *
   * returns List
   **/
  userListGET = (authUserId?: UserId) =>
    new Promise<Success<AdminSafeUser[] | PublicSafeUser[]> | Error>(
      async (resolve, reject) => {
        const usersCollection: Collection<User> = (
          await this.getDb()
        ).collection("users")
        const users = await usersCollection.find({}).toArray()
        const authUser = users.find(u => u.id === authUserId)
        const isAdmin = authUser ? authUser.isAdmin : false
        const outUsers = isAdmin
          ? users.map(toAdminSafeUser)
          : users.map(toPublicSafeUser)

        resolve({ ...success200OK, body: outUsers })
      }
    )

  /**
   * Update a user
   *
   * NB: It is always safe to return AdminSafeUser because
   * authUser is always an admin or the user themself
   *
   * userId byte[]
   * returns Success<AdminSafeUser>
   **/
  userPUT = (targetId: UserId, user: UpdateUser, authUserId?: UserId) =>
    new Promise<Success<AdminSafeUser> | Error>(async (resolve, reject) => {
      if (!authUserId) {
        reject(error401UserNotAuthenticated)
        return
      }

      if (!user.hasOwnProperty("id")) {
        reject(error400UserIdMissing)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = await users.findOne({ id: authUserId })

      if (targetId !== authUser.id && !authUser.isAdmin) {
        reject(error403UserNotAuthorized)
        return
      }

      if (
        !authUser.isAdmin &&
        (Object.keys(user) as (keyof User)[]).some(key =>
          adminOnlyModifiableUserProperties.includes(key)
        )
      ) {
        reject(error403ForbiddenToModify)
        return
      }

      // At this point, user.id exists and authUser can alter it

      const foundUser = await users.find({ id: targetId }).limit(1).next()

      if (!foundUser) {
        reject(error404UserUnknown)
        return
      }

      const updatedUser = { ...foundUser, ...user }

      users
        .findOneAndUpdate({ id: updatedUser.id }, { $set: updatedUser })
        .then((x: FindAndModifyWriteOpResultObject<User>) => {
          // return isAdmin version of this user, because the user is either an admin or self
          const safeUser = toAdminSafeUser(updatedUser)

          resolve({ ...success204UserUpdated, body: safeUser })
        })
        .catch(e => reject(error500ServerError))
    })

  /**
   * Delete a user
   *
   * userId byte[]
   * returns Success
   **/
  userDELETE = (userId: UserId, authUserId?: UserId) =>
    new Promise<Success | Error>(async (resolve, reject) => {
      const users: Collection<User> = (await this.getDb()).collection("users")

      if (!authUserId) {
        reject(error401UserNotAuthenticated)
        return
      }

      //TODO: username admin as .env variable
      if (userId === process.env.SIMPLE_COMMENT_MODERATOR_ID) {
        reject(error403Forbidden)
        return
      }

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

      const canDelete =
        authUser.isAdmin || (authUserId === userId && policy.canUserDeleteSelf)

      if (!canDelete) {
        reject(error403UserNotAuthorized)
        return
      }

      //TODO: delete all of the user's comments, too!
      users
        .deleteOne({ id: userId })
        .then(x => resolve(success202UserDeleted))
        .catch(e =>
          authUser.isAdmin
            ? reject({ ...error500ServerError, body: e })
            : reject(error500ServerError)
        )
    })

  /**
   * Create a comment
   *
   * parentId byte[]
   * returns Comment
   **/
  commentPOST = (
    parentId: TopicId | CommentId,
    text: string,
    authUserId?: UserId
  ) =>
    new Promise<Success<Comment> | Error>(async (resolve, reject) => {
      if (!authUserId) {
        reject(error401UserNotAuthenticated)
        return
      }

      if (text.length > policy.maxCommentLengthChars) {
        reject(error413CommentTooLong)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = authUserId
        ? await users.findOne({ id: authUserId })
        : null

      if (authUserId && !authUser) {
        reject(error404UserUnknown)
        return
      }

      const comments: Collection<Comment | DeletedComment | Discussion> = (
        await this.getDb()
      ).collection("comments")
      const parent = await comments.findOne({ id: parentId })

      if (!parent || isDeleted(parent)) {
        reject({
          ...error404CommentNotFound,
          body: `Discussion '${parentId}' not found`
        })
        return
      }

      // Prevent duplicate comments
      const findOptions: FindOneOptions<Comment> = {
        sort: { dateCreated: -1 }
      }
      const lastComment = (await comments.findOne(
        { "user.id": authUserId },
        findOptions
      )) as Comment

      if (
        lastComment &&
        lastComment.text === text &&
        lastComment.parentId === parentId
      ) {
        reject(error425DuplicateComment)
        return
      }

      const adminSafeUser = toAdminSafeUser(authUser)
      const id = uuidv4()
      const insertComment: Comment = {
        id,
        text,
        dateCreated: new Date(),
        parentId,
        userId: authUserId
      } as Comment

      comments
        .insertOne(insertComment)
        .then((response: InsertOneWriteOpResult<WithId<Comment>>) => {
          const insertedComment: Comment = response.ops.find(x => true)

          if (insertComment.parentId !== parentId) {
            reject({
              statusCode: 500,
              body: "Database insertion error"
            })
            return
          }

          resolve({
            statusCode: 201,
            body: { ...insertedComment, user: adminSafeUser }
          })
        })
        .catch(e => {
          console.error(e)
          authUser.isAdmin
            ? reject({ ...error500ServerError, body: e })
            : reject(error500ServerError)
        })
    })

  /**
   * Read a comment
   *
   * discussionId byte[]
   * commentId byte[]
   * returns Comment
   **/
  commentGET = (targetId: TopicId | CommentId, authUserId?: UserId) =>
    new Promise<Success<Comment>>(async (resolve, reject) => {
      if (!targetId) {
        reject(error404CommentNotFound)
        return
      }

      if (!authUserId && !policy.canPublicRead) {
        reject(error401UserNotAuthenticated)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = authUserId
        ? await users.findOne({ id: authUserId })
        : null

      if (!authUser && !policy.canPublicRead) {
        reject(error401UserNotAuthenticated)
        return
      }

      const isAdmin = authUser ? authUser.isAdmin : false
      const comments: Collection<Comment | DeletedComment | Discussion> = (
        await this.getDb()
      ).collection("comments")
      const cursor = await comments.find({ id: targetId }).limit(1) //find({ id: targetId }, {id: 1}).limit(1)

      // just check to see if comment exists, without retrieving everything
      if (!cursor) {
        reject({
          ...error404CommentNotFound,
          body: `Comment '${targetId}' not found`
        })
        return
      }

      // if it does exist, check if it's correct without retrieving everything
      const foundComment = await cursor.next()
      if (!isComment(foundComment) || isDeletedComment(foundComment)) {
        reject({
          ...error404CommentNotFound,
          body: `Comment '${targetId}' not found`
        })
        return
      }

      const fullCommentPipeline = (id: CommentId, isAdminSafe: boolean) => [
        {
          $match: { id }
        },
        {
          $addFields: { isAdminSafe }
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "id",
            as: "userarr"
          }
        },
        {
          $addFields: {
            user: {
              $arrayElemAt: ["$userarr", 0]
            }
          }
        },
        {
          $graphLookup: {
            from: "comments",
            startWith: "$id",
            connectFromField: "id",
            connectToField: "parentId",
            as: "replies"
          }
        },
        {
          $unwind: {
            path: "$replies",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "replies.userId",
            foreignField: "id",
            as: "replies.userarr"
          }
        },
        {
          $addFields: {
            "replies.user": {
              $arrayElemAt: ["$replies.userarr", 0]
            }
          }
        },
        {
          $project: {
            "parentId": 1,
            "id": 1,
            "title": 1,
            "text": 1,
            "dateCreated": 1,
            "user.id": 1,
            "user.email": {
              $cond: {
                if: { $eq: ["$isAdminSafe", true] },
                then: "$user.email",
                else: "$$REMOVE"
              }
            },
            "user.name": 1,
            "user.isVerified": {
              $cond: {
                if: { $eq: ["$isAdminSafe", true] },
                then: "$user.isVerified",
                else: "$$REMOVE"
              }
            },
            "user.isAdmin": 1,
            "replies.parentId": 1,
            "replies.id": 1,
            "replies.text": 1,
            "replies.dateCreated": 1,
            "replies.user.id": 1,
            "replies.user.name": 1,
            "replies.user.isAdmin": 1,
            "replies.user.isVerified": {
              $cond: {
                if: { $eq: ["$isAdminSafe", true] },
                then: "$replies.user.isVerified",
                else: "$$REMOVE"
              }
            },
            "replies.user.email": {
              $cond: {
                if: { $eq: ["$isAdminSafe", true] },
                then: "$replies.user.email",
                else: "$$REMOVE"
              }
            }
          }
        },
        {
          $project: {
            "replies.userarr": 0,
            "replies.userId": 0,
            "replies.user.hash": 0,
            "user.hash": 0
          }
        },
        {
          $group: {
            _id: "$_id",
            id: {
              $first: "$id"
            },
            parentId: {
              $first: "$parentId"
            },
            text: {
              $first: "$text"
            },
            title: {
              $first: "$title"
            },
            user: {
              $first: "$user"
            },
            replies: {
              $push: "$replies"
            },
            dateCreated: {
              $first: "$dateCreated"
            },
            dateDeleted: {
              $first: "$dateDeleted"
            }
          }
        }
      ]

      const comment = (await comments
        .aggregate(fullCommentPipeline(targetId, isAdmin))
        .next()) as Comment
      const body = comment

      resolve({ ...success200OK, body })
    })

  /**
   * Update a comment
   *
   * discussionId byte[]
   * commentId byte[]
   * returns Comment
   **/
  commentPUT = (targetId: CommentId, text: string, authUserId?: UserId) =>
    new Promise<Success<Comment> | Error>(async (resolve, reject) => {
      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = await users.find({ id: authUserId }).limit(1).next()

      if (!authUser) {
        reject(error401UserNotAuthenticated)
        return
      }

      const comments: Collection<Comment | Discussion> = (
        await this.getDb()
      ).collection("comments")
      const foundComment = (await comments
        .find({ id: targetId })
        .limit(1)
        .next()) as Comment

      if (
        !foundComment ||
        !isComment(foundComment) ||
        isDeletedComment(foundComment)
      ) {
        reject({
          ...error404CommentNotFound,
          body: `Comment '${targetId}' not found`
        })
        return
      }

      if (foundComment.text === text) {
        reject(error400NoUpdate)
        return
      }

      const canEdit = authUser.isAdmin || authUser.id === foundComment.userId

      if (!canEdit) {
        reject(error403UserNotAuthorized)
        return
      }

      // can only edit text
      const user = toSafeUser(foundComment.user as User, authUser.isAdmin)
      const returnComment = { ...foundComment, text, user }

      comments
        .findOneAndUpdate({ id: foundComment.id }, { $set: returnComment })
        .then((x: FindAndModifyWriteOpResultObject<Comment>) =>
          resolve({
            ...success204CommentUpdated,
            body: returnComment
          })
        )
        .catch(e =>
          authUser.isAdmin
            ? reject({ ...error500ServerError, body: e })
            : reject(error500ServerError)
        )
    })

  /**
   * Delete a comment
   *
   * discussionId byte[]
   * commentId byte[]
   * returns Success
   **/
  commentDELETE = (targetId: CommentId, authUserId?: UserId) =>
    new Promise<Success | Error>(async (resolve, reject) => {
      if (!authUserId) {
        reject(error401UserNotAuthenticated)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = await users.find({ id: authUserId }).limit(1).next()

      if (!authUser) {
        reject(error404UserUnknown)
        return
      }

      const comments: Collection<Comment | Discussion> = (
        await this.getDb()
      ).collection("comments")
      const foundComment = await comments.find({ id: targetId }).limit(1).next()

      if (
        !foundComment ||
        !isComment(foundComment) ||
        isDeletedComment(foundComment)
      ) {
        reject({
          ...error404CommentNotFound,
          body: `Comment '${targetId}' not found`
        })
        return
      }

      const canDelete = authUser.isAdmin || authUser.id === foundComment.userId

      if (!canDelete) {
        reject(error403UserNotAuthorized)
        return
      }

      // If we delete a comment that has replies it will orphan
      // them, so first check for even one
      const reply = await comments.findOne({ parentId: targetId })

      if (reply) {
        // it cannot be deleted, but set user and text to null
        const deletedComment = {
          ...foundComment,
          userId: null,
          text: null,
          dateDeleted: new Date()
        }

        comments
          .updateOne({ id: foundComment.id }, { $set: deletedComment })
          .then(x => resolve({ ...success202CommentDeleted }))
          .catch(e =>
            authUser.isAdmin
              ? reject({ ...error500ServerError, body: e })
              : reject(error500ServerError)
          )
      } else {
        // entire comment can be deleted without trouble
        // but we don't want anyone to reply in the meantime, so lock it
        // using findOneAndDelete
        comments
          .findOneAndDelete({ id: foundComment.id })
          .then(x => resolve(success202CommentDeleted))
          .catch(e =>
            authUser.isAdmin
              ? reject({ ...error500ServerError, body: e })
              : reject(error500ServerError)
          )
      }
    })

  /**
   * Create a discussion
   *
   * Discussion
   *
   * discussionId
   * authUserId
   * returns Success 201
   **/
  topicPOST = (topic: Topic, authUserId?: UserId) =>
    new Promise<Success<Topic> | Error>(async (resolve, reject) => {
      if (!authUserId) {
        reject(error401UserNotAuthenticated)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = await users.findOne({ id: authUserId })

      if (!authUser) {
        reject(error404UserUnknown)
        return
      }

      if (!authUser.isAdmin) {
        reject(error403UserNotAuthorized)
        return
      }

      const discussions: Collection<Discussion> = (
        await this.getDb()
      ).collection("comments")
      const oldDiscussion = await discussions.findOne({ id: topic.id })

      if (oldDiscussion) {
        reject(error400TopicExists)
        return
      }

      discussions
        .insertOne(topic)
        .then((response: InsertOneWriteOpResult<WithId<Discussion>>) => {
          const insertedDiscussion: Discussion = response.ops.find(x => true)

          if (insertedDiscussion.id !== topic.id)
            reject({
              statusCode: 500,
              body: "Database insertion error"
            })
          else
            resolve({
              statusCode: 201,
              body: `Discssion '${topic.title}' created`
            })
        })
        .catch(e => {
          console.error(e)
          reject({ statusCode: 500, body: "Server error" })
        })
    })

  /**
   * Read a discussion
   *
   * discussionId byte[]
   * returns Discussion
   **/
  topicGET = (targetId: TopicId, authUserId?: UserId) =>
    new Promise<Success<Discussion> | Error>(async (resolve, reject) => {
      if (!authUserId && !policy.canPublicRead) {
        reject(error401UserNotAuthenticated)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = await users.findOne({ id: authUserId })

      if (!authUser && !policy.canPublicRead) {
        reject(error404UserUnknown)
        return
      }

      const isAdmin = authUser ? authUser.isAdmin : false
      const comments: Collection<Comment | DeletedComment | Discussion> = (
        await this.getDb()
      ).collection("comments")
      const discussion = await comments.findOne({ id: targetId })

      if (!discussion || isComment(discussion)) {
        reject({
          ...error404CommentNotFound,
          body: `Topic '${targetId}' not found`
        })
        return
      }

      const fullTopicPipeline = (id: CommentId, isAdminSafe: boolean) => [
        {
          $match: { id }
        },
        {
          $addFields: { isAdminSafe }
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "id",
            as: "userarr"
          }
        },
        {
          $addFields: {
            user: {
              $arrayElemAt: ["$userarr", 0]
            }
          }
        },
        {
          $graphLookup: {
            from: "comments",
            startWith: "$id",
            connectFromField: "id",
            connectToField: "parentId",
            as: "replies"
          }
        },
        {
          $unwind: {
            path: "$replies",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "replies.userId",
            foreignField: "id",
            as: "replies.userarr"
          }
        },
        {
          $addFields: {
            "replies.user": {
              $arrayElemAt: ["$replies.userarr", 0]
            }
          }
        },
        {
          $project: {
            "parentId": 1,
            "id": 1,
            "title": 1,
            "text": 1,
            "dateCreated": 1,
            "user.id": 1,
            "user.email": {
              $cond: {
                if: { $eq: ["$isAdminSafe", true] },
                then: "$user.email",
                else: "$$REMOVE"
              }
            },
            "user.name": 1,
            "user.isVerified": {
              $cond: {
                if: { $eq: ["$isAdminSafe", true] },
                then: "$user.isVerified",
                else: "$$REMOVE"
              }
            },
            "user.isAdmin": 1,
            "replies.parentId": 1,
            "replies.id": 1,
            "replies.text": 1,
            "replies.dateCreated": 1,
            "replies.user.id": 1,
            "replies.user.name": 1,
            "replies.user.isAdmin": 1,
            "replies.user.isVerified": {
              $cond: {
                if: { $eq: ["$isAdminSafe", true] },
                then: "$replies.user.isVerified",
                else: "$$REMOVE"
              }
            },
            "replies.user.email": {
              $cond: {
                if: { $eq: ["$isAdminSafe", true] },
                then: "$replies.user.email",
                else: "$$REMOVE"
              }
            }
          }
        },
        {
          $project: {
            "replies.userarr": 0,
            "replies.userId": 0,
            "replies.user.hash": 0,
            "user.hash": 0
          }
        },
        {
          $group: {
            _id: "$_id",
            id: {
              $first: "$id"
            },
            parentId: {
              $first: "$parentId"
            },
            text: {
              $first: "$text"
            },
            title: {
              $first: "$title"
            },
            user: {
              $first: "$user"
            },
            replies: {
              $push: "$replies"
            },
            dateCreated: {
              $first: "$dateCreated"
            },
            dateDeleted: {
              $first: "$dateDeleted"
            }
          }
        }
      ]

      const comment = (await comments
        .aggregate(fullTopicPipeline(targetId, isAdmin))
        .next()) as Discussion
      const body = comment

      resolve({ ...success200OK, body })
    })

  /**
   * Read the list of discussions
   * Discussion discovery
   *
   * mme
   * returns List
   **/
  topicListGET = (authUserId?: UserId) =>
    new Promise<Success<Topic[]> | Error>(async (resolve, reject) => {
      if (!authUserId && !policy.canPublicRead) {
        reject(error401UserNotAuthenticated)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = await users.find({ id: authUserId }).limit(1)

      if (!authUser && !policy.canPublicRead) {
        reject(error404UserUnknown)
        return
      }

      const db = await this.getDb()

      const comments = db.collection("comments")

      const topicsCursor: Cursor<Topic> = await comments.find({
        parentId: null
      })

      const topics = await topicsCursor.toArray()

      resolve({ ...success200OK, body: topics })
    })

  /**
   * Update a discussion (lock it)
   *
   * discussionId byte[]
   * returns Success
   **/
  topicPUT = (
    topicId: TopicId,
    topic: Pick<Topic, "id" | "title" | "isLocked">,
    authUserId?: UserId
  ) =>
    new Promise<Success<Topic> | Error>(async (resolve, reject) => {
      if (!authUserId) {
        reject(error401UserNotAuthenticated)
        return
      }

      if (!topic.hasOwnProperty("id")) {
        reject(error400CommentIdMissing)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = await users.findOne({ id: authUserId })

      if (!authUser) {
        reject(error404UserUnknown)
        return
      }

      const targetId = topic.id
      const comments: Collection<Comment | Topic> = (
        await this.getDb()
      ).collection("comments")
      const foundTopic = await comments.findOne({ id: targetId })

      if (!foundTopic || isComment(foundTopic)) {
        reject({
          ...error404CommentNotFound,
          body: `Topic '${targetId}' not found`
        })
        return
      }

      if (!authUser.isAdmin) {
        reject(error403UserNotAuthorized)
        return
      }

      const { title, isLocked } = topic
      const updateTopic = { ...foundTopic, title, isLocked }

      comments
        .findOneAndUpdate({ id: foundTopic.id }, { $set: updateTopic })
        .then((x: FindAndModifyWriteOpResultObject<Comment>) =>
          resolve({ ...success204CommentUpdated, body: updateTopic })
        )
        .catch(e =>
          authUser.isAdmin
            ? reject({ ...error500ServerError, body: e })
            : reject(error500ServerError)
        )
    })

  /**
   * Delete a discussion
   *
   * discussionId byte[]
   * returns Success
   **/
  topicDELETE = (topicId: TopicId, authUserId?: UserId) =>
    new Promise<Success | Error>(async (resolve, reject) => {
      if (!authUserId) {
        reject(error401UserNotAuthenticated)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = await users.findOne({ id: authUserId })

      if (!authUser) {
        reject(error404UserUnknown)
        return
      }

      const discussions: Collection<Comment | Topic> = (
        await this.getDb()
      ).collection("comments")
      const cursor = await discussions.find({ id: topicId }).limit(1)

      const foundTopic = await cursor.next()

      if (!foundTopic || isComment(foundTopic)) {
        reject({
          ...error404TopicNotFound,
          body: `Topic '${topicId}' not found`
        })
      }

      if (!authUser.isAdmin) {
        reject(error403UserNotAuthorized)
        return
      }

      // If we delete a topic that has replies it will orphan
      // them, so first check for even one
      const replyCursor = await discussions.find({ parentId: topicId }).limit(1)

      if (replyCursor) {
        // well, shit. delete all of the replies
        const getReplies = id => [
          { $match: { id } },
          {
            $graphLookup: {
              from: "comments",
              startWith: "$id",
              connectFromField: "id",
              connectToField: "parentId",
              as: "replies"
            }
          }
        ]

        const rawReplies = await discussions
          .aggregate(getReplies(topicId))
          .toArray()
        const commentIds = rawReplies.map(c => c.id)

        await discussions.deleteMany({ id: { $in: commentIds } })
      }

      // entire comment can be deleted without trouble
      // but we don't want anyone to reply in the meantime, so lock it:
      discussions
        .findOneAndDelete({ id: topicId })
        .then(x => resolve(success202TopicDeleted))
        .catch(e =>
          authUser.isAdmin
            ? reject({ ...error500ServerError, body: e })
            : reject(error500ServerError)
        )
    })

  authDELETE = () =>
    new Promise<Success>((resolve, reject) => {
      const pastDate = new Date(0).toUTCString()
      const COOKIE_HEADER = {
        "Set-Cookie": `simple_comment_token=logged-out; path=/; HttpOnly; Expires=${pastDate}; SameSite${
          this.isProduction ? "; Secure" : ""
        }`
      }
      resolve({ ...success202LoggedOut, headers: COOKIE_HEADER })
    })

  verifyGET = (claim: TokenClaim | null) =>
    new Promise<Success<TokenClaim> | Error>((resolve, reject) => {
      if (claim) return resolve({ ...success200OK, body: claim })
      else reject(error404UserUnknown)
    })

  close = async () => {
    await this.getClient().then(client => client.close())
  }
}
