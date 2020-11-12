import { AuthToken, Comment, CommentId, Discussion, TopicId, Success, Topic, User, AdminSafeUser, PublicSafeUser, Email, DeletedComment } from "./simple-comment";
import { MongodbService } from "./MongodbService";
import { Db, MongoClient } from "mongodb";
import { success202CommentDeleted, error425DuplicateComment, error413CommentTooLong, error403Forbidden, error401BadCredentials, error404UserUnknown, success202UserDeleted, error400UserExists, error401UserNotAuthenticated, error403UserNotAuthorized, success202TopicDeleted, error403ForbiddenToModify } from "./messages";
import { getAuthToken, hashPassword, uuidv4 } from "./crypt";
import { policy } from "../policy";
import { adminUnsafeUserProperties, isComment, isDeletedComment, publicUnsafeUserProperties, toAdminSafeUser, toPublicSafeUser } from "./utilities";
import * as dotenv from "dotenv"
dotenv.config()
// const MONGO_URI = process.env.DB_CONNECTION_STRING
// const MONGO_DB = process.env.DATABASE_NAME
const MONGO_URI = global.__MONGO_URI__
const MONGO_DB = global.__MONGO_DB_NAME__

declare const global: any

const userInputAlpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÅ abcdefghijklmnopqrstuvwxyzäöå 1234567890 !@#$%^&*()_+-= "
const asciiAlpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-"
const randomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min)) + min
const randomString = (alpha: string = asciiAlpha, len: number = randomNumber(10, 50), str: string = ""): string => len === 0 ? str : randomString(alpha, len - 1, `${str}${alpha.charAt(Math.floor(Math.random() * alpha.length))}`)
const randomDate = () => new Date(randomNumber(0, new Date().valueOf()))
// Returns a random email that will validate but does not create examples of all possible valid emails 
const randomEmail = (): Email => `${randomString(asciiAlpha)}@${randomString(asciiAlpha)}.${randomString(asciiAlpha)}`
// Functions that generate fake data - these could be moved to a common file to help other Service tests
const getRandomComment = (parentId: (TopicId | CommentId), user: User): Comment => ({ id: uuidv4(), parentId, userId: user.id, text: randomString(userInputAlpha, randomNumber(50, 500)), dateCreated: new Date() })
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
const testAdminUser: Omit<User, "hash"> = { id: "admin", isVerified: true, email: randomEmail(), isAdmin: true, name: "Simple Comment Admin", }
const testAdminUserPassword = randomString(asciiAlpha, randomNumber(10, 40))
const testGroupUsers = getRandomGroupUsers(100)
let testUsedUsers: User[] = []
let testNewComment: Pick<Comment, "text" | "userId" | "parentId">
const testNewTopic = getRandomTopic()
const testNewUser = { ...getRandomUser(), isAdmin: false }
const testTopics: Topic[] = getRandomListOfTopics()
let testDeleteTopic: Topic
const testCommentTree = getRandomCommentTree(500, testGroupUsers, testTopics)

// Testing randomly from testGroupUsers causes test fails if the user has been
// deleted or otherwise altered. Using this function ensures that users are not
// used again
const getTargetUser = (p: (u: User) => boolean = (u: User) => true) => {
  const user = getRandomElement(testGroupUsers.filter(t => !testUsedUsers.map(u => u.id).includes(t.id)).filter(p))
  testUsedUsers.push(user)
  return user
}
// This will not remove user from the pool
const getAuthUser = (p: (u: User) => boolean = (u: User) => true) => {
  const user = getRandomElement(testGroupUsers.filter(t => !testUsedUsers.map(u => u.id).includes(t.id)).filter(p))
  return user
}

let testAllUsers = []
let service: MongodbService;
let client: MongoClient
let db: Db

