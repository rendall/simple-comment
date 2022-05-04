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
  TokenClaim,
  NewTopic
} from "./simple-comment"
import { Collection, Db, MongoClient, WithId } from "mongodb"
import { Service } from "./Service"
import {
  adminOnlyModifiableUserProperties,
  isComment,
  isDeleted,
  isGuestId,
  isDeletedComment,
  toAdminSafeUser,
  toPublicSafeUser,
  toSafeUser,
  toTopic,
  toUpdatedUser,
  validateUser
} from "./utilities"
import { policy } from "../policy"
import {
  error400BadRequest,
  error400NoUpdate,
  error400PasswordMissing,
  error400UserIdMissing,
  error401BadCredentials,
  error401UserNotAuthenticated,
  error403Forbidden,
  error403ForbiddenToModify,
  error403UserNotAuthorized,
  error404CommentNotFound,
  error404TopicNotFound,
  error404UserUnknown,
  error409DuplicateComment,
  error409DuplicateTopic,
  error409UserExists,
  error413CommentTooLong,
  error500UpdateError,
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
import * as jwt from "jsonwebtoken"
export class MongodbService extends Service {
  private isCrossSite = process.env.IS_CROSS_SITE === "true"
  private _client: MongoClient
  private _db: Db
  readonly _connectionString: string
  readonly _dbName: string

  getClient = async () => {
    if (this._client) {
      this._client.connect() // if already connected, this is a no-op
      return this._client
    }
    this._client = await MongoClient.connect(this._connectionString)
    return this._client
  }

  getDb = async () => {
    if (this._db) return this._db
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
  authPOST = (userid: string, password: string) =>
    new Promise<Success<AuthToken> | Error>((resolve, reject) =>
      this.getDb()
        .then(db => db.collection("users"))
        .then(users => users.findOne({ id: userid }))
        .then(async user => {
          if (user === null) {
            // User is unknown. Reject them unless they claim to be Big Moderator
            if (userid !== process.env.SIMPLE_COMMENT_MODERATOR_ID) {
              reject(error404UserUnknown)
              return
            }

            // At this stage some unknown user claims to be the Big Moderator
            // but there is no user with that name! This is a problem!

            // First, let's verify that they have the correct credentials
            const isModeratorPassword =
              process.env.SIMPLE_COMMENT_MODERATOR_PASSWORD === password

            if (!isModeratorPassword) {
              // Nope!
              reject(error401BadCredentials)
              return
            }

            // Done.

            // Let's authenticate, and let the user endpoint handle this
            const adminAuthToken = getAuthToken(userid)
            resolve({ ...success200OK, body: adminAuthToken })

            // At this point Big Moderator is authenticated but has no user object in the database
          } else {
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
        reject({
          ...error401UserNotAuthenticated,
          body: "Policy violation: no authentication and canPublicCreateUser is false"
        })
        return
      }

      if (
        !policy.canPublicCreateUser &&
        isGuestId(authUserId) &&
        !policy.canGuestCreateUser
      ) {
        reject({
          ...error401UserNotAuthenticated,
          body: "Policy violation: guest authentication and both canGuestCreateUsercan and PublicCreateUser is false"
        })
        return
      }

      if (!newUser.id) {
        reject(error400UserIdMissing)
        return
      }

      const userCheck = validateUser(newUser)
      if (!userCheck.isValid) {
        reject({
          ...error400BadRequest,
          body: userCheck.reason
        })
        return
      }

      // This is a necessary check because the moderator creation
      // flow is outside of the normal user creation flow
      if (newUser.id === process.env.SIMPLE_COMMENT_MODERATOR_ID) {
        // moderator username and password are changed by .env
        // to create this user, log in with those credentials
        reject({
          ...error403ForbiddenToModify,
          body: "Cannot modify root credentials"
        })
        return
      }

      // Only the guest id with the same credential can create a guest user
      if (isGuestId(newUser.id) && authUserId !== newUser.id) {
        reject({
          ...error403Forbidden,
          body: "New user id must not be in a uuid format"
        })
        return
      }

      // Guests do not need and cannot have a password, because they are identified only by credentials
      if (!isGuestId(newUser.id) && !newUser.password) {
        reject(error400PasswordMissing)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = await users.find({ id: authUserId }).limit(1).next()

      const isValidGuest = isGuestId(authUserId) && policy.canGuestCreateUser
      const isUnknownUser = !isValidGuest && authUserId && !authUser

      if (isUnknownUser) {
        reject({
          ...error404UserUnknown,
          body: "Authenticating user is unknown"
        })
        return
      }

      const hasAdminOnlyProps = adminOnlyModifiableUserProperties.some(prop => prop in newUser)

      if (hasAdminOnlyProps && (!authUser || !authUser.isAdmin)) {
        const adminOnlyProp = Object.keys(newUser).find(prop =>
          adminOnlyModifiableUserProperties.includes(prop as keyof User)
        )
        // It's possible that revealing which props are admin-only is a security risk,
        // but on the other hand, the code is open-source so it probably makes no difference
        reject({
          ...error403ForbiddenToModify,
          body: `Forbidden to modify ${adminOnlyProp}`
        })
        return
      }

      const oldUser = await users.find({ id: newUser.id }).limit(1).next()

      if (oldUser) {
        reject(error409UserExists)
        return
      }

      // A guest user can never log in, so do not have hash
      const hash = isGuestId(newUser.id)
        ? ""
        : await hashPassword(newUser.password)
      const adminSafeUser = {
        ...toAdminSafeUser(newUser),
        name: newUser.name.trim()
      }
      const user: User = isGuestId(newUser.id)
        ? adminSafeUser
        : ({ ...adminSafeUser, hash } as User)

      users.insertOne(user).then(result => {
        if (!result.acknowledged) {
          reject(error500UpdateError)
          return
        }
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
  userGET = (targetUserId?: UserId, authUserId?: UserId) =>
    new Promise<Success<PublicSafeUser | AdminSafeUser> | Error>(
      async (resolve, reject) => {
        if (!authUserId && !policy.canPublicReadUser) {
          reject(error401UserNotAuthenticated)
          return
        }

        if (
          isGuestId(authUserId) &&
          !policy.canGuestReadUser &&
          !policy.canPublicReadUser
        ) {
          reject(error403UserNotAuthorized)
          return
        }

        const users: Collection<User> = (await this.getDb()).collection("users")
        const foundUser = await users.find({ id: targetUserId }).limit(1).next()

        if (!foundUser) {
          const isModerator =
            authUserId === targetUserId &&
            authUserId === process.env.SIMPLE_COMMENT_MODERATOR_ID

          if (!isModerator) {
            reject(error404UserUnknown)
            return
          }

          // The Big Moderator is authenticated but has no user object in the database
          // We shall create it now
          const hash = await hashPassword(
            process.env.SIMPLE_COMMENT_MODERATOR_PASSWORD
          )
          const adminUser: User = {
            id: targetUserId,
            name: "Simple Comment Moderator",
            isAdmin: true,
            hash,
            email: process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL
          }
          await users.insertOne(adminUser)

          // Big Moderator is created, let's return it
          const outUser = toAdminSafeUser(adminUser)
          resolve({ ...success200OK, body: outUser })
          return
        }

        const authUser = await users.findOne({ id: authUserId })
        const isAdmin = authUser ? authUser.isAdmin : false
        const isSelf = authUser && targetUserId === authUser.id
        const outUser = toSafeUser(foundUser, isSelf || isAdmin)
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
      async (resolve) => {
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
   * userId byte[]
   * returns Success<AdminSafeUser>
   **/
  userPUT = (targetId: UserId, user: UpdateUser, authUserId?: UserId) =>
    new Promise<Success<AdminSafeUser> | Error>(async (resolve, reject) => {
      if (!authUserId) {
        reject(error401UserNotAuthenticated)
        return
      }

      const checkUser = validateUser(user as User)
      if (!checkUser.isValid) {
        reject({
          ...error400BadRequest,
          body: checkUser.reason
        })
      }

      if (isGuestId(targetId)) {
        const hasAdminProps = (Object.keys(user) as (keyof User)[]).some(key =>
          adminOnlyModifiableUserProperties.includes(key)
        )

        if (hasAdminProps) {
          reject({
            ...error403Forbidden,
            body: "Attempt to modify guest user forbidden property"
          })
          return
        }
      }
      // Allow guest users to change their name and email
      // but not admin traits

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = await users.findOne({ id: authUserId })

      if (targetId !== authUser.id && !authUser.isAdmin) {
        reject({
          ...error403UserNotAuthorized,
          body: `id of user ${targetId} does not match id of credentials ${authUser.id} and credentialed user is not admin`
        })
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

      if (authUserId === process.env.SIMPLE_COMMENT_MODERATOR_ID) {
        // the user cannot modify the authuser password or other properties
        const cannotModify: (keyof UpdateUser)[] = [
          "password",
          "isAdmin",
          "email"
        ]
        const isForbidden = (Object.keys(user) as (keyof UpdateUser)[]).some(
          key => cannotModify.includes(key)
        )
        if (isForbidden) {
          reject({
            ...error403ForbiddenToModify,
            body: `Modify properties ${cannotModify.join(", ")} via .env file`
          })
          return
        }
      }

      // At this point, user.id exists and authUser can alter it

      const foundUser = await users.find({ id: targetId }).limit(1).next()

      if (!foundUser) {
        reject(error404UserUnknown)
        return
      }

      // strip extraneous properties from the user, like "id"
      const newProps = toUpdatedUser(user)

      const updatedUser = { ...foundUser, ...newProps }

      // one final check for validity

      /* NB: It is always safe to return AdminSafeUser because
       * authUser is always an admin or the user themself */
      users
        .findOneAndUpdate({ id: updatedUser.id }, { $set: updatedUser })
        .then(modifyResult => {
          if (modifyResult.ok) {
            const safeUser = toAdminSafeUser(updatedUser)
            resolve({ ...success204UserUpdated, body: safeUser })
          } else reject(error500UpdateError)
        })
        .catch(() => reject(error500UpdateError))
    })

  /**
   * Delete a user
   *
   * userId byte[]
   * returns Success
   **/
  userDELETE = (userId: UserId, authUserId?: UserId) =>
    new Promise<Success | Error>(async (resolve, reject) => {
      if (!authUserId || isGuestId(authUserId)) {
        reject(error401UserNotAuthenticated)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")

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
        .then(() => resolve(success202UserDeleted))
        .catch(e =>
          authUser.isAdmin
            ? reject({ ...error500UpdateError, body: e })
            : reject(error500UpdateError)
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

      // We don't want to search for the exact comment {userId, text, parentId}
      // because we only want to prevent accidental duplications
      const lastComment = (await comments.findOne(
        { "userId": authUserId },
        { sort: { dateCreated: -1 } }
      )) as Comment

      if (
        lastComment &&
        lastComment.text === text &&
        lastComment.parentId === parentId
      ) {
        reject(error409DuplicateComment)
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
        .then(result => {
          if (!result.acknowledged) {
            reject({
              statusCode: 500,
              body: "Database insertion error"
            })
          }
          resolve({
            statusCode: 201,
            body: { ...insertComment, user: adminSafeUser }
          })
        })
        .catch(e => {
          console.error(e)
          authUser.isAdmin
            ? reject({ ...error500UpdateError, body: e })
            : reject(error500UpdateError)
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

      if (!authUserId && !policy.canPublicReadDiscussion) {
        reject(error401UserNotAuthenticated)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = authUserId
        ? await users.findOne({ id: authUserId })
        : null

      if (!authUser && !policy.canPublicReadDiscussion) {
        reject(error401UserNotAuthenticated)
        return
      }

      if (
        isGuestId(authUserId) &&
        !policy.canPublicReadDiscussion &&
        !policy.canGuestReadDiscussion
      ) {
        reject(error401UserNotAuthenticated)
        return
      }

      const isAdmin = authUser ? authUser.isAdmin : false
      const comments: Collection<Comment | DeletedComment | Discussion> = (
        await this.getDb()
      ).collection("comments")
      const cursor = await comments.find({ id: targetId }).limit(1)

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
          $match: {
            id
          }
        },
        {
          $addFields: {
            isAdminSafe
          }
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
            parentId: 1,
            id: 1,
            title: 1,
            text: 1,
            dateCreated: 1,
            "user.id": 1,
            "user.email": {
              $cond: {
                "if": {
                  $eq: ["$isAdminSafe", true]
                },
                then: "$user.email",
                "else": "$$REMOVE"
              }
            },
            "user.name": 1,
            "user.isVerified": {
              $cond: {
                "if": {
                  $eq: ["$isAdminSafe", true]
                },
                then: "$user.isVerified",
                "else": "$$REMOVE"
              }
            },
            "user.isAdmin": 1,
            "replies.parentId": 1,
            "replies.id": 1,
            "replies.text": 1,
            "replies.dateCreated": 1,
            "replies.dateDeleted": 1,
            "replies.user.id": 1,
            "replies.user.name": 1,
            "replies.user.isAdmin": 1,
            "replies.user.isVerified": {
              $cond: {
                "if": {
                  $eq: ["$isAdminSafe", true]
                },
                then: "$replies.user.isVerified",
                "else": "$$REMOVE"
              }
            },
            "replies.user.email": {
              $cond: {
                "if": {
                  $eq: ["$isAdminSafe", true]
                },
                then: "$replies.user.email",
                "else": "$$REMOVE"
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
        .then(modifyResult => {
          if (modifyResult.ok)
            resolve({
              ...success204CommentUpdated,
              body: returnComment
            })
          else reject(error500UpdateError)
        })
        .catch(e =>
          authUser.isAdmin
            ? reject({ ...error500UpdateError, body: e })
            : reject(error500UpdateError)
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
          .then(() => resolve({ ...success202CommentDeleted }))
          .catch(e =>
            authUser.isAdmin
              ? reject({ ...error500UpdateError, body: e })
              : reject(error500UpdateError)
          )
      } else {
        // entire comment can be deleted without trouble
        // but we don't want anyone to reply in the meantime, so lock it
        // using findOneAndDelete
        comments
          .findOneAndDelete({ id: foundComment.id })
          .then(() => resolve(success202CommentDeleted))
          .catch(e =>
            authUser.isAdmin
              ? reject({ ...error500UpdateError, body: e })
              : reject(error500UpdateError)
          )
      }
    })

  /**
   * returns AuthToken with a guest id
   *
   **/
  gauthGET = () =>
    new Promise<Success<AuthToken> | Error>(resolve => {
      const guestUserId = uuidv4()
      const gauthToken = getAuthToken(guestUserId)
      resolve({ ...success200OK, body: gauthToken })
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
  topicPOST = (newTopic: NewTopic, authUserId?: UserId) =>
    new Promise<Success<Topic> | Error>(async (resolve, reject) => {
      if (!policy.canFirstVisitCreateTopic && !authUserId) {
        reject(error401UserNotAuthenticated)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = await users.findOne({ id: authUserId })

      if (authUserId && !authUser && !policy.canFirstVisitCreateTopic) {
        reject(error404UserUnknown)
        return
      }

      if (
        !policy.canFirstVisitCreateTopic &&
        (!authUser || !authUser.isAdmin)
      ) {
        reject(error403UserNotAuthorized)
        return
      }

      if (
        (!authUserId || !authUser || !authUser.isAdmin) &&
        policy.refererRestrictions
      ) {
        // User is anonymous, public can create topics, and referrer restrictions are true
        // Let's validate the topic. We do that by comparing the proposed topicId with the `referer` header
        // They should be the same. If not, reject it

        if (!newTopic.referer) {
          reject(error403UserNotAuthorized)
          return
        }

        const allowedId = newTopic.referer
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
        const isAllowed = allowedId === newTopic.id

        if (!isAllowed) {
          reject({
            ...error403Forbidden,
            body: `Unknown referer ${newTopic.referer}`
          })
          return
        }
      }

      const hasInvalidCharacters = newTopic.id.match(/[^a-z0-9-]/)
      if (hasInvalidCharacters) {
        const invalidChar = hasInvalidCharacters ? hasInvalidCharacters[0] : ""
        reject({
          ...error400BadRequest,
          body: `Invalid character '${invalidChar}' in topicId`
        })
        return
      }

      // remove extraneous information like 'referer'
      const topic: Topic = { ...toTopic(newTopic), dateCreated: new Date() }

      const discussions: Collection<Discussion> = (
        await this.getDb()
      ).collection("comments")
      const oldDiscussion = await discussions.findOne({ id: topic.id })

      if (oldDiscussion) {
        reject(error409DuplicateTopic)
        return
      }

      discussions
        .insertOne(topic)
        .then(response => {
          if (response.acknowledged)
            resolve({
              statusCode: 201,
              body: `Topic ${topic.id}:'${topic.title}' created`
            })
          else
            reject({
              statusCode: 500,
              body: "Database insertion error"
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
      if (!authUserId && !policy.canPublicReadDiscussion) {
        reject(error401UserNotAuthenticated)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = await users.findOne({ id: authUserId })

      if (!authUser && !policy.canPublicReadDiscussion) {
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
            "dateDeleted": 1,
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
            "replies.dateDeleted": 1,
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
      if (!authUserId && !policy.canPublicReadDiscussion) {
        reject(error401UserNotAuthenticated)
        return
      }

      const users: Collection<User> = (await this.getDb()).collection("users")
      const authUser = await users.find({ id: authUserId }).limit(1)

      if (!authUser && !policy.canPublicReadDiscussion) {
        reject(error404UserUnknown)
        return
      }

      const db = await this.getDb()

      const comments = db.collection("comments")

      const topicsCursor = await comments.find<WithId<Topic>>({
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
    topic: Pick<Topic, "title" | "isLocked">,
    authUserId?: UserId
  ) =>
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

      const targetId = topicId
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
        .then(modifyResult => {
          if (modifyResult.ok)
            resolve({ ...success204CommentUpdated, body: updateTopic })
          else
            reject({
              statusCode: 500,
              body: authUser.isAdmin
                ? modifyResult.lastErrorObject
                : error500UpdateError.body
            })
        })
        .catch(e =>
          authUser.isAdmin
            ? reject({ ...error500UpdateError, body: e })
            : reject(error500UpdateError)
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
        .then(() => resolve(success202TopicDeleted))
        .catch(e =>
          authUser.isAdmin
            ? reject({ ...error500UpdateError, body: e })
            : reject(error500UpdateError)
        )
    })

  authDELETE = () =>
    new Promise<Success>((resolve) => {
      const pastDate = new Date(0).toUTCString()
      const COOKIE_HEADER = {
        "Set-Cookie": `simple_comment_token=logged-out; path=/; SameSite=${
          this.isCrossSite ? "None; Secure; " : "Strict; "
        }HttpOnly; Expires=${pastDate};`
      }
      resolve({ ...success202LoggedOut, headers: COOKIE_HEADER })
    })

  verifyGET = (token?: AuthToken) =>
    new Promise<Success<TokenClaim> | Error>((resolve) => {
      try {
        const claim: TokenClaim = jwt.verify(token, process.env.JWT_SECRET, {
          ignoreExpiration: false
        }) as TokenClaim
        return resolve({ ...success200OK, body: claim })
      } catch (error) {
        console.error(error)
        switch (error.name) {
          case "TokenExpiredError":
            resolve({
              ...error403Forbidden,
              body: `token expired at ${error.expiredAt}`
            })
            break

          default:
            resolve(error400BadRequest)
            break
        }
      }
    })

  close = async () => {
    await this.getClient().then(client => client.close())
  }
}
