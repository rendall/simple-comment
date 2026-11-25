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
  UpdateUser,
  TokenClaim,
  NewTopic,
  Email,
  CreateUserPayload,
} from "./simple-comment-types"
import { Action, Privilege } from "./simple-comment-types"
import { isUserAllowedTo } from "./policyEnforcement"
import type { Collection, Db, WithId } from "mongodb"
import { MongoClient } from "mongodb"
import { AbstractDbService } from "./AbstractDbService"
import {
  adminOnlyModifiableUserProperties,
  generateCommentId,
  generateGuestChallenge,
  generateGuestId,
  getAllowedOrigins,
  getUserRole,
  hasReadOnlyUserRole,
  isAllowedReferer,
  isComment,
  isDefined,
  isDeleted,
  isDeletedComment,
  isEmail,
  isError,
  isTokenClaim,
  isUser,
  normalizeAllowedOrigin,
  normalizeUrl,
  toAdminSafeUser,
  toErrorBody,
  toPublicSafeUser,
  toSafeUser,
  toTopic,
  toUpdatedUser,
  validateGuestUser,
  validateUser,
} from "./backend-utilities"
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
  error409ReviewedCommentChanged,
  error409DuplicateTopic,
  error409UserExists,
  error413CommentTooLong,
  error500UpdateError,
  success200OK,
  success200CommentUpdated,
  success201UserCreated,
  success201CommentCreated,
  success202CommentDeleted,
  success202LoggedOut,
  success202TopicDeleted,
  success202UserDeleted,
  success204CommentUpdated,
  success204UserUpdated,
} from "./messages"
import { comparePassword, getAuthToken, hashPassword } from "./crypt"
import * as jwt from "jsonwebtoken"
import { isGuestId, isValidResult } from "./shared-utilities"
import { AbstractNotificationService } from "./AbstractNotificationService"
import { getCommentPublication } from "./comment-publication"
import { getBackendEnv } from "./env"

const {
  isCrossSite,
  jwtSecret,
  moderatorContactEmail: simpleCommentModeratorEmail,
  moderatorId: simpleCommentModeratorId,
  moderatorPassword: simpleCommentModeratorPassword,
} = getBackendEnv()

// Keep deleted replies anonymous even when the stored record has an author ID.
const replyAuthorStages = [
  {
    $lookup: {
      from: "users",
      localField: "replies.userId",
      foreignField: "id",
      as: "replies.userarr",
    },
  },
  {
    $addFields: {
      "replies.user": {
        $cond: [
          { $eq: [{ $type: "$replies.dateDeleted" }, "missing"] },
          { $arrayElemAt: ["$replies.userarr", 0] },
          "$$REMOVE",
        ],
      },
    },
  },
]

const canAdministerTarget = (actorPrivilege: Privilege, target: User) =>
  actorPrivilege >= Privilege.Admin &&
  actorPrivilege > getUserRole(target).privilege

const addCommentAuthorRole = (comment: { user?: Comment["user"] }) => {
  if (comment.user?.id) {
    comment.user = { ...comment.user, ...getUserRole(comment.user) }
  }
}

type CommentViewer = { id?: UserId; isModerator: boolean }

const canReadModerationDetails = (comment: Comment, viewer: CommentViewer) =>
  viewer.isModerator ||
  (viewer.id !== undefined && viewer.id === comment.userId)

const toVisibleComment = (comment: Comment, viewer: CommentViewer): Comment => {
  const { id, parentId, dateCreated, dateDeleted, _id } = comment
  const canReadDetails = canReadModerationDetails(comment, viewer)
  const structure = { id, parentId, dateCreated, ...(_id && { _id }) }
  if (dateDeleted != null) {
    return {
      ...structure,
      text: null,
      dateDeleted,
      ...(canReadDetails &&
        comment.deletedReason && { deletedReason: comment.deletedReason }),
    }
  }

  const isApproved = comment.isApproved !== false
  const visible: Comment = { ...structure, isApproved, text: null }
  if (!isApproved && !canReadDetails) return visible

  visible.text = comment.text
  if (comment.user) visible.user = comment.user
  if (!isApproved && comment.heldReason) visible.heldReason = comment.heldReason
  addCommentAuthorRole(visible)
  return visible
}