describe('Full API service test', () => {

  beforeAll(async () => {
    const connectionString = MONGO_URI
    const databaseName = MONGO_DB
    service = new MongodbService(connectionString, databaseName);
    client = await service.getClient()
    db = await service.getDb()
    const hash = await hashPassword(testAdminUserPassword)
    testAllUsers = [...testGroupUsers, { ...testAdminUser, hash }]
    const users = db.collection("users");
    users.insertMany(testAllUsers)
    const comments = db.collection<Comment | DeletedComment | Discussion>("comments")
    await comments.insertMany(testCommentTree)
  }, 120000);

  afterAll(async () => {
    // await db.dropDatabase()
    await service.close()
  }, 120000);

  // post to auth with unknown credentials should return error 404
  test("POST to auth with unknown user", () => {
    expect.assertions(1)
    return service.authPOST(randomString(), randomString(userInputAlpha)).catch(e => expect(e).toEqual(error404UserUnknown))
  });
  // post to auth with incorrect credentials should return error 401
  test("POST to auth with incorrect password", () => {
    expect.assertions(1)
    return service.authPOST(testAdminUser.id, randomString(userInputAlpha, 40)).catch(e => expect(e).toEqual(error401BadCredentials))
  });
  // post to auth with correct credentials should return authtoken
  test("POST to auth with correct credentials", () => {
    const authToken = getAuthToken(testAdminUser.id)
    // The difference in timing between the line above and the authToken returned from the service
    // can change the two. We will compare only the first 70 characters, just to be sure that it
    // is correct. It does not have to be exact for this purpose
    return service.authPOST(testAdminUser.id, testAdminUserPassword)
      .then((value: AuthToken) => expect(value.slice(0, 70)).toEqual(authToken.slice(0, 70)))
  });

  // User Create
  // post to /user should return user and 201 User created
  test("POST to /user", () => {
    const newUserPassword = randomString(userInputAlpha, Math.floor(Math.random() * 30) + 10)
    return service.userPOST(testNewUser as User, newUserPassword).then(value => expect(value).toHaveProperty("statusCode", 201))
  })
  // post to /user with existing username should return 400 user exists
  test("POST to /user with identical credentials", () => {
    const newUserPassword = randomString(userInputAlpha, Math.floor(Math.random() * 30) + 10)
    expect.assertions(1)
    return service.userPOST(testNewUser as User, newUserPassword).catch(value => expect(value).toBe(error400UserExists))
  })

  // User Read
  // get to /user/{userId} where userId does not exist should return 404
  test("GET to /user/{userId} where userId does not exist", () => {
    expect.assertions(1)
    return service.userGET(randomString(), testAdminUser.id).catch(e => expect(e).toEqual(error404UserUnknown))
  })
  // get to /user/{userId} should return User and 200
  test("GET to /user/{userId} should", () => {
    const targetUser = getTargetUser()
    const authAdminUser = getAuthUser(u => u.isAdmin)
    return service.userGET(targetUser.id, authAdminUser.id).then((res: Success<User>) => {
      expect(res).toHaveProperty("statusCode", 200)
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
      expect(res.statusCode).toBe(200)
      expect(res.body.map(u => u.id)).toEqual(expect.arrayContaining(testAllUsers.map(u => u.id)))
      const checkProp = (prop: string) => res.body.some(u => u[prop])
      expect(checkProp("email")).toBe(false)
      expect(checkProp("hash")).toBe(false)
    })
  })
  // get to /user with admin credentials can return list of users with email
  test("GET /user admin", () => {
    return service.userListGET(testAdminUser.id).then((res: Success<User[]>) => {
      expect(res.statusCode).toBe(200)
      expect(res.body.map(u => u.id)).toEqual(expect.arrayContaining(testAllUsers.map(u => u.id)))
      const checkProp = (prop: string) => res.body.some(u => u[prop])
      expect(checkProp("email")).toBe(true)
      expect(checkProp("hash")).toBe(false)
    })
  })// get to /user/{userId} should return user
  test("GET to /user/{userId} with admin", () => {
    const user = getAuthUser()
    return service.userGET(user.id, testAdminUser.id).then((res: Success<User>) => {
      expect(res).toHaveProperty("statusCode", 200)
      expect(res.body).toHaveProperty("id", user.id)
      expect(res.body).toHaveProperty("name", user.name)
      expect(res.body).not.toHaveProperty("hash")
      expect(res.body).toHaveProperty("email")
    })
  })

  test("GET to /user/{userId} with public user", () => {
    const user = getAuthUser()
    return service.userGET(user.id).then((res: Success<User>) => {
      expect(res).toHaveProperty("statusCode", 200)
      expect(res.body).toHaveProperty("id", user.id)
      expect(res.body).toHaveProperty("name", user.name)
      expect(res.body).not.toHaveProperty("hash")
      expect(res.body).not.toHaveProperty("email")
    })
  })
  // User Update
  // put to /user/{userId} with no credentials should return 401
  test("PUT to /user/{userId} with no credentials", () => {
    const targetUser = getTargetUser()
    return service.userPUT(targetUser).then(res => expect(true).toBe(false)).catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // put to /user/{userId} with improper credentials should return 403
  test("PUT to /user/{userId} with improper credentials", () => {
    const targetUser = getTargetUser()
    const ordinaryUser = getAuthUser(u => !u.isAdmin)
    return service.userPUT(targetUser, ordinaryUser.id).then(res => expect(true).toBe(false)).catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // put to /user/{userId} with public, own credentials cannot modify isAdmin
  test("PUT to /user/{userId} with public, own credentials cannot modify isAdmin", () => {
    const ordinaryUser = getTargetUser(u => !u.isAdmin)
    const updatedUser = { ...ordinaryUser, isAdmin: true }
    expect.assertions(1)
    return service.userPUT(updatedUser, ordinaryUser.id).catch(error => expect(error).toBe(error403ForbiddenToModify))
  })
  // put to /user/{userId} with public, own credentials cannot modify isVerified
  test("PUT to /user/{userId} with public, own credentials cannot modify isVerified", () => {
    const ordinaryUser = getTargetUser(u => !u.isAdmin)
    const updatedUser = { ...ordinaryUser, isVerified: true }
    expect.assertions(1)
    return service.userPUT(updatedUser, ordinaryUser.id).catch(error => expect(error).toBe(error403ForbiddenToModify))
  })
  // put to /user/{userId} with own credentials should alter user return 204 User updated
  test("PUT to /user/{userId} with own credentials", () => {
    const targetUser = getTargetUser()
    const updatedUser = { id: targetUser.id, name: randomString(userInputAlpha, 25) }
    return service.userPUT(updatedUser, targetUser.id).then((res: Success<AdminSafeUser>) => {
      expect(res).toHaveProperty("statusCode", 204)
      expect(res).toHaveProperty("body")
      expect(res.body.name).toBe(updatedUser.name)
      expect(isAdminSafeUser(res.body)).toBe(true)
    })
  })
  // put to /user/{userId} with admin credentials should alter user return 204 User updated
  test("PUT to /user/{userId} with admin credentials", () => {
    const targetUser = getTargetUser(u => !u.isAdmin && !u.isVerified)
    const adminAuthUser = getAuthUser(u => u.isAdmin)
    const updatedUser: User = { ...targetUser, name: randomString(userInputAlpha, 25), isAdmin: true, isVerified: true }
    return service.userPUT(updatedUser, adminAuthUser.id).then((res: Success<AdminSafeUser>) => {
      expect(res).toHaveProperty("statusCode", 204)
      expect(res).toHaveProperty("body", toAdminSafeUser(updatedUser))
      expect(res.body).toHaveProperty("isAdmin", true)
      expect(res.body).toHaveProperty("isVerified", true)
    })
  })
  // put to /user/{userId} where userId does not exist (and admin credentials) should return 404
  test("PUT to /user/{userId} where userId does not exist and admin credentials", () => {
    const targetUser = getRandomUser()
    const adminAuthUser = getAuthUser(u => u.isAdmin)
    expect.assertions(1)
    return service.userPUT(targetUser, adminAuthUser.id).catch(error => expect(error).toBe(error404UserUnknown))
  })

  // User Delete
  // delete to /user/{userId} with no credentials should return 401
  test("DELETE to /user/{userId} with no credentials", () => {
    const user = getTargetUser()
    expect.assertions(1)
    return service.userDELETE(user.id).catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // delete to /user/{userId} with improper credentials should return 403
  test("DELETE to /user/{userId} with improper credentials", () => {
    const userToDelete = getTargetUser()
    const improperAuthUser = getAuthUser(u => !u.isAdmin && u.id !== userToDelete.id)
    expect.assertions(1)
    return service.userDELETE(userToDelete.id, improperAuthUser.id).catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // delete to /user/{userId} where userId does not exist and admin credentials should return 404
  test("DELETE to /user/{userId} where userId does not exist and admin credentials", () => {
    const nonExistentUser = getRandomUser()
    const adminAuthUser = getAuthUser(u => u.isAdmin)
    expect.assertions(1)
    return service.userDELETE(nonExistentUser.id, adminAuthUser.id).catch(e => expect(e).toBe(error404UserUnknown))
  })
  // delete to /user/{userId} with hardcoded admin userId should return 403
  test("DELETE to /user/{userId} targeting hardcoded admin userId", () => {
    const adminAuthUser = getAuthUser(u => u.isAdmin)
    expect.assertions(1)
    return service.userDELETE(testAdminUser.id, adminAuthUser.id).catch(e => expect(e).toBe(error403Forbidden))
  })
  // delete to /user/{userId} should delete user and return 202 User deleted
  test("DELETE to /user/{userId} by admin", () => {
    const userToDelete = getTargetUser()
    const adminAuthUser = getAuthUser(u => u.isAdmin)
    expect.assertions(2)
    return service.userDELETE(userToDelete.id, adminAuthUser.id).then(async (res) => {
      expect(res).toBe(success202UserDeleted)
      const user = await db.collection("users").findOne({ id: userToDelete.id })
      expect(user).toBeNull()
    })
  })
  test('DELETE to /user/{userId} by self', () => {
    const userToDelete = getTargetUser()
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
    const parentComment = getRandomElement(testCommentTree)
    const user = getAuthUser()
    const comment: Pick<Comment, "text" | "userId"> = {
      text: randomString(userInputAlpha, policy.maxCommentLengthChars + 1),
      userId: user.id
    }
    expect.assertions(1)
    return service.commentPOST(parentComment.id, comment, user.id).catch(e => expect(e).toBe(error413CommentTooLong))
  })
  // post comment to /comment/{commentId} should return comment and 201 Comment created
  test('POST to /comment/{commentId}', () => {
    const parentComment = getRandomElement(testCommentTree)
    const user = getAuthUser()
    testNewComment = {
      text: randomString(userInputAlpha, policy.maxCommentLengthChars - 1),
      parentId: parentComment.id,
      userId: user.id
    }
    return service.commentPOST(parentComment.id, testNewComment, user.id).then((res: Success<Comment>) => {
      expect(res).toHaveProperty("statusCode", 201)
      expect(res).toHaveProperty("body")
      expect(res.body).toHaveProperty("text", testNewComment.text)
      expect(res.body).toHaveProperty("user")
    })
  })
  // post comment to /comment/{commentId} with identical information within a short length of time should return 425 Possible duplicate comment
  test('POST comment to /comment/{commentId} with identical information', () => {
    const parentCommentId = testNewComment.parentId
    const userId = testNewComment.userId
    expect.assertions(1)
    return service.commentPOST(parentCommentId, testNewComment, userId).catch(e => expect(e).toBe(error425DuplicateComment))
  })

  // Comment Read
  // get comment to /comment/{commentId} where commentId does not exist should return 404
  test('GET comment to /comment/{commentId} where comment does not exist', () => {
    const parentCommentId = uuidv4()
    const user = getAuthUser()
    expect.assertions(1)
    return service.commentGET(parentCommentId, user.id).catch(e => expect(e).toHaveProperty("statusCode", 404))
  })
  // get comment to /comment/{commentId} should return the comment with 200 OK
  test('GET comment to /comment/{commentId}', () => {
    const commentsWithChildren = testCommentTree.filter(isComment).reduce((withChildren: Comment[], comment: Comment, i, arr) => arr.some(c => c.parentId === comment.id) ? [...withChildren, comment] : withChildren, [])
    const randomComment = getRandomElement(commentsWithChildren)
    const targetComment = { ...randomComment, userId: randomComment.userId }
    const getChildren = (commentId: CommentId, allComments: (Discussion | Comment)[]) => allComments.filter(c => isComment(c)).filter((c: Comment) => c.parentId === commentId)
    const targetChildren = getChildren(targetComment.id, testCommentTree)

    return service.commentGET(targetComment.id).then((res: Success<Comment>) => {
      const allUsers = (comments: Comment[]) => comments.map(c => c.user)
      expect(res).toHaveProperty("statusCode", 200)
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
    const randomComment = getRandomElement(testCommentTree.filter(isComment))
    const comment = { id: randomComment.id, text: randomString() }
    expect.assertions(1)
    return service.commentPUT(comment).catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // put comment to /comment/{commentId} with improper credentials should return 403
  test('PUT comment to /comment/{commentId} with improper credentials', () => {
    const randomComment = getRandomElement(testCommentTree.filter(c => !c.hasOwnProperty("isLocked"))) as Comment
    const comment = { id: randomComment.id, text: randomString() }
    const improperAuthUser = getAuthUser(u => !u.isAdmin && u.id !== randomComment.userId)
    expect.assertions(1)
    return service.commentPUT(comment, improperAuthUser.id).catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // put comment to /comment/{commentId} altering anything other than 'text' should ignore updates 
  test('PUT hacked comment to /comment/{commentId}', () => {
    const randomComment = getRandomElement(testCommentTree.filter(c => !c.hasOwnProperty("isLocked"))) as Comment
    const comment = { id: randomComment.id, text: randomString() }
    const authUserId = randomComment.userId
    const targetUser = getTargetUser(u => u.id !== authUserId)
    const hackedComments: Partial<Comment>[] = [{ ...comment, user: targetUser }, { ...comment, dateCreated: new Date() }, { ...comment, parentId: uuidv4() }]
    const hack = getRandomElement(hackedComments)
    expect.assertions(1)
    return service.commentPUT(hack as { id: CommentId, text: string }, authUserId).catch(e => expect(e).toHaveProperty("statusCode", 403))
  })
  // put comment to /comment/{commentId} where either Id does not exist should return 404
  test('PUT comment to /comment/{commentId} where Id does not exist', () => {
    const unknownComment = { text: randomString(), id: uuidv4() }
    expect.assertions(1)
    return service.commentPUT(unknownComment, testAdminUser.id).catch(e => expect(e).toHaveProperty("statusCode", 404))
  })
  // put comment to /comment/{commentId} should return the edited comment with 202 Comment updated
  test('PUT comment to /comment/{commentId}', () => {
    const targetComment = getRandomElement(testCommentTree.filter(isComment)) as Comment
    const updatedComment = { id: targetComment.id, text: randomString(userInputAlpha, 500) }
    const userId = targetComment.userId
    return service.commentPUT(updatedComment, userId).then((res: Success<Comment>) => {
      expect(res).toHaveProperty("statusCode", 204)
      expect(res).toHaveProperty("body")
      expect(res.body).toHaveProperty("text")
      expect(res.body.text).toBe(updatedComment.text)
    })
  })

  // Comment Delete
  // delete comment to /comment/{commentId} with no credentials should return 401
  test('DELETE comment to /comment/{commentId} with no credentials', () => {
    const targetComment = getRandomElement(testCommentTree.filter(isComment))
    expect.assertions(1)
    return service.commentDELETE(targetComment.id).catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // delete comment to /comment/{commentId} with improper credentials should return 403
  test('DELETE comment to /comment/{commentId} with improper credentials', () => {
    const targetComment = getRandomElement(testCommentTree.filter(isComment))
    // improper user is neither an admin nor the comment poster
    const improperUser = getAuthUser(u => !u.isAdmin && u.id !== targetComment.userId)
    expect.assertions(1)
    return service.commentDELETE(targetComment.id, improperUser.id).catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // delete comment to /comment/{commentId} where Id does not exist should return 404
  test('DELETE comment to /comment/{commentId} where Id does not exist', () => {
    const commentId = randomString()
    const adminUser = getAuthUser(u => u.isAdmin)
    expect.assertions(1)
    return service.commentDELETE(commentId, adminUser.id).catch(e => expect(e).toHaveProperty("statusCode", 404))
  })
  // delete comment to /comment/{commentId} by an admin should delete the comment and return 202 Comment deleted
  test('DELETE comment to /comment/{commentId} by admin', () => {
    const targetComment = getRandomElement(testCommentTree.filter(isComment))
    const adminUser = getAuthUser(u => u.isAdmin)
    return service.commentDELETE(targetComment.id, adminUser.id).then(value => expect(value).toEqual(expect.objectContaining(success202CommentDeleted)))
  })
  // delete comment to /comment/{commentId} by the user should delete the comment and return 202 Comment deleted
  test('DELETE comment to /comment/{commentId} by self user', () => {
    const targetComment = getRandomElement(testCommentTree.filter(isComment).filter(c => !isDeletedComment(c)))
    return service.commentDELETE(targetComment.id, targetComment.userId).then(value => expect(value).toHaveProperty("statusCode", 202))
  })

  // Topic Create
  // post to /topic with no credentials should return 401
  test('POST to /topic with no credentials and public-can-create-topic=false policy', () => {
    expect.assertions(1)
    return service.topicPOST(testNewTopic).catch(value => expect(value).toHaveProperty("statusCode", 401))
  })
  // post to /topic with improper credentials should return 403
  test('POST to /topic with improper credentials', () => {
    expect.assertions(1)
    return service.topicPOST(testNewTopic, testNewUser.id).catch(value => expect(value).toHaveProperty("statusCode", 403))
  })
  // post to /topic should return Discussion object and 201 Discussion created
  test('POST to /topic', () => {
    return service.topicPOST(testNewTopic, testAdminUser.id).then(value => expect(value).toHaveProperty("statusCode", 201))
  })

  // Topic Read
  // GET to /topic should return a list of topics and 200 OK
  test('GET to /topic', () => {
    return service.topicListGET().then((res: Success<Topic[]>) => {
      expect(res.body.map(i => i.id)).toEqual([...testTopics, testNewTopic].map(i => i.id))
    })
  })
  // GET to /topic/{topicId} should return a topic and descendent comments
  test('GET to /topic/{topicId}', () => {
    const targetTopicId = getRandomElement(testTopics).id
    return service.topicGET(targetTopicId).then(
      (res: Success<Discussion>) => {
        expect(res.body.id).toBe(targetTopicId)
        expect(res.body).toHaveProperty("replies")
      }
    )
  })

  // Discussion Update
  // put topic  to /topic/{topicId} editing anything except title or isLocked should be ignored 
  test('PUT to /topic/{topicId}', () => {
    const topic = getRandomElement(testTopics)
    const putTopic = { ...topic, dateCreated: new Date(), title: randomString() }
    return service.topicPUT(putTopic, testAdminUser.id).then((res: Success<Topic>) => {
      expect(res).toHaveProperty("statusCode", 204)
      expect(res.body.dateCreated.toDateString()).toBe(topic.dateCreated.toDateString())
    })
  })
  // put topic to /topic/{topicId} with no credentials should return 401
  test('PUT topic to /topic/{topicId} with no credentials', () => {
    const topic = getRandomElement(testTopics)
    const putTopic = { ...topic, isLocked: !topic.isLocked, title: randomString(userInputAlpha, 500) }
    expect.assertions(1)
    return service.topicPUT(putTopic).catch(e => expect(e).toBe(error401UserNotAuthenticated)
    )
  })
  // put topic to /topic/{topicId} with improper credentials should return 403
  test('PUT to /topic/{topicId} with improper credentials', () => {
    const topic = getRandomElement(testTopics)
    const putTopic = { ...topic, isLocked: !topic.isLocked, title: randomString(userInputAlpha, 500) }
    expect.assertions(1)
    return service.topicPUT(putTopic, testNewUser.id).catch(e => expect(e).toBe(error403UserNotAuthorized)
    )
  })
  // put to /topic/{topicId} where Id does not exist should return 404 
  test('PUT topic to /topic/{topicId} where Id does not exist', () => {
    const topic = getRandomElement(testTopics)
    const putTopic = { ...topic, id: randomString() }
    expect.assertions(1)
    return service.topicPUT(putTopic, testAdminUser.id).catch(e => expect(e).toHaveProperty("statusCode", 404)
    )
  })
  // put topic with {topicId} to /topic/{topicId} should return topic and 204 Discussion updated
  test('PUT topic to /topic/{topicId}', () => {
    const topic = getRandomElement(testTopics)
    const putTopic = { ...topic, title: randomString() }
    return service.topicPUT(putTopic, testAdminUser.id).then((res: Success) => {
      expect(res).toHaveProperty("statusCode", 204)
      expect(res).toHaveProperty("body", putTopic)
    })
  })

  // Discussion Delete
  // delete topic to /topic/{topicId} with no credentials should return 401
  test('DELETE topic to /topic/{topicId} with no credentials', () => {
    const topic = getRandomElement(testTopics)
    return service.topicDELETE(topic.id).catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // delete topic to /topic/{topicId} with improper credentials should return 403
  test('DELETE to /topic/{topicId} with improper credentials', () => {
    const topic = getRandomElement(testTopics)
    return service.topicDELETE(topic.id, testNewUser.id).catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // delete to /topic/{topicId} where Id does not exist should return 404 
  test('DELETE topic to /topic/{topicId} where Id does not exist', () => {
    const deleteTopicId = uuidv4()
    return service.topicDELETE(deleteTopicId, testAdminUser.id).catch(e => expect(e).toHaveProperty("statusCode", 404))
  })
  // delete to /topic/{topicId} should delete the topic and return 202 Discussion deleted
  test('DELETE topic to /topic/{topicId} should delete the topic', () => {
    testDeleteTopic = getRandomElement(testTopics)
    return service.topicDELETE(testDeleteTopic.id, testAdminUser.id).then((res: Success) => expect(res).toBe(success202TopicDeleted))
  })
  // delete to /topic/{topicId} should delete all descended comments
  test('DELETE topic to /topic/{topicId} should delete descended comments', () => {
    const topic = getRandomElement(testTopics.filter(t => t.id !== testDeleteTopic.id))
    const getChildren = (commentId: CommentId, allComments: (Discussion | Comment)[]) => allComments.filter(c => isComment(c)).filter((c: Comment) => c.parentId === commentId)
    return service.topicDELETE(topic.id, testAdminUser.id).then(async (res: Success) => {
      // none of these replies should be in the database
      const replyIds = getChildren(topic.id, testTopics).map(c => c.id)
      const comments = await db.collection<Comment | Discussion>('comments').find({}).toArray()
      const commentIds = comments.map(c => c.id)

      replyIds.forEach(c => {
        expect(commentIds).not.toContain(c)
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