import type { AuthToken, Comment, CommentId, Discussion, TopicId, Error, NewComment, Success, User, UserId, Topic, AdminSafeUser, DeletedComment, PublicSafeUser } from "./simple-comment";
import { Collection, Db, FindAndModifyWriteOpResultObject, FindOneOptions, InsertOneWriteOpResult, MongoClient, UpdateWriteOpResult, WithId } from "mongodb";
import { Service } from "./Service";
import { adminOnlyModifiableUserProperties, isComment, isDeletedComment, omitProperties, toAdminSafeUser, toPublicSafeUser, toSafeUser } from "./utilities";
import { comparePassword, getAuthToken, hashPassword } from "./crypt";
import { policy } from "../policy";
import { success200OK, error404CommentNotFound, success201UserCreated, error401BadCredentials, error404UserUnknown, error400UserExists, error401UserNotAuthenticated, error403UserNotAuthorized, error400TopicExists, error400UserIdMissing, error500ServerError, success202UserDeleted, success204UserUpdated, error403Forbidden, error413CommentTooLong, error425DuplicateComment, error403ForbiddenToModify, error400CommentIdMissing, success204CommentUpdated, success202CommentDeleted, error400NoUpdate, error404TopicNotFound, success202TopicDeleted } from "./messages";

export class MongodbService extends Service {

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
    const outUser = isAdmin ? omitProperties(foundUser, ["hash"]) : omitProperties(foundUser, ["hash", "email"])
    resolve({ ...success200OK, body: outUser })
  });

  /**
   * List users
   *
   * returns List
   **/
  userListGET = (authUserId?: UserId) => new Promise<Success<(AdminSafeUser[] | PublicSafeUser[])> | Error>(async (resolve, reject) => {

    const usersCollection: Collection<User> = (await this.getDb()).collection("users")
    const users = await usersCollection.find({}).toArray()
    const authUser = users.find(u => u.id === authUserId)
    const isAdmin = authUser ? authUser.isAdmin : false
    const outUsers = isAdmin ? users.map(toAdminSafeUser) : users.map(toPublicSafeUser)

    resolve({ ...success200OK, body: outUsers })
  });

  /**
   * Update a user
   * 
   * NB: It is always safe to return AdminSafeUser because
   * authUser is always an admin or the user themself
   *
   * userId byte[] 
   * returns Success<AdminSafeUser>
   **/
  userPUT = (user: Partial<User>, authUserId?: UserId) => new Promise<Success<AdminSafeUser> | Error>(async (resolve, reject) => {

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

    if (user.id !== authUser.id && !authUser.isAdmin) {
      reject(error403UserNotAuthorized)
    }

    if (!authUser.isAdmin && (Object.keys(user) as (keyof User)[]).some(key => adminOnlyModifiableUserProperties.includes(key))) {
      reject(error403ForbiddenToModify)
    }

    // At this point, user.id exists and authUser can alter it

    const foundUser = await users.findOne({ id: user.id })

    if (!foundUser) {
      reject(error404UserUnknown)
      return
    }

    const canPut = authUser ? authUser.isAdmin || authUserId === foundUser.id : false

    if (!canPut) {
      if (authUser) reject(error403UserNotAuthorized)
      else reject(error401UserNotAuthenticated)
      return
    }

    const updatedUser = { ...foundUser, ...user }

    users.updateOne({ id: updatedUser.id }, { $set: updatedUser })
      .then((x: UpdateWriteOpResult) => {

        // return isAdmin version of this user, because the user is either an admin or self
        const safeUser = toAdminSafeUser(updatedUser)

        //TODO: update all of the user's comments, too!
        resolve({ ...success204UserUpdated, body: safeUser })
      })
      .catch(e => reject(error500ServerError))
  });

  /**
   * Delete a user
   *
   * userId byte[] 
   * returns Success
   **/
  userDELETE = (userId: UserId, authUserId?: UserId) => new Promise<Success | Error>(async (resolve, reject) => {

    const users: Collection<User> = (await this.getDb()).collection("users")

    if (!authUserId) {
      reject(error401UserNotAuthenticated)
      return
    }

    //TODO: username admin as .env variable
    if (userId === "admin") {
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

    const canDelete = authUser.isAdmin || (authUserId === userId && policy.userCanDeleteSelf)

    if (!canDelete) {
      reject(error403UserNotAuthorized)
      return
    }

    //TODO: delete all of the user's comments, too!
    users.deleteOne({ id: userId })
      .then(x => resolve(success202UserDeleted))
      .catch(e => authUser.isAdmin ? reject({ ...error500ServerError, body: e }) : reject(error500ServerError))
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

    if (comment.text.length > policy.maxCommentLengthChars) {
      reject(error413CommentTooLong)
      return
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.findOne({ id: authUserId })

    if (!authUser) {
      reject(error404UserUnknown)
      return
    }

    const comments: Collection<Comment | DeletedComment | NewComment | Discussion> = (await this.getDb()).collection("comments")
    const parent = await comments.findOne({ id: parentId })

    if (!parent || isDeletedComment(parent)) {
      reject({ ...error404CommentNotFound, message: `parentId '${parentId}' not found` })
      return
    }

    // Prevent duplicate comments
    const findOptions: FindOneOptions<Comment> = { sort: { dateCreated: -1 } }
    const lastComment = await comments.findOne({ "user.id": authUserId }, findOptions) as Comment

    if (lastComment && lastComment.text === comment.text && lastComment.parentId === parentId) {
      reject(error425DuplicateComment)
      return
    }

    const adminSafeUser = toAdminSafeUser(authUser)
    const insertComment: NewComment = { ...comment, dateCreated: new Date(), parentId, user: adminSafeUser } as NewComment

    comments.insertOne(insertComment).then((response: InsertOneWriteOpResult<WithId<Comment>>) => {

      const insertedComment: Comment = response.ops.find(x => true)

      if (insertComment.parentId !== parentId) {
        reject({ code: 500, message: "Database insertion error" })
        return
      }

      resolve({ code: 201, message: `Comment '${insertComment.id}' created`, body: insertedComment })
    })
      .catch(e => {
        console.error(e)
        authUser.isAdmin ? reject({ ...error500ServerError, body: e }) : reject(error500ServerError)
      })
  })

  /**
   * Read a comment
   *
   * discussionId byte[] 
   * commentId byte[] 
   * returns Comment
   **/
  commentGET = (targetId: (TopicId | CommentId), authUserId?: UserId) => new Promise<Success<Comment | Discussion> | Error>(async (resolve, reject) => {

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

    const isAdmin = authUser ? authUser.isAdmin : false
    const comments: Collection<Comment | DeletedComment | Discussion> = (await this.getDb()).collection("comments")
    const foundComment = await comments.findOne({ id: targetId })

    if (!foundComment || !isComment(foundComment) || isDeletedComment(foundComment)) {
      reject({ ...error404CommentNotFound, message: `Comment '${targetId}' not found` })
      return
    }

    const getReplies = (id) => [
      { $match: { id } },
      {
        $graphLookup: {
          from: 'comments',
          startWith: "$id",
          connectFromField: 'id',
          connectToField: 'parentId',
          as: "replies"
        }
      }]

    const comment = isComment(foundComment) ? { ...foundComment, user: toSafeUser(foundComment.user as User, isAdmin) } : foundComment
    const rawReplies = await comments.aggregate(getReplies(foundComment.id)).toArray() as Comment[]
    const replies = rawReplies.map(r => ({ ...r, user: toSafeUser(r.user as User, isAdmin) })) as Comment[]
    const body = { ...comment, replies }

    resolve({ ...success200OK, body })
  });

  /**
   * Update a comment
   *
   * discussionId byte[] 
   * commentId byte[] 
   * returns Comment
   **/
  commentPUT = (updatedComment: { id: CommentId, text: string }, authUserId?: UserId) => new Promise<Success<Comment> | Error>(async (resolve, reject) => {

    if (!updatedComment.hasOwnProperty("id")) {
      reject(error400CommentIdMissing)
      return
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.findOne({ id: authUserId })

    if (!authUser) {
      reject(error401UserNotAuthenticated)
      return
    }

    const targetId = updatedComment.id
    const comments: Collection<Comment | Discussion> = (await this.getDb()).collection("comments")
    const foundComment = await comments.findOne({ id: targetId })

    if (!foundComment || !isComment(foundComment) || isDeletedComment(foundComment)) {
      reject({ ...error404CommentNotFound, message: `Comment '${targetId}' not found` })
      return
    }

    if (foundComment.text === updatedComment.text) {
      reject(error400NoUpdate)
      return
    }

    const canEdit = authUser.isAdmin || (authUser.id === foundComment.user.id)

    if (!canEdit) {
      reject(error403UserNotAuthorized)
      return
    }

    const diffKeys: string[] = Object.keys(updatedComment).filter(key => !["text", "id"].includes(key)).reduce((diff: string[], key: string) => updatedComment[key] == foundComment[key] ? diff : [...diff, key], [])

    if (diffKeys.length > 0) {
      reject({ ...error403UserNotAuthorized, message: `Cannot alter ${diffKeys.join(", ")} ` })
      return
    }

    // can only edit text
    const { text } = updatedComment
    const user = toSafeUser(foundComment.user as User, authUser.isAdmin)
    const returnComment = { ...foundComment, text, user }

    comments.findOneAndUpdate({ id: foundComment.id }, { $set: returnComment })
      .then((x: FindAndModifyWriteOpResultObject<Comment>) => resolve({ ...success204CommentUpdated, body: returnComment }))
      .catch(e => authUser.isAdmin ? reject({ ...error500ServerError, body: e }) : reject(error500ServerError))
  });

  /**
   * Delete a comment
   *
   * discussionId byte[] 
   * commentId byte[] 
   * returns Success
   **/
  commentDELETE = (targetId: CommentId, authUserId?: UserId) => new Promise<Success | Error>(async (resolve, reject) => {

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

    const comments: Collection<Comment | Discussion> = (await this.getDb()).collection("comments")
    const foundComment = await comments.findOne({ id: targetId })

    if (!foundComment || !isComment(foundComment) || isDeletedComment(foundComment)) {
      reject({ ...error404CommentNotFound, message: `Comment '${targetId}' not found` })
      return
    }

    const canDelete = authUser.isAdmin || (authUser.id === foundComment.user.id)

    if (!canDelete) {
      reject(error403UserNotAuthorized)
      return
    }

    // If we delete a comment that has replies it will orphan
    // them, so first check for even one
    const reply = await comments.findOne({ parentId: targetId })

    if (reply) {
      // it cannot be deleted, but set user and text to null
      const deletedComment = { ...foundComment, user: null, text: null, dateDeleted: new Date() }

      comments
        .updateOne({ id: foundComment.id }, { $set: deletedComment })
        .then(x => resolve({ ...success202CommentDeleted, body: deletedComment }))
        .catch(e => authUser.isAdmin ? reject({ ...error500ServerError, body: e }) : reject(error500ServerError))
    }
    else {

      // entire comment can be deleted without trouble
      // but we don't want anyone to reply in the meantime, so lock it
      // using findOneAndDelete
      comments
        .findOneAndDelete({ id: foundComment.id })
        .then(x => resolve(success202CommentDeleted))
        .catch(e => authUser.isAdmin ? reject({ ...error500ServerError, body: e }) : reject(error500ServerError))
    }
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
      reject(error404UserUnknown)
      return
    }

    if (!authUser.isAdmin) {
      reject(error403UserNotAuthorized)
      return
    }

    const discussions: Collection<Discussion> = (await this.getDb()).collection("comments")
    const oldDiscussion = await discussions.findOne({ id: topic.id })

    if (oldDiscussion) {
      reject(error400TopicExists)
      return
    }

    discussions
      .insertOne(topic)
      .then((response: InsertOneWriteOpResult<WithId<Discussion>>) => {

        const insertedDiscussion: Discussion = response.ops.find(x => true)

        if (insertedDiscussion.id !== topic.id) reject({ code: 500, message: "Database insertion error" })
        else resolve({ code: 201, message: `Discssion '${topic.title}' created` })
      })
      .catch(e => {
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
  topicGET = (discussionId: TopicId, authUserId?: UserId) => new Promise<Success<Discussion> | Error>(async (resolve, reject) => {

    if (!authUserId && !policy.publicCanRead) {
      reject(error401UserNotAuthenticated)
      return
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.findOne({ id: authUserId })

    if (!authUser && !policy.publicCanRead) {
      reject(error404UserUnknown)
      return
    }

    const isAdmin = authUser ? authUser.isAdmin : false
    const comments: Collection<Comment | DeletedComment | Discussion> = (await this.getDb()).collection("comments")
    const discussion = await comments.findOne({ id: discussionId })

    if (!discussion || isComment(discussion)) {
      reject({ ...error404CommentNotFound, message: `Topic '${discussionId}' not found` })
      return
    }

    const getReplies = (id) => [
      { $match: { id } },
      {
        $graphLookup: {
          from: 'comments',
          startWith: "$id",
          connectFromField: 'id',
          connectToField: 'parentId',
          as: "replies"
        }
      }]

    const rawReplies = await comments.aggregate(getReplies(discussion.id)).toArray() as Comment[]
    const replies = rawReplies.map(r => ({ ...r, user: toSafeUser(r.user as User, isAdmin) })) as Comment[]
    const body = { ...discussion, replies }

    resolve({ ...success200OK, body })
  });

  /**
   * Read the list of discussions
   * Discussion discovery
   *
   * mme
   * returns List
   **/
  topicListGET = (authUserId?: UserId) => new Promise<Success<Topic[]> | Error>(async (resolve, reject) => {

    if (!authUserId && !policy.publicCanRead) {
      reject(error401UserNotAuthenticated)
      return
    }

    const users: Collection<User> = (await this.getDb()).collection("users")
    const authUser = await users.findOne({ id: authUserId })

    if (!authUser && !policy.publicCanRead) {
      reject(error404UserUnknown)
      return
    }

    const comments: Collection<Comment | Topic> = (await this.getDb()).collection("comments")
    const allDiscussion = await comments.find({}).toArray()
    const topics = allDiscussion.filter(c => !isComment(c)) as Topic[]

    resolve({ ...success200OK, body: topics })
  });

  /**
   * Update a discussion (lock it)
   *
   * discussionId byte[] 
   * returns Success
   **/
  topicPUT = (topic: Pick<Topic, "id" | "title" | "isLocked">, authUserId?: UserId) => new Promise<Success<Topic> | Error>(async (resolve, reject) => {

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
    const comments: Collection<Comment | Topic> = (await this.getDb()).collection("comments")
    const foundTopic = await comments.findOne({ id: targetId })

    if (!foundTopic || isComment(foundTopic)) {
      reject({ ...error404CommentNotFound, message: `Topic '${targetId}' not found` })
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
      .then((x: FindAndModifyWriteOpResultObject<Comment>) => resolve({ ...success204CommentUpdated, body: updateTopic }))
      .catch(e => authUser.isAdmin ? reject({ ...error500ServerError, body: e }) : reject(error500ServerError))
  });

  /**
   * Delete a discussion
   *
   * discussionId byte[] 
   * returns Success
   **/
  topicDELETE = (topicId: TopicId, authUserId?: UserId) => new Promise<Success | Error>(async (resolve, reject) => {

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

    const discussions: Collection<Comment | Topic> = (await this.getDb()).collection("comments")
    const foundTopic = await discussions.findOne({ id: topicId })

    if (!foundTopic || isComment(foundTopic)) {
      reject({ ...error404TopicNotFound, message: `Topic '${topicId}' not found` })
      return
    }

    if (!authUser.isAdmin) {
      reject(error403UserNotAuthorized)
      return
    }

    // If we delete a topic that has replies it will orphan
    // them, so first check for even one
    const reply = await discussions.findOne({ parentId: topicId })

    if (reply) {

      // well, shit. delete all of the replies
      const getReplies = (id) => [
        { $match: { id } },
        {
          $graphLookup: {
            from: 'comments',
            startWith: "$id",
            connectFromField: 'id',
            connectToField: 'parentId',
            as: "replies"
          }
        }]

      const rawReplies = await discussions.aggregate(getReplies(foundTopic.id)).toArray()
      const commentIds = rawReplies.map(c => c.id)

      await discussions.deleteMany({ id: { $in: commentIds } })
    }

    // entire comment can be deleted without trouble
    // but we don't want anyone to reply in the meantime, so lock it:
    discussions
      .findOneAndDelete({ id: foundTopic.id })
      .then(x => resolve(success202TopicDeleted))
      .catch(e => authUser.isAdmin ? reject({ ...error500ServerError, body: e }) : reject(error500ServerError))
  });

  close = async () => {
    await this.getClient().then(client => client.close())
  }
}