const toVisibleReplies = (
  replies: Comment[] | undefined,
  viewer: CommentViewer
) => {
  const comments = (replies ?? []).filter(reply => reply.id)
  const byId = new Map(comments.map(comment => [comment.id, comment]))
  const required = new Set<CommentId>()

  for (const comment of comments) {
    if (
      isDeletedComment(comment) &&
      !(comment.deletedReason && canReadModerationDetails(comment, viewer))
    )
      continue
    if (
      comment.isApproved === false &&
      !canReadModerationDetails(comment, viewer)
    )
      continue

    let ancestor: Comment | undefined = comment
    while (ancestor && !required.has(ancestor.id)) {
      required.add(ancestor.id)
      ancestor = byId.get(ancestor.parentId)
    }
  }

  return comments
    .filter(comment => required.has(comment.id) || isDeletedComment(comment))
    .filter(comment => {
      const parent = byId.get(comment.parentId)
      return !parent || parent.isApproved !== false || required.has(parent.id)
    })
    .map(comment => toVisibleComment(comment, viewer))
}

export class MongodbService extends AbstractDbService {
  private isCrossSite = isCrossSite
  private _client?: MongoClient
  private _db?: Db
  readonly _connectionString: string
  readonly _dbName: string
  readonly _notificationService?: AbstractNotificationService

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

