import { AuthToken, Comment, CommentId, Discussion, TopicId, Error, Success, Topic, User, UserId, AdminSafeUser, PublicSafeUser, Email, DeletedComment } from "./simple-comment";
import { MongodbService } from "./MongodbService";
import { Db, MongoClient } from "mongodb";
import { error404CommentNotFound, success201CommentCreated, success202CommentDeleted, error425DuplicateComment, error413CommentTooLong, error403Forbidden, error401BadCredentials, error404UserUnknown, success202UserDeleted, error400UserExists, error401UserNotAuthenticated, error403UserNotAuthorized, success204UserUpdated, error404TopicNotFound, success202TopicDeleted, error403ForbiddenToModify } from "./messages";
import { getAuthToken, hashPassword, uuidv4 } from "./crypt";
import { policy } from "../policy";
import { adminUnsafeUserProperties, isComment, isDeletedComment, omitProperties, publicUnsafeUserProperties, toAdminSafeUser, toPublicSafeUser } from "./utilities";

declare const global: any

const userInputAlpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÅ abcdefghijklmnopqrstuvwxyzäöå 1234567890 !@#$%^&*()_+-= "
const asciiAlpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-"
const randomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min)) + min
const randomString = (alpha: string = asciiAlpha, len: number = randomNumber(10, 50), str: string = ""): string => len === 0 ? str : randomString(alpha, len - 1, `${str}${alpha.charAt(Math.floor(Math.random() * alpha.length))}`)
const randomDate = () => new Date(randomNumber(0, new Date().valueOf()))
// Returns a random email that will validate but does not create examples of all possible valid emails 
const randomEmail = (): Email => `${randomString(asciiAlpha)}@${randomString(asciiAlpha)}.${randomString(asciiAlpha)}`

// Functions that generate fake data - these could be moved to a common file to help other Service tests
const getRandomComment = (parentId: (TopicId | CommentId), user: User): Comment => ({ id: uuidv4(), parentId, user, text: randomString(userInputAlpha, randomNumber(50, 500)), dateCreated: new Date() })
const getRandomCommentTree = (replies: number, users: User[], chain: (Comment | Discussion)[]): (Comment | Discussion)[] => replies <= 0 ? chain : getRandomCommentTree(replies - 1, users, [...chain, getRandomComment(getRandomElement(chain).id, getRandomElement(users))])
const getRandomElement = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const getRandomGroupUsers = (population: number, users: User[] = []): User[] => population <= 0 ? users : getRandomGroupUsers(population - 1, [...users, getRandomUser()])
const getRandomListOfTopics = (num: number = randomNumber(2, 20), topics: Topic[] = []): Topic[] => num <= 0 ? topics : getRandomListOfTopics(num - 1, [...topics, getRandomTopic()])
const getRandomTopic = (): Topic => ({ id: randomString(asciiAlpha, randomNumber(10, 40)), isLocked: false, title: randomString(userInputAlpha, randomNumber(25, 100)), dateCreated: randomDate() })
const getRandomUser = (): User => ({ id: randomString(), email: randomEmail(), name: randomString(userInputAlpha), isVerified: Math.random() > 0.5, isAdmin: Math.random() > 0.5, hash: randomString(asciiAlpha, 32) })

// Verification functions
const isPublicSafeUser = (u: Partial<User>) => (Object.keys(u) as (keyof User)[]).every(key => !publicUnsafeUserProperties.includes(key))
const isAdminSafeUser = (u: Partial<User>) => (Object.keys(u) as (keyof User)[]).every(key => !adminUnsafeUserProperties.includes(key))

// Fake data objects
const mockAdminUser: Omit<User, "hash"> = { id: "admin", isVerified: true, email: randomEmail(), isAdmin: true, name: "Simple Comment Admin", }
const mockAdminUserPassword = randomString(asciiAlpha, randomNumber(10, 40))
const mockGroupUsers = getRandomGroupUsers(100)
const mockNewTopic = getRandomTopic()
const mockNewUser = { ...getRandomUser(), isAdmin: false }
let mockNewComment: Pick<Comment, "text" | "user" | "parentId">
const mockTopics: Topic[] = getRandomListOfTopics()
const mockCommentTree = getRandomCommentTree(5000, mockGroupUsers, mockTopics)
const singleMockDiscussion = getRandomListOfTopics(1)
const singleMockCommentTree = getRandomCommentTree(300, mockGroupUsers, singleMockDiscussion)

