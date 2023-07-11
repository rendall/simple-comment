import {
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
  NewTopic,
  Action,
  Email,
  CreateUserPayload
} from "./simple-comment"
import { isUserAllowedTo } from "./policyEnforcement"
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
  validateUser,
  isAllowedReferer,
  getAllowedOrigins,
  isEmail,
  createNewUserId
} from "./utilities"
import policy from "../policy.json"
import {
  error400BadRequest,
  error400NoUpdate,
  error400PasswordMissing,
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
  authPOST = (identification: string | Email, password: string) =>
    new Promise<Success<AuthToken> | Error>((resolve, reject) =>
      this.getDb()
        .then(db => db.collection("users"))
        .then(users =>
          isEmail(identification)
            ? users.findOne({ email: identification })
            : users.findOne({ id: identification })
        )
        .then(async user => {
          if (user === null) {
            // User is unknown. Reject them unless they claim to be Big Moderator
            if (identification !== process.env.SIMPLE_COMMENT_MODERATOR_ID) {
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
            const adminAuthToken = getAuthToken(identification)
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

  /**
   * User created
   * returns User
   **/
  userPOST = async (
    createUser: CreateUserPayload,
    authUserId?: UserId
  ): Promise<Success<AdminSafeUser> | Error> => {
    if (!authUserId && !policy.canPublicCreateUser) {
      return {
        ...error401UserNotAuthenticated,
        body: "Policy violation: no authentication and canPublicCreateUser is false"
      }
    }

    if (
      !policy.canPublicCreateUser &&
      isGuestId(authUserId) &&
      !policy.canGuestCreateUser
    ) {
      return {
        ...error401UserNotAuthenticated,
        body: "Policy violation: guest authentication and both canGuestCreateUsercan and PublicCreateUser is false"
      }
    }

    const db = await this.getDb()

    const newUserId = createUser.id ?? (await createNewUserId(db))

    const newUser: NewUser = { ...createUser, id: newUserId }

    const userCheck = validateUser(newUser)
    if (!userCheck.isValid) {
      return {
        ...error400BadRequest,
        body: userCheck.reason
      }
    }

    if (newUserId === process.env.SIMPLE_COMMENT_MODERATOR_ID) {
      return {
        ...error403ForbiddenToModify,
        body: "Cannot modify root credentials"
      }
    }

    if (isGuestId(newUserId) && authUserId !== newUserId) {
      return {
        ...error403Forbidden,
        body: "New user id must not be in a uuid format"
      }
    }

    if (!isGuestId(newUserId) && !newUser.password) {
      return error400PasswordMissing
    }

    const users: Collection<User> = db.collection("users")
    const authUser = await users.find({ id: authUserId }).limit(1).next()

    const isValidGuest = isGuestId(authUserId) && policy.canGuestCreateUser
    const isUnknownUser = !isValidGuest && authUserId && !authUser

    if (isUnknownUser) {
      return {
        ...error404UserUnknown,
        body: "Authenticating user is unknown"
      }
    }

    const hasAdminOnlyProps = adminOnlyModifiableUserProperties.some(
      prop => prop in newUser
    )

    if (hasAdminOnlyProps && (!authUser || !authUser.isAdmin)) {
      const adminOnlyProp = Object.keys(newUser).find(prop =>
        adminOnlyModifiableUserProperties.includes(prop as keyof User)
      )
      return {
        ...error403ForbiddenToModify,
        body: `Forbidden to modify ${adminOnlyProp}`
      }
    }

    const oldUser = await users.find({ id: newUserId }).limit(1).next()

    if (oldUser) {
      return error409UserExists
    }

    const hash = isGuestId(newUserId)
      ? ""
      : await hashPassword(newUser.password)
    const adminSafeUser = {
      ...toAdminSafeUser(newUser),
      name: newUser.name.trim()
    }
    const user: User = isGuestId(newUserId)
      ? adminSafeUser
      : ({ ...adminSafeUser, hash } as User)

    const result = await users.insertOne(user)
    if (!result.acknowledged) {
      return error500UpdateError
    }
    const body = toAdminSafeUser(user)
    return { ...success201UserCreated, body }
  }

  /**
   * Read user
   *
   * userId byte[]
   * returns User
   **/
  userGET = async (
    targetUserId?: UserId,
    authUserId?: UserId
  ): Promise<Success<PublicSafeUser | AdminSafeUser> | Error> => {
    if (!authUserId && !policy.canPublicReadUser) {
      return error401UserNotAuthenticated
    }

    if (
      isGuestId(authUserId) &&
      !policy.canGuestReadUser &&
      !policy.canPublicReadUser
    ) {
      return error403UserNotAuthorized
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const foundUser = await users.find({ id: targetUserId }).limit(1).next()

    if (!foundUser) {
      const isModerator =
        authUserId === targetUserId &&
        authUserId === process.env.SIMPLE_COMMENT_MODERATOR_ID

      if (!isModerator) {
        return {
          ...error404UserUnknown,
          body: "Authenticating user is unknown"
        }
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
      return { ...success200OK, body: outUser }
    }

    const authUser = await users.findOne({ id: authUserId })
    const isAdmin = authUser ? authUser.isAdmin : false
    const isSelf = authUser && targetUserId === authUser.id
    const outUser = toSafeUser(foundUser, isSelf || isAdmin)
    return { ...success200OK, body: outUser }
  }

  /**
   * List users
   *
   * returns List
   **/
  userListGET = async (
    authUserId?: UserId
  ): Promise<Success<AdminSafeUser[] | PublicSafeUser[]> | Error> => {
    const usersCollection: Collection<User> = (await this.getDb()).collection(
      "users"
    )
    const users = await usersCollection.find({}).toArray()
    const authUser = users.find(u => u.id === authUserId)
    const isAdmin = authUser ? authUser.isAdmin : false
    const outUsers = isAdmin
      ? users.map(toAdminSafeUser)
      : users.map(toPublicSafeUser)

    return { ...success200OK, body: outUsers }
  }

  /**
   * Update a user
   *
   * userId byte[]
   * returns Success<AdminSafeUser>
   **/
  userPUT = async (
    targetId: UserId,
    user: UpdateUser,
    authUserId?: UserId
  ): Promise<Success<AdminSafeUser> | Error> => {
    if (!authUserId) {
      return error401UserNotAuthenticated
    }

    const checkUser = validateUser(user as User)
    if (!checkUser.isValid) {
      return {
        ...error400BadRequest,
        body: checkUser.reason
      }
    }

    if (isGuestId(targetId)) {
      const hasAdminProps = (Object.keys(user) as (keyof User)[]).some(key =>
        adminOnlyModifiableUserProperties.includes(key)
      )

      if (hasAdminProps) {
        return {
          ...error403Forbidden,
          body: "Attempt to modify guest user forbidden property"
        }
      }
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.findOne({ id: authUserId })

    if (targetId !== authUser.id && !authUser.isAdmin) {
      return {
        ...error403UserNotAuthorized,
        body: `id of user ${targetId} does not match id of credentials ${authUser.id} and credentialed user is not admin`
      }
    }

    if (
      !authUser.isAdmin &&
      (Object.keys(user) as (keyof User)[]).some(key =>
        adminOnlyModifiableUserProperties.includes(key)
      )
    ) {
      return error403ForbiddenToModify
    }

    if (authUserId === process.env.SIMPLE_COMMENT_MODERATOR_ID) {
      const cannotModify: (keyof UpdateUser)[] = [
        "password",
        "isAdmin",
        "email"
      ]
      const isForbidden = (Object.keys(user) as (keyof UpdateUser)[]).some(
        key => cannotModify.includes(key)
      )
      if (isForbidden) {
        return {
          ...error403ForbiddenToModify,
          body: `Modify properties ${cannotModify.join(", ")} via .env file`
        }
      }
    }

    const foundUser = await users.find({ id: targetId }).limit(1).next()

    if (!foundUser) {
      return error404UserUnknown
    }

    const newProps = toUpdatedUser(user)
    const updatedUser = { ...foundUser, ...newProps }

    const modifyResult = await users.findOneAndUpdate(
      { id: updatedUser.id },
      { $set: updatedUser }
    )

    if (modifyResult.ok) {
      const safeUser = toAdminSafeUser(updatedUser)
      return { ...success204UserUpdated, body: safeUser }
    } else {
      return error500UpdateError
    }
  }

  /**
   * Delete a user
   *
   * userId byte[]
   * returns Success
   **/
  userDELETE = async (
    userId: UserId,
    authUserId?: UserId
  ): Promise<Success | Error> => {
    if (!authUserId || isGuestId(authUserId)) {
      return error401UserNotAuthenticated
    }

    const users: Collection<User> = (await this.getDb()).collection("users")

    if (userId === process.env.SIMPLE_COMMENT_MODERATOR_ID) {
      return error403Forbidden
    }

    const foundUser = await users.findOne({ id: userId })

    if (!foundUser) {
      return error404UserUnknown
    }

    const authUser = await users.findOne({ id: authUserId })

    if (!authUser) {
      return error401UserNotAuthenticated
    }

    const canDelete =
      authUser.isAdmin || (authUserId === userId && policy.canUserDeleteSelf)

    if (!canDelete) {
      return error403UserNotAuthorized
    }

    try {
      await users.deleteOne({ id: userId })
      return success202UserDeleted
    } catch (e) {
      return authUser.isAdmin
        ? { ...error500UpdateError, body: e }
        : error500UpdateError
    }
  }

  /**
   * Create a comment
   *
   * parentId byte[]
   * returns Comment
   **/
  commentPOST = async (
    parentId: TopicId | CommentId,
    text: string,
    authUserId?: UserId
  ): Promise<Success<Comment> | Error> => {
    if (!authUserId) {
      return error401UserNotAuthenticated
    }

    const policyCheck = isUserAllowedTo(authUserId, Action.postComment)

    if (policyCheck !== true) {
      return { ...error403Forbidden, body: policyCheck }
    }

    if (text.length > policy.maxCommentLengthChars) {
      return error413CommentTooLong
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = authUserId ? await users.findOne({ id: authUserId }) : null

    if (authUserId && !authUser) {
      return error404UserUnknown
    }

    const comments: Collection<Comment | DeletedComment | Discussion> = (
      await this.getDb()
    ).collection("comments")
    const parent = await comments.findOne({ id: parentId })

    if (!parent || isDeleted(parent)) {
      return {
        ...error404CommentNotFound,
        body: `Discussion '${parentId}' not found`
      }
    }

    const lastComment = (await comments.findOne(
      { "userId": authUserId },
      { sort: { dateCreated: -1 } }
    )) as Comment

    if (
      lastComment &&
      lastComment.text === text &&
      lastComment.parentId === parentId
    ) {
      return error409DuplicateComment
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

    try {
      const result = await comments.insertOne(insertComment)
      if (!result.acknowledged) {
        return {
          statusCode: 500,
          body: "Database insertion error"
        }
      }
      return {
        statusCode: 201,
        body: { ...insertComment, user: adminSafeUser }
      }
    } catch (e) {
      console.error(e)
      return authUser.isAdmin
        ? { ...error500UpdateError, body: e }
        : error500UpdateError
    }
  }

  /**
   * Read a comment
   *
   * discussionId byte[]
   * commentId byte[]
   * returns Comment
   **/
  commentGET = async (
    targetId: TopicId | CommentId,
    authUserId?: UserId
  ): Promise<Success<Comment> | Error> => {
    if (!targetId) {
      return error404CommentNotFound
    }

    if (!authUserId && !policy.canPublicReadDiscussion) {
      return error401UserNotAuthenticated
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = authUserId ? await users.findOne({ id: authUserId }) : null

    if (!authUser && !policy.canPublicReadDiscussion) {
      return error401UserNotAuthenticated
    }

    if (
      isGuestId(authUserId) &&
      !policy.canPublicReadDiscussion &&
      !policy.canGuestReadDiscussion
    ) {
      return error401UserNotAuthenticated
    }

    const isAdmin = authUser ? authUser.isAdmin : false
    const comments: Collection<Comment | DeletedComment | Discussion> = (
      await this.getDb()
    ).collection("comments")
    const cursor = await comments.find({ id: targetId }).limit(1)

    if (!cursor) {
      return {
        ...error404CommentNotFound,
        body: `Comment '${targetId}' not found`
      }
    }

    const foundComment = await cursor.next()
    if (!isComment(foundComment) || isDeletedComment(foundComment)) {
      return {
        ...error404CommentNotFound,
        body: `Comment '${targetId}' not found`
      }
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
    return { ...success200OK, body }
  }

  /**
   * Update a comment
   *
   * discussionId byte[]
   * commentId byte[]
   * returns Comment
   **/
  commentPUT = async (
    targetId: CommentId,
    text: string,
    authUserId?: UserId
  ): Promise<Success<Comment> | Error> => {
    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.find({ id: authUserId }).limit(1).next()

    if (!authUser) {
      return error401UserNotAuthenticated
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
      return {
        ...error404CommentNotFound,
        body: `Comment '${targetId}' not found`
      }
    }

    if (foundComment.text === text) {
      return error400NoUpdate
    }

    const canEdit = authUser.isAdmin || authUser.id === foundComment.userId

    if (!canEdit) {
      return error403UserNotAuthorized
    }

    const user = toSafeUser(foundComment.user as User, authUser.isAdmin)
    const returnComment = { ...foundComment, text, user }

    const modifyResult = await comments.findOneAndUpdate(
      { id: foundComment.id },
      { $set: returnComment }
    )

    if (modifyResult.ok) {
      return {
        ...success204CommentUpdated,
        body: returnComment
      }
    } else {
      if (authUser.isAdmin) {
        const errorMessage = modifyResult.lastErrorObject
          ? JSON.stringify(modifyResult.lastErrorObject)
          : "Unknown error"
        return { ...error500UpdateError, body: errorMessage }
      } else return error500UpdateError
    }
  }

  /**
   * Delete a comment
   *
   * discussionId byte[]
   * commentId byte[]
   * returns Success
   **/
  commentDELETE = async (
    targetId: CommentId,
    authUserId?: UserId
  ): Promise<Success | Error> => {
    if (!authUserId) {
      return error401UserNotAuthenticated
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.find({ id: authUserId }).limit(1).next()

    if (!authUser) {
      return error404UserUnknown
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
      return {
        ...error404CommentNotFound,
        body: `Comment '${targetId}' not found`
      }
    }

    const canDelete = authUser.isAdmin || authUser.id === foundComment.userId

    if (!canDelete) {
      return error403UserNotAuthorized
    }

    const reply = await comments.findOne({ parentId: targetId })

    if (reply) {
      const deletedComment = {
        ...foundComment,
        userId: null,
        text: null,
        dateDeleted: new Date()
      }

      try {
        await comments.updateOne(
          { id: foundComment.id },
          { $set: deletedComment }
        )
        return { ...success202CommentDeleted }
      } catch (e) {
        return authUser.isAdmin
          ? { ...error500UpdateError, body: e }
          : error500UpdateError
      }
    } else {
      try {
        await comments.findOneAndDelete({ id: foundComment.id })
        return success202CommentDeleted
      } catch (e) {
        return authUser.isAdmin
          ? { ...error500UpdateError, body: e }
          : error500UpdateError
      }
    }
  }

  /**
   * returns AuthToken with a guest id
   *
   **/
  gauthGET = () =>
    new Promise<Success<AuthToken> | Error>((resolve, reject) => {
      if (!policy.isGuestAccountAllowed) {
        reject({
          ...error403Forbidden,
          body: "Guest accounts are forbidden according to policy `isGuestAccountAllowed:false`"
        })
        return
      }
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
  topicPOST = async (
    newTopic: NewTopic,
    authUserId?: UserId
  ): Promise<Success<Topic> | Error> => {
    if (!policy.canFirstVisitCreateTopic && !authUserId) {
      return error401UserNotAuthenticated
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.findOne({ id: authUserId })

    if (authUserId && !authUser && !policy.canFirstVisitCreateTopic) {
      return error404UserUnknown
    }

    if (!policy.canFirstVisitCreateTopic && (!authUser || !authUser.isAdmin)) {
      return error403UserNotAuthorized
    }

    if (!authUserId || !authUser || !authUser.isAdmin) {
      // User is anonymous, public can create topics, and referrer restrictions are true
      // Let's validate the topic. We do that by comparing the proposed topicId with the `referer` header
      // They should be the same. If not, reject it

      if (!newTopic.referer) {
        return error403UserNotAuthorized
      }

      const isAllowed = isAllowedReferer(newTopic.referer, getAllowedOrigins())

      if (!isAllowed) {
        return {
          ...error403Forbidden,
          body: `Unknown referer ${
            newTopic.referer
          }. Allowed: ${getAllowedOrigins().join(" or ")}`
        }
      }
    }

    const hasInvalidCharacters = newTopic.id.match(/[^a-z0-9-]/)
    if (hasInvalidCharacters) {
      const invalidChar = hasInvalidCharacters ? hasInvalidCharacters[0] : ""
      return {
        ...error400BadRequest,
        body: `Invalid character '${invalidChar}' in topicId`
      }
    }

    // remove extraneous information like 'referer'
    const topic: Topic = { ...toTopic(newTopic), dateCreated: new Date() }

    const discussions: Collection<Discussion> = (await this.getDb()).collection(
      "comments"
    )
    const oldDiscussion = await discussions.findOne({ id: topic.id })

    if (oldDiscussion) {
      return error409DuplicateTopic
    }

    return discussions
      .insertOne(topic)
      .then(response => {
        if (response.acknowledged)
          return {
            statusCode: 201,
            body: `Topic ${topic.id}:'${topic.title}' created`
          }
        else
          return {
            statusCode: 500,
            body: "Database insertion error"
          }
      })
      .catch(e => {
        console.error(e)
        return { statusCode: 500, body: "Server error" }
      })
  }

  /**
   * Read a discussion
   *
   * discussionId byte[]
   **/
  topicGET = async (
    targetId: TopicId,
    authUserId?: UserId
  ): Promise<Success<Discussion> | Error> => {
    if (!authUserId && !policy.canPublicReadDiscussion) {
      return error401UserNotAuthenticated
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.findOne({ id: authUserId })

    if (!authUser && !policy.canPublicReadDiscussion) {
      return error404UserUnknown
    }

    const isAdmin = authUser ? authUser.isAdmin : false
    const comments: Collection<Comment | DeletedComment | Discussion> = (
      await this.getDb()
    ).collection("comments")

    const discussion = await comments.findOne({ id: targetId })

    if (!discussion || isComment(discussion)) {
      return {
        ...error404CommentNotFound,
        body: `Topic '${targetId}' not found`
      }
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

    return { ...success200OK, body }
  }

  /**
   * Read the list of discussions
   * Discussion discovery
   *
   * mme
   * returns List
   **/
  topicListGET = async (
    authUserId?: UserId
  ): Promise<Success<Topic[]> | Error> => {
    if (!authUserId && !policy.canPublicReadDiscussion) {
      return error401UserNotAuthenticated
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.find({ id: authUserId }).limit(1)

    if (!authUser && !policy.canPublicReadDiscussion) {
      return error404UserUnknown
    }

    const db = await this.getDb()

    const comments = db.collection("comments")

    const topicsCursor = await comments.find<WithId<Topic>>({
      parentId: null
    })

    const topics = await topicsCursor.toArray()

    return { ...success200OK, body: topics }
  }

  /**
   * Update a discussion (lock it)
   *
   * discussionId byte[]
   * returns Success
   **/
  topicPUT = async (
    topicId: TopicId,
    topic: Pick<Topic, "title" | "isLocked">,
    authUserId?: UserId
  ): Promise<Success<Topic> | Error> => {
    if (!authUserId) {
      return error401UserNotAuthenticated
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.findOne({ id: authUserId })

    if (!authUser) {
      return error404UserUnknown
    }

    const targetId = topicId
    const comments: Collection<Comment | Topic> = (
      await this.getDb()
    ).collection("comments")
    const foundTopic = await comments.findOne({ id: targetId })

    if (!foundTopic || isComment(foundTopic)) {
      return {
        ...error404CommentNotFound,
        body: `Topic '${targetId}' not found`
      }
    }

    if (!authUser.isAdmin) {
      return error403UserNotAuthorized
    }

    const { title, isLocked } = topic
    const updateTopic = { ...foundTopic, title, isLocked }

    return comments
      .findOneAndUpdate({ id: foundTopic.id }, { $set: updateTopic })
      .then(modifyResult => {
        if (modifyResult.ok)
          return { ...success204CommentUpdated, body: updateTopic }
        else
          return {
            statusCode: 500,
            body: authUser.isAdmin
              ? modifyResult.lastErrorObject
              : error500UpdateError.body
          } as Error
      })
      .catch(e => {
        if (authUser.isAdmin) {
          const errorMessage = e ? JSON.stringify(e) : "Unknown error"
          return { ...error500UpdateError, body: errorMessage } as Error
        } else return error500UpdateError
      })
  }

  /**
   * Delete a discussion
   *
   * discussionId byte[]
   **/
  topicDELETE = async (
    topicId: TopicId,
    authUserId?: UserId
  ): Promise<Success | Error> => {
    if (!authUserId) {
      return error401UserNotAuthenticated
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.findOne({ id: authUserId })

    if (!authUser) {
      return error404UserUnknown
    }

    const discussions: Collection<Comment | Topic> = (
      await this.getDb()
    ).collection("comments")
    const cursor = await discussions.find({ id: topicId }).limit(1)

    const foundTopic = await cursor.next()

    if (!foundTopic || isComment(foundTopic)) {
      return {
        ...error404TopicNotFound,
        body: `Topic '${topicId}' not found`
      }
    }

    if (!authUser.isAdmin) {
      return error403UserNotAuthorized
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
    return discussions
      .findOneAndDelete({ id: topicId })
      .then(() => success202TopicDeleted)
      .catch(e => {
        return authUser.isAdmin
          ? { ...error500UpdateError, body: e }
          : error500UpdateError
      })
  }

  authDELETE = (): Promise<Success> => {
    const pastDate = new Date(0).toUTCString()
    const COOKIE_HEADER = {
      "Set-Cookie": `simple_comment_token=logged-out; path=/; SameSite=${
        this.isCrossSite ? "None; Secure; " : "Strict; "
      }HttpOnly; Expires=${pastDate};`
    }
    return Promise.resolve({ ...success202LoggedOut, headers: COOKIE_HEADER })
  }

  verifyGET = async (
    token?: AuthToken
  ): Promise<Success<TokenClaim> | Error> => {
    try {
      const claim: TokenClaim = jwt.verify(token, process.env.JWT_SECRET, {
        ignoreExpiration: false
      }) as TokenClaim
      return { ...success200OK, body: claim }
    } catch (error) {
      console.error(error)
      switch (error.name) {
        case "TokenExpiredError":
          return {
            ...error403Forbidden,
            body: `token expired at ${error.expiredAt}`
          }
        default:
          return error400BadRequest
      }
    }
  }

  close = async () => {
    await this.getClient().then(client => client.close())
  }
}