  constructor(
    connectionString: string,
    dbName: string,
    notificationService?: AbstractNotificationService
  ) {
    super()
    this._connectionString = connectionString
    this._dbName = dbName
    this._notificationService = notificationService
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
          if (!isUser(user)) {
            // User is unknown. Reject them unless they claim to be Big Moderator
            if (identification !== simpleCommentModeratorId) {
              reject(error404UserUnknown)
              return
            }

            // At this stage some unknown user claims to be the Big Moderator
            // but there is no user with that name! This is a problem!

            // First, let's verify that they have the correct credentials
            const isModeratorPassword =
              simpleCommentModeratorPassword === password

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
          } else if (isGuestId(identification)) {
            // Guest authentication relies only on a challenge
            if (password === user.challenge) {
              const authToken = getAuthToken(user.id)
              resolve({ ...success200OK, body: authToken })
            } else reject(error401BadCredentials)
          } else {
            if (!user.hash) {
              reject(error401BadCredentials)
              return
            }
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
    newUser: CreateUserPayload,
    authUserId?: UserId
  ): Promise<Success<AdminSafeUser> | Error> => {
    if (!authUserId && !policy.canPublicCreateUser) {
      return {
        ...error401UserNotAuthenticated,
        body: "Policy violation: no authentication and canPublicCreateUser is false",
      }
    }

    if (
      !policy.canPublicCreateUser &&
      isGuestId(authUserId) &&
      !policy.canGuestCreateUser
    ) {
      return {
        ...error401UserNotAuthenticated,
        body: "Policy violation: guest authentication and both canGuestCreateUsercan and PublicCreateUser is false",
      }
    }

    if (newUser.id === simpleCommentModeratorId) {
      return {
        ...error403ForbiddenToModify,
        body: "Cannot modify root credentials",
      }
    }

    if (hasReadOnlyUserRole(newUser)) return error403ForbiddenToModify

    if (isGuestId(newUser.id) && authUserId !== newUser.id) {
      return {
        ...error403Forbidden,
        body: "New user id must not be in a guest id format",
      }
    }

    if (!isGuestId(newUser.id) && !newUser.password) {
      return error400PasswordMissing
    }

    const userCheck = isGuestId(newUser.id)
      ? validateGuestUser(newUser, authUserId)
      : validateUser(newUser)
    if (!isValidResult(userCheck)) {
      return {
        ...error400BadRequest,
        body: userCheck.reason,
      }
    }

    const db = await this.getDb()
    const users: Collection<User> = db.collection("users")
    const authUser = await users.find({ id: authUserId }).limit(1).next()

    const isValidGuest = isGuestId(authUserId) && policy.canGuestCreateUser
    const isUnknownUser = !isValidGuest && authUserId && !authUser

    if (isUnknownUser) {
      return {
        ...error404UserUnknown,
        body: "Authenticating user is unknown",
      }
    }

    const hasAdminOnlyProps = adminOnlyModifiableUserProperties.some(
      prop => prop in newUser
    )

    if (hasAdminOnlyProps && !getUserRole(authUser).isAdmin) {
      const adminOnlyProp = Object.keys(newUser).find(prop =>
        adminOnlyModifiableUserProperties.includes(prop as keyof User)
      )
      return {
        ...error403ForbiddenToModify,
        body: `Forbidden to modify ${adminOnlyProp}`,
      }
    }

    const oldUser = await users.find({ id: newUser.id }).limit(1).next()

    if (oldUser) {
      return { ...error409UserExists, body: `UserId '${newUser.id}' exists` }
    }

    const hash = isGuestId(newUser.id)
      ? ""
      : await hashPassword(newUser.password)
    const { id, name, email, isVerified } = newUser
    const userDetails = {
      id,
      name: name.trim(),
      email,
      privilege: Privilege.User,
      ...(isVerified !== undefined && { isVerified }),
    }
    const user: User = isGuestId(newUser.id)
      ? { ...userDetails, challenge: generateGuestChallenge() }
      : { ...userDetails, hash }

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
    if (targetUserId === undefined)
      return { ...error400BadRequest, body: "resource is undefined" }

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
    const user = await users.find({ id: targetUserId }).limit(1).next()

    if (!user) {
      const isModerator =
        authUserId === targetUserId && authUserId === simpleCommentModeratorId

      if (!isModerator) {
        return error404UserUnknown
      }

      // The Big Moderator is authenticated but has no user object in the database
      // We shall create it now
      const hash = await hashPassword(simpleCommentModeratorPassword)

      const adminUser: User = {
        id: targetUserId,
        name: "Simple Comment Moderator",
        privilege: Privilege.Admin,
        hash,
        email: simpleCommentModeratorEmail,
      }
      await users.insertOne(adminUser)

      // Big Moderator is created, let's return it
      const body = toAdminSafeUser(adminUser)
      return { ...success200OK, body }
    }

    if (
      targetUserId === simpleCommentModeratorId &&
      authUserId === targetUserId &&
      !("privilege" in user)
    ) {
      await users
        .updateOne(
          { id: targetUserId, privilege: { $exists: false } },
          { $set: { privilege: Privilege.Admin } }
        )
        .catch(() => console.error("Owner privilege initialization failed"))
    }

    const authUser = await users.findOne({ id: authUserId })
    const isHardcodedModerator = authUserId === simpleCommentModeratorId
    const isValidGuest =
      isGuestId(authUserId) &&
      (policy.canGuestReadUser || policy.canPublicReadUser)

    if (
      authUserId &&
      !authUser &&
      !isValidGuest &&
      !isHardcodedModerator &&
      !policy.canPublicReadUser
    ) {
      return {
        ...error404UserUnknown,
        body: "Authenticating user is unknown",
      }
    }

    const isAdmin = getUserRole(authUser).isAdmin || isHardcodedModerator
    const isSelf = authUser && targetUserId === authUser.id
    const body = toSafeUser(user, isSelf || isAdmin)
    return { ...success200OK, body }
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
    const { isAdmin } = getUserRole(authUser)
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

    if (hasReadOnlyUserRole(user)) return error403ForbiddenToModify

    if (isGuestId(targetId)) {
      const hasAdminProps = (Object.keys(user) as (keyof User)[]).some(key =>
        adminOnlyModifiableUserProperties.includes(key)
      )

      if (hasAdminProps) {
        return {
          ...error403Forbidden,
          body: "Attempt to modify guest user forbidden property",
        }
      }
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.findOne({ id: authUserId })
    if (!authUser)
      return {
        ...error404UserUnknown,
        body: "Authenticating user not found",
      }

    const { isAdmin, privilege } = getUserRole(authUser)
    const isSelf = targetId === authUser.id
    if (!isSelf && !isAdmin) {
      return {
        ...error403UserNotAuthorized,
        body: `id of user ${targetId} does not match id of credentials ${authUser.id} and credentialed user is not admin`,
      }
    }

    if (
      !isAdmin &&
      (Object.keys(user) as (keyof User)[]).some(key =>
        adminOnlyModifiableUserProperties.includes(key)
      )
    ) {
      return error403ForbiddenToModify
    }

    if (targetId === simpleCommentModeratorId) {
      const cannotModify: (keyof UpdateUser)[] = ["password", "email"]
      const isForbidden = (Object.keys(user) as (keyof UpdateUser)[]).some(
        key => cannotModify.includes(key)
      )
      if (isForbidden) {
        return {
          ...error403ForbiddenToModify,
          body: `Modify properties ${cannotModify.join(", ")} via .env file`,
        }
      }
    }

    const foundUser = await users.find({ id: targetId }).limit(1).next()

    if (!foundUser) {
      return error404UserUnknown
    }

    if (!isSelf && !canAdministerTarget(privilege, foundUser)) {
      return error403UserNotAuthorized
    }

    const newProps = toUpdatedUser(user)
    const updatedUser = { ...foundUser, ...newProps }

    const checkUser = isGuestId(targetId)
      ? validateGuestUser(updatedUser, authUserId, isAdmin)
      : validateUser(updatedUser)

    if (!isValidResult(checkUser)) {
      return {
        ...error400BadRequest,
        body: checkUser.reason,
      }
    }

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

    if (userId === simpleCommentModeratorId) {
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

    const { isAdmin, privilege } = getUserRole(authUser)
    const canDelete =
      authUserId === userId
        ? isAdmin || policy.canUserDeleteSelf
        : canAdministerTarget(privilege, foundUser)

    if (!canDelete) {
      return error403UserNotAuthorized
    }

    try {
      await users.deleteOne({ id: userId })
      return success202UserDeleted
    } catch (e) {
      return isAdmin
        ? { ...error500UpdateError, body: toErrorBody(e) }
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

    if (authUser === null) {
      return error404UserUnknown
    }

    const comments: Collection<Comment | DeletedComment | Discussion> = (
      await this.getDb()
    ).collection("comments")
    const parent = await comments.findOne({ id: parentId })

    if (
      !parent ||
      isDeleted(parent) ||
      (isComment(parent) && parent.isApproved === false)
    ) {
      return {
        ...error404CommentNotFound,
        body: `Discussion '${parentId}' not found`,
      }
    }

    const lastComment = (await comments.findOne(
      { userId: authUserId, dateDeleted: { $exists: false } },
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

    const id = generateCommentId(parentId)
    const insertComment: Comment = {
      id,
      text,
      dateCreated: new Date(),
      parentId,
      userId: authUserId,
      ...getCommentPublication(text, getUserRole(authUser).isModerator),
    } as Comment

    try {
      const result = await comments.insertOne(insertComment)
      if (!result.acknowledged) {
        return {
          statusCode: 500,
          body: "Database insertion error",
        }
      }
    } catch (e) {
      console.error(e)
      return getUserRole(authUser).isAdmin
        ? { ...error500UpdateError, body: toErrorBody(e) }
        : error500UpdateError
    }

    // Persistence succeeded; notification failure must not change the 201 response.
    if (this._notificationService) {
      try {
        const notification = await this._notificationService.notifyModerators(
          `New comment posted by ${authUser.name} (${authUser.email})\n\n${insertComment.text}`
        )
        if (notification && isError(notification)) {
          console.error("Comment notification failed", {
            commentId: id,
            statusCode: notification.statusCode,
          })
        }
      } catch {
        // Raw provider errors can contain credentials, headers, and message bodies.
        console.error("Comment notification failed", { commentId: id })
      }
    }

    return {
      ...success201CommentCreated,
      body: { ...insertComment, user: adminSafeUser },
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

    const { isAdmin, isModerator } = getUserRole(authUser)
    const viewer = { id: authUser?.id, isModerator }
    const comments: Collection<Comment | DeletedComment | Discussion> = (
      await this.getDb()
    ).collection("comments")

    const fullCommentPipeline = (id: CommentId, isAdminSafe: boolean) => [
      {
        $match: {
          id,
          parentId: { $exists: true },
        },
      },
      {
        $addFields: {
          isAdminSafe,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "id",
          as: "userarr",
        },
      },
      {
        $addFields: {
          user: {
            $arrayElemAt: ["$userarr", 0],
          },
        },
      },
      {
        $graphLookup: {
          from: "comments",
          startWith: "$id",
          connectFromField: "id",
          connectToField: "parentId",
          as: "replies",
        },
      },
      {
        $unwind: {
          path: "$replies",
          preserveNullAndEmptyArrays: true,
        },
      },
      ...replyAuthorStages,
      {
        $project: {
          parentId: 1,
          id: 1,
          title: 1,
          text: 1,
          dateCreated: 1,
          dateDeleted: 1,
          userId: 1,
          isApproved: 1,
          heldReason: 1,
          deletedReason: 1,
          "user.id": 1,
          "user.email": {
            $cond: {
              "if": {
                $eq: ["$isAdminSafe", true],
              },
              then: "$user.email",
              "else": "$$REMOVE",
            },
          },
          "user.name": 1,
          "user.isVerified": {
            $cond: {
              "if": {
                $eq: ["$isAdminSafe", true],
              },
              then: "$user.isVerified",
              "else": "$$REMOVE",
            },
          },
          "user.privilege": 1,
          "replies.parentId": 1,
          "replies.id": 1,
          "replies.text": 1,
          "replies.dateCreated": 1,
          "replies.dateDeleted": 1,
          "replies.userId": 1,
          "replies.isApproved": 1,
          "replies.heldReason": 1,
          "replies.deletedReason": 1,
          "replies.user.id": 1,
          "replies.user.name": 1,
          "replies.user.privilege": 1,
          "replies.user.isVerified": {
            $cond: {
              "if": {
                $eq: ["$isAdminSafe", true],
              },
              then: "$replies.user.isVerified",
              "else": "$$REMOVE",
            },
          },
          "replies.user.email": {
            $cond: {
              "if": {
                $eq: ["$isAdminSafe", true],
              },
              then: "$replies.user.email",
              "else": "$$REMOVE",
            },
          },
        },
      },
      {
        $project: {
          "replies.userarr": 0,
          "replies.user.hash": 0,
          "user.hash": 0,
        },
      },
      {
        $group: {
          _id: "$_id",
          id: {
            $first: "$id",
          },
          parentId: {
            $first: "$parentId",
          },
          text: {
            $first: "$text",
          },
          title: {
            $first: "$title",
          },
          user: {
            $first: "$user",
          },
          replies: {
            $push: "$replies",
          },
          dateCreated: {
            $first: "$dateCreated",
          },
          dateDeleted: {
            $first: "$dateDeleted",
          },
          userId: { $first: "$userId" },
          isApproved: { $first: "$isApproved" },
          heldReason: { $first: "$heldReason" },
          deletedReason: { $first: "$deletedReason" },
        },
      },
    ]

    const comment = await comments
      .aggregate<Comment>(fullCommentPipeline(targetId, isAdmin))
      .next()
    const notFound = {
      ...error404CommentNotFound,
      body: `Comment '${targetId}' not found`,
    }
    if (!comment) return notFound

    const body = toVisibleComment(comment, viewer)
    const replies = toVisibleReplies(comment.replies, viewer)
    if (body.dateDeleted && !body.deletedReason) return notFound
    if (body.isApproved === false && body.text === null && !replies.length)
      return notFound
    return { ...success200OK, body: { ...body, replies } }
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
        body: `Comment '${targetId}' not found`,
      }
    }

    if (authUser.id !== foundComment.userId) {
      return error403UserNotAuthorized
    }

    if (foundComment.text === text) {
      return error400NoUpdate
    }

    const { isAdmin, isModerator } = getUserRole(authUser)
    const changes = { text, ...getCommentPublication(text, isModerator) }
    const liveComment = {
      _id: foundComment._id,
      dateDeleted: { $exists: false },
    }
    const collation = { locale: "simple" }

    const modifyResult = await comments.findOneAndUpdate(
      { ...liveComment, text: { $ne: text } },
      {
        $set: changes,
        ...(changes.isApproved && { $unset: { heldReason: "" } }),
      },
      { collation, returnDocument: "before" }
    )

    const previous = modifyResult.ok ? modifyResult.value : null
    const saved = previous
      ? { ...previous, ...changes }
      : modifyResult.ok &&
        (await comments.findOne({ ...liveComment, text }, { collation }))

    if (!saved || !isComment(saved)) {
      if (isAdmin) {
        const errorMessage = modifyResult.lastErrorObject
          ? JSON.stringify(modifyResult.lastErrorObject)
          : "Unknown error"
        return { ...error500UpdateError, body: errorMessage }
      }
      return error500UpdateError
    }

    if (this._notificationService && previous) {
      try {
        const notification = await this._notificationService.notifyModerators(
          `Comment edited. Author: ${authUser.name} (${authUser.email})\n\n${saved.text}`
        )
        if (notification && isError(notification)) {
          console.error("Comment edit notification failed", {
            commentId: targetId,
            statusCode: notification.statusCode,
          })
        }
      } catch {
        console.error("Comment edit notification failed", {
          commentId: targetId,
        })
      }
    }

    return {
      ...success200CommentUpdated,
      body: {
        ...toVisibleComment(
          { ...saved, user: toAdminSafeUser(authUser) },
          { id: authUser.id, isModerator }
        ),
        userId: authUser.id,
      },
    }
  }

  commentAPPROVE = async (
    targetId: CommentId,
    reviewedText: string,
    authUserId?: UserId
  ): Promise<Success | Error> => {
    if (!authUserId) return error401UserNotAuthenticated

    const db = await this.getDb()
    const reviewer = await db
      .collection<User>("users")
      .findOne({ id: authUserId })
    if (!reviewer) return error401UserNotAuthenticated
    if (!getUserRole(reviewer).isModerator) return error403UserNotAuthorized

    const matchesReview = {
      $and: [
        { $eq: ["$isApproved", false] },
        { $eq: ["$text", { $literal: reviewedText }] },
      ],
    }
    const result = await db.collection<Comment>("comments").findOneAndUpdate(
      {
        id: targetId,
        parentId: { $exists: true },
        dateDeleted: { $exists: false },
      },
      [
        {
          $set: {
            isApproved: { $cond: [matchesReview, true, "$isApproved"] },
            heldReason: { $cond: [matchesReview, "$$REMOVE", "$heldReason"] },
            heldBy: { $cond: [matchesReview, "$$REMOVE", "$heldBy"] },
          },
        },
      ],
      { collation: { locale: "simple" }, returnDocument: "before" }
    )

    if (!result.ok) return error500UpdateError
    if (!result.value) return error404CommentNotFound
    if (
      result.value.isApproved === false &&
      result.value.text !== reviewedText
    ) {
      return error409ReviewedCommentChanged
    }
    return { ...success200OK, body: "Comment approved" }
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
    authUserId?: UserId,
    deletedReason?: string
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
    const { isAdmin, isModerator } = getUserRole(authUser)

    const notFound = {
      ...error404CommentNotFound,
      body: `Comment '${targetId}' not found`,
    }
    if (!foundComment || !isComment(foundComment)) {
      return notFound
    }

    if (isDeletedComment(foundComment)) {
      return isModerator ? success202CommentDeleted : notFound
    }

    const isAuthor = authUser.id === foundComment.userId
    if (!isAuthor && !isModerator) {
      return error403UserNotAuthorized
    }

    const reason = deletedReason?.trim()
    if (!isAuthor && !reason) {
      return { ...error400BadRequest, body: "A deletion reason is required" }
    }

    try {
      const result = await comments.updateOne(
        { _id: foundComment._id, dateDeleted: { $exists: false } },
        {
          $set: {
            text: null,
            dateDeleted: new Date(),
            deletedBy: authUser.id,
            ...(!isAuthor && { deletedReason: reason }),
          },
          $unset: {
            user: "",
            heldBy: "",
            heldReason: "",
            isApproved: "",
            ...(isAuthor && { deletedReason: "" }),
          },
        }
      )
      if (!result.acknowledged) {
        return error500UpdateError
      }
      if (result.matchedCount) {
        return success202CommentDeleted
      }

      // A concurrent delete may have already recorded the deletion.
      if (
        isModerator &&
        (await comments.findOne({
          _id: foundComment._id,
          dateDeleted: { $exists: true },
        }))
      ) {
        return success202CommentDeleted
      }
      return notFound
    } catch (e) {
      return isAdmin
        ? { ...error500UpdateError, body: toErrorBody(e) }
        : error500UpdateError
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
          body: "Guest accounts are forbidden according to policy `isGuestAccountAllowed:false`",
        })
        return
      }
      const guestUserId = generateGuestId()
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

    const { isAdmin } = getUserRole(authUser)
    if (!policy.canFirstVisitCreateTopic && !isAdmin) {
      return error403UserNotAuthorized
    }

    if (!authUserId || !isAdmin) {
      // User is anonymous, public can create topics, and referrer restrictions are true
      // Let's validate the topic. We do that by comparing the proposed topicId with the `referer` header
      // They should be the same. If not, reject it

      if (!newTopic.referer) {
        return error403UserNotAuthorized
      }

      const allowedOrigins = getAllowedOrigins()
      const normalizedAllowedOrigins = allowedOrigins.map(
        normalizeAllowedOrigin
      )
      const isAllowed = isAllowedReferer(newTopic.referer, allowedOrigins)

      if (!isAllowed) {
        const normalizedReferer = normalizeUrl(newTopic.referer)

        if (normalizedAllowedOrigins.length > 1) {
          const body = `The referer '${normalizedReferer}' does not match any of the expected patterns. Allowed patterns: '${normalizedAllowedOrigins.join(
            " or "
          )}'. Please ensure the referer matches one of the allowed patterns.`
          return { ...error403Forbidden, body }
        } else {
          const body = `The referer '${normalizedReferer}' does not match the expected pattern: '${normalizedAllowedOrigins.join()}'. Please ensure the referer matches the allowed pattern.`
          return { ...error403Forbidden, body }
        }
      }
    }

    const hasInvalidCharacters = newTopic.id.match(/[^a-z0-9-]/)
    if (hasInvalidCharacters) {
      const invalidChar = hasInvalidCharacters ? hasInvalidCharacters[0] : ""
      return {
        ...error400BadRequest,
        body: `Invalid character '${invalidChar}' in topicId`,
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
            body: `Topic ${topic.id}:'${topic.title}' created`,
          }
        else
          return {
            statusCode: 500,
            body: "Database insertion error",
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
    const authUser = authUserId ? await users.findOne({ id: authUserId }) : null

    if (!authUser && !policy.canPublicReadDiscussion) {
      return error404UserUnknown
    }

    const { isAdmin, isModerator } = getUserRole(authUser)
    const viewer = { id: authUser?.id, isModerator }
    const comments: Collection<Comment | DeletedComment | Discussion> = (
      await this.getDb()
    ).collection("comments")

    const discussion = await comments.findOne({ id: targetId })

    if (!discussion || isComment(discussion)) {
      return {
        ...error404CommentNotFound,
        body: `Topic '${targetId}' not found`,
      }
    }

    const fullTopicPipeline = (id: CommentId, isAdminSafe: boolean) => [
      {
        $match: { id },
      },
      {
        $addFields: { isAdminSafe },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "id",
          as: "userarr",
        },
      },
      {
        $addFields: {
          user: {
            $arrayElemAt: ["$userarr", 0],
          },
        },
      },
      {
        $graphLookup: {
          from: "comments",
          startWith: "$id",
          connectFromField: "id",
          connectToField: "parentId",
          as: "replies",
        },
      },
      {
        $unwind: {
          path: "$replies",
          preserveNullAndEmptyArrays: true,
        },
      },
      ...replyAuthorStages,
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
              else: "$$REMOVE",
            },
          },
          "user.name": 1,
          "user.isVerified": {
            $cond: {
              if: { $eq: ["$isAdminSafe", true] },
              then: "$user.isVerified",
              else: "$$REMOVE",
            },
          },
          "user.privilege": 1,
          "replies.parentId": 1,
          "replies.id": 1,
          "replies.text": 1,
          "replies.dateCreated": 1,
          "replies.dateDeleted": 1,
          "replies.userId": 1,
          "replies.isApproved": 1,
          "replies.heldReason": 1,
          "replies.deletedReason": 1,
          "replies.user.id": 1,
          "replies.user.name": 1,
          "replies.user.privilege": 1,
          "replies.user.isVerified": {
            $cond: {
              if: { $eq: ["$isAdminSafe", true] },
              then: "$replies.user.isVerified",
              else: "$$REMOVE",
            },
          },
          "replies.user.email": {
            $cond: {
              if: { $eq: ["$isAdminSafe", true] },
              then: "$replies.user.email",
              else: "$$REMOVE",
            },
          },
        },
      },
      {
        $project: {
          "replies.userarr": 0,
          "replies.user.hash": 0,
          "user.hash": 0,
        },
      },
      {
        $group: {
          _id: "$_id",
          id: {
            $first: "$id",
          },
          parentId: {
            $first: "$parentId",
          },
          text: {
            $first: "$text",
          },
          title: {
            $first: "$title",
          },
          user: {
            $first: "$user",
          },
          replies: {
            $push: "$replies",
          },
          dateCreated: {
            $first: "$dateCreated",
          },
          dateDeleted: {
            $first: "$dateDeleted",
          },
        },
      },
      {
        $project: {
          id: 1,
          parentId: 1,
          text: 1,
          title: 1,
          user: 1,
          dateCreated: 1,
          dateDeleted: 1,
          replies: {
            $cond: {
              if: { $eq: [{ $size: "$replies.id" }, 0] },
              then: "$$REMOVE",
              else: "$replies",
            },
          },
        },
      },
    ]

    const comment = (await comments
      .aggregate(fullTopicPipeline(targetId, isAdmin))
      .next()) as Discussion & { user?: Comment["user"] }
    if (comment) {
      addCommentAuthorRole(comment)
      comment.replies = comment.replies
        ? toVisibleReplies(comment.replies, viewer)
        : undefined
    }
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
    const authUser = authUserId ? await users.findOne({ id: authUserId }) : null

    if (authUserId && !authUser && !policy.canPublicReadDiscussion) {
      return error404UserUnknown
    }

    const db = await this.getDb()

    const comments = db.collection("comments")

    const topicsCursor = await comments.find<WithId<Topic>>({
      parentId: null,
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
        body: `Topic '${targetId}' not found`,
      }
    }

    const { isAdmin } = getUserRole(authUser)
    if (!isAdmin) {
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
            body: isAdmin
              ? modifyResult.lastErrorObject
              : error500UpdateError.body,
          } as Error
      })
      .catch(e => {
        if (isAdmin) {
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
    const foundTopic = await discussions.findOne({ id: topicId })

    if (!foundTopic || isComment(foundTopic)) {
      return {
        ...error404TopicNotFound,
        body: `Topic '${topicId}' not found`,
      }
    }

    const { isAdmin } = getUserRole(authUser)
    if (!isAdmin) {
      return error403UserNotAuthorized
    }

    const getReplies = (id: TopicId) => [
      { $match: { id } },
      {
        $graphLookup: {
          from: "comments",
          startWith: "$id",
          connectFromField: "id",
          connectToField: "parentId",
          as: "replies",
        },
      },
    ]

    type TopicDescendants = {
      id: TopicId
      replies?: { id: CommentId }[]
    }

    try {
      const rawReplies = await discussions
        .aggregate<TopicDescendants>(getReplies(topicId))
        .toArray()
      const commentIds = Array.from(
        new Set(
          rawReplies.flatMap(replyThread => [
            replyThread.id,
            ...(replyThread.replies ?? []).map(reply => reply.id),
          ])
        )
      )

      await discussions.deleteMany({ id: { $in: commentIds } })
      return success202TopicDeleted
    } catch (e) {
      return isAdmin
        ? { ...error500UpdateError, body: toErrorBody(e) }
        : error500UpdateError
    }
  }

  authDELETE = (): Promise<Success> => {
    const pastDate = new Date(0).toUTCString()
    const COOKIE_HEADER = {
      "Set-Cookie": `simple_comment_token=logged-out; path=/; SameSite=${
        this.isCrossSite ? "None; Secure; " : "Strict; "
      }HttpOnly; Expires=${pastDate};`,
    }
    return Promise.resolve({ ...success202LoggedOut, headers: COOKIE_HEADER })
  }

  verifyGET = async (
    token?: AuthToken | null
  ): Promise<Success<TokenClaim> | Error> => {
    try {
      if (!isDefined(token)) return error400BadRequest
      const claim = jwt.verify(token, jwtSecret, { ignoreExpiration: false })
      if (!isTokenClaim(claim)) return error400BadRequest
      else return { ...success200OK, body: claim }
    } catch (error) {
      console.error(error)
      if (error instanceof jwt.TokenExpiredError) {
        return {
          ...error403Forbidden,
          body: `token expired at ${error.expiredAt}`,
        }
      }
      return error400BadRequest
    }
  }

  close = async () => {
    await this.getClient().then(client => client.close())
  }
}