let mockAllUsers = []
let service: MongodbService;
let client: MongoClient
let db: Db

describe('Full API service test', () => {

  beforeAll(async () => {
    service = new MongodbService(global.__MONGO_URI__, global.__MONGO_DB_NAME__);
    client = await service.getClient()
    db = await service.getDb()
    const hash = await hashPassword(mockAdminUserPassword)
    mockAllUsers = [...mockGroupUsers, { ...mockAdminUser, hash }]
    const users = db.collection("users");
    users.insertMany(mockAllUsers)
    const comments = db.collection<Comment | DeletedComment | Discussion>("comments")
    await comments.insertMany(mockCommentTree)
  });

  afterAll(async () => {
    await service.destroy()
    await client.close()
  });

  // post to auth with unknown credentials should return error 404
  test("POST to auth with unknown user", () => {
    expect.assertions(1)
    return service.authPOST(randomString(), randomString(userInputAlpha)).catch(e => expect(e).toEqual(error404UserUnknown))
  });
  // post to auth with incorrect credentials should return error 401
  test("POST to auth with incorrect password", () => {
    expect.assertions(1)
    return service.authPOST(mockAdminUser.id, randomString(userInputAlpha, 40)).catch(e => expect(e).toEqual(error401BadCredentials))
  });
  // post to auth with correct credentials should return authtoken
  test("POST to auth with correct credentials", () => {
    const authToken = getAuthToken(mockAdminUser.id)
    // this will occassionally fail when the getAuthToken expiration is +- 1 second difference
    return service.authPOST(mockAdminUser.id, mockAdminUserPassword).then((value: AuthToken) => expect(value).toEqual(authToken))
  });

  // User Create
  // post to /user should return user and 201 User created
  test("POST to /user", () => {
    const newUserPassword = randomString(userInputAlpha, Math.floor(Math.random() * 30) + 10)
    return service.userPOST(mockNewUser as User, newUserPassword).then(value => expect(value).toHaveProperty("code", 201))
  })
  // post to /user with existing username should return 400 user exists
  test("POST to /user with identical credentials", () => {
    const newUserPassword = randomString(userInputAlpha, Math.floor(Math.random() * 30) + 10)
    expect.assertions(1)
    return service.userPOST(mockNewUser as User, newUserPassword).catch(value => expect(value).toBe(error400UserExists))
  })

  // User Read
  // get to /user/{userId} where userId does not exist should return 404
  test("GET to /user/{userId} where userId does not exist", () => {
    expect.assertions(1)
    return service.userGET(randomString(), mockAdminUser.id).catch(e => expect(e).toEqual(error404UserUnknown))
  })
  // get to /user/{userId} should return User and 200
  test("GET to /user/{userId} should", () => {
    const targetUser = getRandomElement(mockGroupUsers)
    return service.userGET(targetUser.id, mockAdminUser.id).then((res: Success<User>) => {
      expect(res).toHaveProperty("code", 200)
      expect(res).toHaveProperty("body")
      expect(res.body).toHaveProperty("id", targetUser.id)
      expect(res.body).toHaveProperty("name", targetUser.name)
      expect(res.body).not.toHaveProperty("hash")
      expect(res.body).toHaveProperty("email")
    })
  })
  // get to /user should return list of users
  test("GET /user", () => {
    return service.userListGET().then((res: Success<User[]>) => {
      expect(res.code).toBe(200)
      expect(res.body.map(u => u.id)).toEqual(expect.arrayContaining(mockAllUsers.map(u => u.id)))
      const checkProp = (prop: string) => res.body.some(u => u[prop])
      expect(checkProp("email")).toBe(false)
      expect(checkProp("hash")).toBe(false)
    })
  })
  // get to /user with admin credentials can return list of users with email
  test("GET /user admin", () => {
    return service.userListGET(mockAdminUser.id).then((res: Success<User[]>) => {
      expect(res.code).toBe(200)
      expect(res.body.map(u => u.id)).toEqual(expect.arrayContaining(mockAllUsers.map(u => u.id)))
      const checkProp = (prop: string) => res.body.some(u => u[prop])
      expect(checkProp("email")).toBe(true)
      expect(checkProp("hash")).toBe(false)
    })
  })// get to /user/{userId} should return user
  test("GET to /user/{userId} with admin", () => {
    const user = getRandomElement(mockGroupUsers)
    return service.userGET(user.id, mockAdminUser.id).then((res: Success<User>) => {
      expect(res).toHaveProperty("code", 200)
      expect(res.body).toHaveProperty("id", user.id)
      expect(res.body).toHaveProperty("name", user.name)
      expect(res.body).not.toHaveProperty("hash")
      expect(res.body).toHaveProperty("email")
    })
  })

  test("GET to /user/{userId} with public user", () => {
    const user = getRandomElement(mockGroupUsers)
    return service.userGET(user.id).then((res: Success<User>) => {
      expect(res).toHaveProperty("code", 200)
      expect(res.body).toHaveProperty("id", user.id)
      expect(res.body).toHaveProperty("name", user.name)
      expect(res.body).not.toHaveProperty("hash")
      expect(res.body).not.toHaveProperty("email")
    })
  })
  // User Update
  // put to /user/{userId} with no credentials should return 401
  test("PUT to /user/{userId} with no credentials", () => {
    const targetUser = getRandomElement(mockGroupUsers)
    return service.userPUT(targetUser).then(res => expect(true).toBe(false)).catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // put to /user/{userId} with improper credentials should return 403
  test("PUT to /user/{userId} with improper credentials", () => {
    const targetUser = getRandomElement(mockGroupUsers)
    const ordinaryUser = getRandomElement(mockGroupUsers.filter(u => !u.isAdmin))
    return service.userPUT(targetUser, ordinaryUser.id).then(res => expect(true).toBe(false)).catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // put to /user/{userId} with public, own credentials cannot modify isAdmin
  test("PUT to /user/{userId} with public, own credentials cannot modify isAdmin", () => {
    const ordinaryUser = getRandomElement(mockGroupUsers.filter(u => !u.isAdmin))
    const updatedUser = { ...ordinaryUser, isAdmin: true }
    expect.assertions(1)
    return service.userPUT(updatedUser, ordinaryUser.id).catch(error => expect(error).toBe(error403ForbiddenToModify))
  })
  // put to /user/{userId} with public, own credentials cannot modify isVerified
  test("PUT to /user/{userId} with public, own credentials cannot modify isVerified", () => {
    const ordinaryUser = getRandomElement(mockGroupUsers.filter(u => !u.isAdmin))
    const updatedUser = { ...ordinaryUser, isVerified: true }
    expect.assertions(1)
    return service.userPUT(updatedUser, ordinaryUser.id).catch(error => expect(error).toBe(error403ForbiddenToModify))
  })
  // put to /user/{userId} with own credentials should alter user return 204 User updated
  test("PUT to /user/{userId} with own credentials", () => {
    const targetUser = getRandomElement(mockGroupUsers)
    const updatedUser = { id: targetUser.id, name: randomString(userInputAlpha, 25) }
    return service.userPUT(updatedUser, targetUser.id).then((res: Success<AdminSafeUser>) => {
      expect(res).toHaveProperty("code", 204)
      expect(res).toHaveProperty("body")
      expect(res.body.name).toBe(updatedUser.name)
      expect(isAdminSafeUser(res.body)).toBe(true)
    })
  })
  // put to /user/{userId} with admin credentials should alter user return 204 User updated
  test("PUT to /user/{userId} with admin credentials", () => {
    const adminGroup = mockGroupUsers.filter(u => u.isAdmin)
    const targetUser = mockGroupUsers.find(u => u.id !== mockAdminUser.id)
    const updatedUser: User = { ...targetUser, name: randomString(userInputAlpha, 25), isAdmin: true, isVerified: true }
    const adminAuthUser = adminGroup.find(u => u.id !== targetUser.id)
    return service.userPUT(updatedUser, adminAuthUser.id).then((res: Success<AdminSafeUser>) => {
      expect(res).toHaveProperty("code", 204)
      expect(res).toHaveProperty("body", toAdminSafeUser(updatedUser))
      expect(res.body).toHaveProperty("isAdmin", true)
      expect(res.body).toHaveProperty("isVerified", true)
    })
  })
  // put to /user/{userId} where userId does not exist (and admin credentials) should return 404
  test("PUT to /user/{userId} where userId does not exist and admin credentials", () => {
    const adminGroup = mockGroupUsers.filter(u => u.isAdmin)
    const targetUser = getRandomUser()
    const adminAuthUser = adminGroup.find(u => u.id !== targetUser.id)
    expect.assertions(1)
    return service.userPUT(targetUser, adminAuthUser.id).catch(error => expect(error).toBe(error404UserUnknown))
  })

  // User Delete
  // delete to /user/{userId} with no credentials should return 401
  test("DELETE to /user/{userId} with no credentials", () => {
    const user = getRandomElement(mockGroupUsers)
    expect.assertions(1)
    return service.userDELETE(user.id).catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // delete to /user/{userId} with improper credentials should return 403
  test("DELETE to /user/{userId} with improper credentials", () => {
    const userToDelete = getRandomElement(mockGroupUsers)
    const improperAuthUser = getRandomElement(mockGroupUsers.filter(u => !u.isAdmin && u.id !== userToDelete.id))
    expect.assertions(1)
    return service.userDELETE(userToDelete.id, improperAuthUser.id).catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // delete to /user/{userId} where userId does not exist and admin credentials should return 404
  test("DELETE to /user/{userId} where userId does not exist and admin credentials", () => {
    const nonExistentUser = getRandomUser()
    expect.assertions(1)
    return service.userDELETE(nonExistentUser.id, mockAdminUser.id).catch(e => expect(e).toBe(error404UserUnknown))
  })
  // delete to /user/{userId} with hardcoded admin userId should return 403
  test("DELETE to /user/{userId} targeting hardcoded admin userId", () => {
    const adminGroup = mockGroupUsers.filter(u => u.isAdmin)
    const adminAuthUser = adminGroup.find(u => u.id !== mockAdminUser.id)
    expect.assertions(1)
    return service.userDELETE(mockAdminUser.id, adminAuthUser.id).catch(e => expect(e).toBe(error403Forbidden))
  })
  // delete to /user/{userId} should delete user and return 202 User deleted
  test("DELETE to /user/{userId} by admin", () => {
    const userToDelete = getRandomElement(mockGroupUsers)
    const adminAuthUser = getRandomElement(mockGroupUsers.filter(u => u.isAdmin))
    expect.assertions(2)
    return service.userDELETE(userToDelete.id, adminAuthUser.id).then(async (res) => {
      expect(res).toBe(success202UserDeleted)
      const user = await db.collection("users").findOne({ id: userToDelete.id })
      expect(user).toBeNull()
    })
  })
  test('DELETE to /user/{userId} by self', () => {
    const userToDelete = getRandomElement(mockGroupUsers)
    expect.assertions(2)
    return service.userDELETE(userToDelete.id, userToDelete.id).then(async (res) => {
      expect(res).toBe(success202UserDeleted)
      const user = await db.collection("users").findOne({ id: userToDelete.id })
      expect(user).toBeNull()
    })
  })
  // Comment Create 
  // post comment to comment to /discussion/{discussionId} with too long comment should return 413 Comment too long
  test('POST comment to /comment/{commentId} with too long comment', () => {
    const parentComment = getRandomElement(mockCommentTree)
    const user = getRandomElement(mockGroupUsers) as PublicSafeUser
    const comment: Pick<Comment, "text" | "user"> = {
      text: randomString(userInputAlpha, policy.maxCommentLengthChars + 1),
      user
    }
    expect.assertions(1)
    return service.commentPOST(parentComment.id, comment, user.id).catch(e => expect(e).toBe(error413CommentTooLong))
  })
  // post comment to /comment/{commentId} should return comment and 201 Comment created
  test('POST to /comment/{commentId}', () => {
    const parentComment = getRandomElement(mockCommentTree)
    const user = getRandomElement(mockGroupUsers) as PublicSafeUser
    mockNewComment = {
      text: randomString(userInputAlpha, policy.maxCommentLengthChars - 1),
      parentId: parentComment.id,
      user
    }
    return service.commentPOST(parentComment.id, mockNewComment, user.id).then((res: Success<Comment>) => {
      expect(res).toHaveProperty("code", 201)
      expect(res).toHaveProperty("body")
      expect(res.body).toHaveProperty("text", mockNewComment.text)
      expect(res.body).toHaveProperty("user")
      expect(isAdminSafeUser(res.body.user)).toBe(true)
    })
  })
  // post comment to /comment/{commentId} with identical information within a short length of time should return 425 Possible duplicate comment
  test('POST comment to /comment/{commentId} with identical information', () => {
    const parentCommentId = mockNewComment.parentId
    const user = mockNewComment.user
    expect.assertions(1)
    return service.commentPOST(parentCommentId, mockNewComment, user.id).catch(e => expect(e).toBe(error425DuplicateComment))
  })

  // Comment Read
  // get comment to /comment/{commentId} where commentId does not exist should return 404
  test('GET comment to /comment/{commentId} where comment does not exist', () => {
    const parentCommentId = uuidv4()
    const user = getRandomElement(mockGroupUsers)
    expect.assertions(1)
    return service.commentGET(parentCommentId, user.id).catch(e => expect(e).toHaveProperty("code", 404))
  })
  // get comment to /comment/{commentId} should return the comment with 200 OK
  test('GET comment to /comment/{commentId}', () => {
    const commentsWithChildren = mockCommentTree.filter(isComment).reduce((withChildren: Comment[], comment: Comment, i, arr) => arr.some(c => c.parentId === comment.id) ? [...withChildren, comment] : withChildren, [])
    const randomComment = getRandomElement(commentsWithChildren)
    const targetComment = { ...randomComment, user: toPublicSafeUser(randomComment.user as User) }
    const getChildren = (commentId: CommentId, allComments: (Discussion | Comment)[]) => allComments.filter(c => isComment(c)).filter((c: Comment) => c.parentId === commentId)
    const targetChildren = getChildren(targetComment.id, mockCommentTree)

    return service.commentGET(targetComment.id).then((res: Success<Comment>) => {
      const allUsers = (comments: Comment[]) => comments.map(c => c.user)
      expect(res).toHaveProperty("code", 200)
      expect(res).toHaveProperty("body")
      //@ts-ignore
      expect(res.body).toHaveProperty("id", targetComment.id)
      expect(res.body).toHaveProperty("text", targetComment.text)
      expect(isPublicSafeUser(res.body.user)).toBe(true)
      expect(res.body).toHaveProperty("replies")
      expect(res.body.replies.length).toBeGreaterThan(0)
      expect(res.body).toHaveProperty("user")
      expect(allUsers(res.body.replies).every(u => isPublicSafeUser(u))).toBe(true)
    })
  })

  // Comment Update
  // put comment to /comment/{commentId} with no credentials should return 401
  test('PUT comment to /comment/{commentId} with no credentials', () => {
    const randomComment = getRandomElement(mockCommentTree.filter(isComment))
    const comment = {id:randomComment.id, text:randomString()}
    expect.assertions(1)
    return service.commentPUT(comment).catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // put comment to /comment/{commentId} with improper credentials should return 403
  test('PUT comment to /comment/{commentId} with improper credentials', () => {
    const randomComment = getRandomElement(mockCommentTree.filter(c => !c.hasOwnProperty("isLocked"))) as Comment
    const comment = { id:randomComment.id, text: randomString() }
    const improperAuthUser = getRandomElement(mockGroupUsers.filter(u => !u.isAdmin && u.id !== randomComment.user.id))
    expect.assertions(1)
    return service.commentPUT(comment, improperAuthUser.id).catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // put comment to /comment/{commentId} altering anything other than 'text' should ignore updates 
  test('PUT hacked comment to /comment/{commentId}', () => {
    const randomComment = getRandomElement(mockCommentTree.filter(c => !c.hasOwnProperty("isLocked"))) as Comment
    const comment = { id: randomComment.id, text: randomString() }
    const authUser = randomComment.user
    const targetUser = getRandomElement(mockGroupUsers.filter(u => u.id !== authUser.id))
    const hackedComments: Partial<Comment>[] = [{ ...comment, user: targetUser }, { ...comment, dateCreated: new Date() }, { ...comment, parentId: uuidv4() }]
    const hack = getRandomElement(hackedComments)
    expect.assertions(1)
    return service.commentPUT(hack as { id: CommentId, text: string }, authUser.id).catch(e => expect(e).toHaveProperty("code", 403))
  })
  // put comment to /comment/{commentId} where either Id does not exist should return 404
  test('PUT comment to /comment/{commentId} where Id does not exist', () => {
    const unknownComment = { text:randomString(), id: uuidv4() }
    expect.assertions(1)
    return service.commentPUT(unknownComment, mockAdminUser.id).catch(e => expect(e).toHaveProperty("code", 404))
  })
  // put comment to /comment/{commentId} should return the edited comment with 202 Comment updated
  test('PUT comment to /comment/{commentId}', () => {
    const targetComment = getRandomElement(mockCommentTree.filter(c => c.hasOwnProperty("user"))) as Comment
    const updatedComment = { id: targetComment.id, text: randomString(userInputAlpha, 500) }
    const user = targetComment.user
    return service.commentPUT(updatedComment, user.id).then((res: Success<Comment>) => {
      expect(res).toHaveProperty("code", 204)
      expect(res).toHaveProperty("body")
      expect(res.body).toHaveProperty("text")
      expect(res.body.text).toBe(updatedComment.text)
    })
  })

  // Comment Delete
  // delete comment to /comment/{commentId} with no credentials should return 401
  test('DELETE comment to /comment/{commentId} with no credentials', () => {
    const targetComment = getRandomElement(mockCommentTree.filter(isComment))
    expect.assertions(1)
    return service.commentDELETE(targetComment.id).catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // delete comment to /comment/{commentId} with improper credentials should return 403
  test('DELETE comment to /comment/{commentId} with improper credentials', () => {
    const targetComment = getRandomElement(mockCommentTree.filter(isComment))
    // improper user is neither an admin nor the comment poster
    const improperUser = getRandomElement( mockGroupUsers.filter(u => !u.isAdmin && u.id !== targetComment.user.id) )
    expect.assertions(1)
    return service.commentDELETE(targetComment.id, improperUser.id).catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // delete comment to /comment/{commentId} where Id does not exist should return 404
  test('DELETE comment to /comment/{commentId} where Id does not exist', () => {
    const commentId = randomString()
    const adminUser = mockGroupUsers.find(u => u.isAdmin)
    expect.assertions(1)
    return service.commentDELETE(commentId, adminUser.id).catch(e => expect(e).toHaveProperty("code", 404))
  })
  // delete comment to /comment/{commentId} by an admin should delete the comment and return 202 Comment deleted
  test('DELETE comment to /comment/{commentId} should', () => {
    const targetComment = getRandomElement(mockCommentTree.filter(isComment))
    const adminUser = mockGroupUsers.find(u => u.isAdmin)
    return service.commentDELETE(targetComment.id, adminUser.id).then(value => expect(value).toEqual(expect.objectContaining(success202CommentDeleted)))
  })
  // delete comment to /comment/{commentId} by the user should delete the comment and return 202 Comment deleted
  test('DELETE comment to /comment/{commentId} should', () => {
    const targetComment = getRandomElement(mockCommentTree.filter(isComment).filter(c => !isDeletedComment(c)))
    return service.commentDELETE(targetComment.id, targetComment.user.id).then(value => expect(value).toBe(success202CommentDeleted))
  })

  // Topic Create
  // post to /topic with identical information should return 400 Discussion already exists
  test('POST to /topic with identical information', () => {
    expect.assertions(1)
    return service.topicPOST(mockNewTopic, mockAdminUser.id).catch(value => expect(value).toHaveProperty("code", 400))
  })
  // post to /topic with no credentials should return 401
  test('POST to /topic with no credentials and public-can-create-topic=false policy', () => {
    expect.assertions(1)
    return service.topicPOST(mockNewTopic).catch(value => expect(value).toHaveProperty("code", 403))
  })
  // post to /topic with improper credentials should return 403
  test('POST to /topic with improper credentials', () => {
    expect.assertions(1)
    return service.topicPOST(mockNewTopic, mockNewUser.id).catch(value => expect(value).toHaveProperty("code", 403))
  })
  // post to /topic should return Discussion object and 201 Discussion created
  test('POST to /topic', () => {
    return service.topicPOST(mockNewTopic, mockAdminUser.id).then(value => expect(value).toHaveProperty("code", 201))
  })

  // Topic Read
  // GET to /topic should return a list of topics and 200 OK
  test('GET to /topic', () => {
    return service.topicListGET().then((res: Success<Topic[]>) => expect(res.body).toContainEqual(mockTopics))
  })
  // GET to /topic/{topicId} should return a topic and descendent comments
  test('GET to /topic', () => {
    const targetTopicId = singleMockDiscussion[0].id
    return service.topicGET(targetTopicId).then(
      (res: Success<Discussion>) => {
        expect(res.body.id).toBe(targetTopicId)
        expect(res.body).toHaveProperty("replies")
        expect(res.body.replies.length).toBe(singleMockCommentTree.length)
        expect(res.body.replies).toContainEqual(singleMockCommentTree)
      }
    )
  })

  // Discussion Update
  // put topic  to /topic/{topicId} editing anything except title or isLocked should return 403 Forbidden
  test('PUT to /topic/{topicId}', () => {
    const topic = getRandomElement(mockTopics)
    const hackedTopics: Topic[] = [{ ...topic, id: randomString() }, { ...topic, dateCreated: new Date() }]
    const putTopic = getRandomElement(hackedTopics)
    expect.assertions(1)
    return service.topicPUT(putTopic, mockAdminUser.id).catch(e => expect(e).toBe(error403Forbidden)
    )
  })
  // put topic to /topic/{topicId} with no credentials should return 401
  test('PUT topic to /topic/{topicId} with no credentials', () => {
    const topic = getRandomElement(mockTopics)
    const putTopic = { ...topic, isLocked: !topic.isLocked, title: randomString(userInputAlpha, 500) }
    expect.assertions(1)
    return service.topicPUT(putTopic, mockAdminUser.id).catch(e => expect(e).toBe(error401UserNotAuthenticated)
    )
  })
  // put topic to /topic/{topicId} with improper credentials should return 403
  test('PUT to /topic/{topicId} with improper credentials', () => {
    const topic = getRandomElement(mockTopics)
    const putTopic = { ...topic, isLocked: !topic.isLocked, title: randomString(userInputAlpha, 500) }
    expect.assertions(1)
    return service.topicPUT(putTopic, mockNewUser.id).catch(e => expect(e).toBe(error403UserNotAuthorized)
    )
  })
  // put to /topic/{topicId} where Id does not exist should return 404 
  test('PUT topic to /topic/{topicId} where Id does not exist', () => {
    const topic = getRandomElement(mockTopics)
    const putTopic = { ...topic, id: randomString() }
    expect.assertions(1)
    return service.topicPUT(putTopic, mockAdminUser.id).catch(e => expect(e).toBe(error404TopicNotFound)
    )
  })
  // put topic with {topicId} to /topic/{topicId} should return topic and 204 Discussion updated
  test('PUT topic to /topic/{topicId}', () => {
    const topic = getRandomElement(mockTopics)
    const putTopic = { ...topic, title: randomString() }
    return service.topicPUT(putTopic, mockAdminUser.id).then((res: Success) => {
      expect(res).toHaveProperty("code", 204)
      expect(res).toHaveProperty("body", putTopic)
    })
  })

  // Discussion Delete
  // delete topic to /topic/{topicId} with no credentials should return 401
  test('DELETE topic to /topic/{topicId} with no credentials', () => {
    const topic = getRandomElement(mockTopics)
    return service.topicDELETE(topic.id).catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // delete topic to /topic/{topicId} with improper credentials should return 403
  test('DELETE to /topic/{topicId} with improper credentials', () => {
    const topic = getRandomElement(mockTopics)
    return service.topicDELETE(topic.id, mockNewUser.id).catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // delete to /topic/{topicId} where Id does not exist should return 404 
  test('DELETE topic to /topic/{topicId} where Id does not exist', () => {
    const deleteTopicId = uuidv4()
    return service.topicDELETE(deleteTopicId, mockAdminUser.id).catch(e => expect(e).toBe(error404TopicNotFound))
  })
  // delete to /topic/{topicId} should delete the topic and return 202 Discussion deleted
  test('DELETE topic to /topic/{topicId} should', () => {
    const topic = getRandomElement(mockTopics)
    return service.topicDELETE(topic.id, mockAdminUser.id).then((res: Success) => expect(res).toBe(success202TopicDeleted))
  })
  // delete to /topic/{topicId} should delete all descended comments
  test('DELETE topic to /topic/{topicId} should', () => {
    const topic = singleMockDiscussion[0]
    expect.assertions(1)
    return service.topicDELETE(topic.id, mockAdminUser.id).then(async () => {
      // none of these comments should be in the database
      const deletedComments = singleMockCommentTree
      const comments = db.collection<Comment | Discussion>('comments')
      deletedComments.forEach(c => {
        expect(comments).not.toContain(c)
      })
    })
  })
});

  //TODO: These require 'policy' to be implemented
  // get to /topic with improper credentials and users-can-view-topics=false should return 403 // test('GET to /topic with improper credentials and users-can-view-topics=false', () => { })
  // get to /topic with no credentials and public-can-view-topics=false policy should return 401 // test('GET to /topic with no credentials and public-can-view-topics=false', () => { })
  // get to /user with improper credentials and users-can-view-users false should return 403 // test('GET to /user with improper credentials and users-can-view-users false', () => { })
  // get to /user with no credentials and public-can-view-users set to false should return 401 // test('GET to /user with no credentials and public-can-view-users set to false', () => { })
  // get to /user/{userId} with no credentials and public-view-users=false should return 401 // test('GET to /user/{userId} with no credentials and public-view-users=false', () => { })
  // get to /user/{userId} without admin credentials and users-can-view-users=false should return 403 // test('GET to /user/{userId} without admin credentials and users-can-view-users=false', () => { })
  // post comment to /topic/{topicId} with improper credentials and public-can-post-comment false policy should return 401 // test('POST to /topic/{topicId} with improper credentials and public-can-post-comment false policy', () => { })
  // post to /topic too often should return 429 Too much topic (only makes sense if public-can-create-topic=true or users-can-create-topic=true) // test('POST to /topic too often', () => { })
  // post to /user too quickly should return 425 too early // test('POST to /user too quickly', () => { })
  // post to /user with improper credentials and admin-only-create-user policy should return 401 // test('POST to /user with improper credentials and admin-only-create-user policy', () => { })
  // post to comment /topic/{topicId} too often should return 429 Too many comments // test('POST to /topic/{topicId} too often', () => { })
  // post to /topic with no credentials and public-can-create-topic false policy should return 401
  // post to /topic with improper credentials and user-can-create-topic false policy should return 403
  // get comment to /comment/{commentId}/{commentId} with no credentials and public-view-comment false should return 401 // test('GET comment to /comment/{commentId} with no credentials and public-view-comment false', () => { })
  // get comment to /comment/{commentId} with improper credentials and public-view-comment false should return 403 // test('GET comment to /comment/{commentId} with improper credentials and public-view-comment false', () => { })