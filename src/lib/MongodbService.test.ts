import type { AuthToken, Comment, CommentId, Discussion, DiscussionId, Error, Success, User, UserId } from "./simple-comment";
import { MongodbService } from "./MongodbService";
import { Db, MongoClient } from "mongodb";
import { comment404, commentDeleted202, commentTooLong413, user401, user404, userDeleted202, userExists400, userNotAuthenticated401, userNotAuthorized403, userUpdated204 } from "./messages";
import { getAuthToken, hashPassword, uuidv4 } from "./crypt";
import { maxCommentLengthChars } from "../policy";

declare const global: any

const adminUser: Partial<User> = {
  id: "admin", 
  verified: true, 
  avatar: "some-url",
  email: "admin@simple-comment",
  isAdmin: true,
  name: "Simple Comment Admin",
}

const userInputAlpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÅ abcdefghijklmnopqrstuvwxyzäöå 1234567890 !@#$%^&*()_+-= "
const asciiAlpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-"

const randomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min)) + min
const randomString = (alpha: string = asciiAlpha, len: number = randomNumber(10, 50), str: string = ""): string => len === 0 ? str : randomString(alpha, len - 1, `${str}${alpha.charAt(Math.floor(Math.random() * alpha.length))}`)

type MockUser = Omit<User, "hash">

const mockUser = (): MockUser => ({
  id: randomString(),
  email: randomString(userInputAlpha),
  name: randomString(userInputAlpha),
  verified: Math.random() > 0.5,
  isAdmin: Math.random() > 0.5
})

const newUser: Partial<User> = { ...mockUser(), isAdmin: false }

const mockComment = (parentId: ( DiscussionId | CommentId ), user: Pick<User, "id" | "name" | "email">): Comment => ({
  id: uuidv4(),
  parentId,
  user,
  text: randomString(userInputAlpha, randomNumber(50, 500)),
  dateCreated: new Date()
})

const getRandomElement = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const getLastElement = <T>(arr: T[]) => arr[arr.length - 1]

// Returns a `population` number of mocked users
const getRandomGroupUsers = (population: number, users: MockUser[] = []): MockUser[] => population <= 0 ? users : getRandomGroupUsers(population - 1, [...users, mockUser()])

// Makes a mock thread of comments
const getRandomCommentTree = (replies: number, users: MockUser[], chain: (Comment | Discussion)[]): (Comment | Discussion)[] => replies <= 0 ? chain : getRandomCommentTree(replies - 1, users, [...chain, mockComment(getRandomElement(chain).id, getRandomElement(users))])

const newDiscussionId = randomString(asciiAlpha, randomNumber(10, 40))
const adminUserPassword = randomString(asciiAlpha, randomNumber(10, 40))
const mockGroupUsers = getRandomGroupUsers(100)

const getRandomDiscussions = (num: number = randomNumber(2, 20), discussions: Discussion[] = []): Discussion[] => num <= 0 ? discussions : getRandomDiscussions(num - 1, [...discussions, { id: randomString(asciiAlpha, randomNumber(10, 40)), isLocked: false }])
const mockDiscussions = getRandomDiscussions()
const mockCommentTree = getRandomCommentTree(5000, mockGroupUsers, mockDiscussions)

const singleMockDiscussion = getRandomDiscussions(1)
const singleMockCommentTree = getRandomCommentTree(300, mockGroupUsers, singleMockDiscussion)

let connection: MongoClient
let db: Db

describe('Full API service test', () => {
  let service: MongodbService;

  beforeAll(async () => {
    service = new MongodbService(global.__MONGO_URI__, global.__MONGO_DB_NAME__);
    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true, useUnifiedTopology: true
    });
    db = await connection.db(global.__MONGO_DB_NAME__);
    const users = db.collection('users');
    const hash = await hashPassword(adminUserPassword)
    users.insertMany([...mockGroupUsers, { ...adminUser, hash }])
    const comments = db.collection<Comment | Discussion>('comments')
    comments.insertMany([...mockCommentTree, ...singleMockCommentTree])
  });

  afterAll(async () => {
    await service.destroy()
    await connection.close()
  });

  // post to auth with unknown credentials should return error 404
  test('POST to auth with unknown user', () => {
    expect.assertions(1)
    return service.authPOST(randomString(), randomString(userInputAlpha)).catch(e => expect(e).toEqual(user404))
  });
  // post to auth with incorrect credentials should return error 401
  test('POST to auth with incorrect password', () => {
    expect.assertions(1)
    return service.authPOST(adminUser.id, randomString(userInputAlpha, 40)).catch(e => expect(e).toEqual(user401))
  });
  // post to auth with correct credentials should return authtoken
  test('POST to auth with correct credentials', () => {
    const authToken = getAuthToken(adminUser.id)
    // this will occassionally fail when the getAuthToken expiration is +- 1 second difference
    return service.authPOST(adminUser.id, adminUserPassword).then((value: AuthToken) => expect(value).toEqual(authToken))
  });

  // User Create
  // post to /user should return user and 201 User created
  test('POST to /user', () => {
    const newUserPassword = randomString(userInputAlpha, Math.floor(Math.random() * 30) + 10)
    return service.userPOST(newUser as User, newUserPassword).then(value => expect(value).toHaveProperty("code", 201))
  })
  // post to /user with existing username should return 400 user exists
  test('POST to /user with identical credentials', () => {
    const newUserPassword = randomString(userInputAlpha, Math.floor(Math.random() * 30) + 10)
    expect.assertions(1)
    return service.userPOST(newUser as User, newUserPassword).catch(value => expect(value).toBe(userExists400))
  })

  // User Read
  // get to /user/{userId} where userId does not exist should return 404
  test('GET to /user/{userId} where userId does not exist', () => {
    expect.assertions(1)
    return service.userGET(randomString(), adminUser.id).catch(e => expect(e).toEqual(user404))
  })
  // get to /user/{userId} should return User and 200
  test('GET to /user/{userId} should', () => {
    const targetUser = getRandomElement(mockGroupUsers)
    return service.userGET(targetUser.id, adminUser.id).then(res => expect(res).toBe(targetUser))
  })
  // get to /user should return list of users
  test('GET to /user', () => {
    return service.userGET().then(res => expect(res).toContainEqual(mockGroupUsers))
  })
  // get to /user/{userId} should return user
  test('GET to /user/{userId}', () => {
    const user = getRandomElement(mockGroupUsers)
    return service.userGET(user.id).then(res => expect(res).toBe(user))
  })

  // User Update
  // put to /user/{userId} with no credentials should return 401
  test('PUT to /user/{userId} with no credentials', () => {
    const targetUser = getRandomElement(mockGroupUsers)
    return service.userPUT(targetUser).then(res => expect(true).toBe(false)).catch(e => expect(e).toBe(userNotAuthenticated401))
  })
  // put to /user/{userId} with improper credentials should return 403
  test('PUT to /user/{userId} with improper credentials', () => {
    const nonAdminGroup = mockGroupUsers.filter(u => !u.isAdmin)
    const targetUser = getRandomElement(nonAdminGroup)
    const nonAdminAuthUser = nonAdminGroup.find(u => u.id !== targetUser.id) // get authUser that is not user
    return service.userPUT(targetUser, nonAdminAuthUser.id).then(res => expect(true).toBe(false)).catch(e => expect(e).toBe(userNotAuthorized403))
  })
  // put to /user/{userId} with own credentials should alter user return 204 User updated
  test('PUT to /user/{userId} with own credentials', () => {
    const targetUser = getRandomElement(mockGroupUsers)
    const updatedUser = { ...targetUser, name: randomString(userInputAlpha, 25) }
    //TODO: This should also test to ensure the change persists
    return service.userPUT(updatedUser, targetUser.id).then(res => expect(res).toBe(userUpdated204)).catch(e => expect(true).toBe(false))
  })
  // put to /user/{userId} with admin credentials should alter user return 204 User updated
  test('PUT to /user/{userId} with admin credentials', () => {
    const adminGroup = mockGroupUsers.filter(u => u.isAdmin)
    const targetUser = mockGroupUsers.find(u => u.id !== adminUser.id)
    const updatedUser = { ...targetUser, name: randomString(userInputAlpha, 25) }
    const adminAuthUser = adminGroup.find(u => u.id !== targetUser.id)
    return service.userPUT(updatedUser, adminAuthUser.id).then(res => expect(res).toBe(userUpdated204)).catch(e => expect(true).toBe(false))
  })
  // put to /user/{userId} where userId does not exist (and admin credentials) should return 404
  test('PUT to /user/{userId} where userId does not exist and admin credentials', () => {
    const adminGroup = mockGroupUsers.filter(u => u.isAdmin)
    const targetUser = mockUser()
    const adminAuthUser = adminGroup.find(u => u.id !== targetUser.id)
    return service.userPUT(targetUser, adminAuthUser.id).then(res => expect(res).toBe(userUpdated204)).catch(e => expect(true).toBe(false))
  })

  // User Delete
  // delete to /user/{userId} with no credentials should return 401
  test('DELETE to /user/{userId} with no credentials', () => {
    const user = getRandomElement(mockGroupUsers)
    expect.assertions(1)
    return service.userDELETE(user.id).catch(e => expect(e).toBe(userNotAuthenticated401))
  })
  // delete to /user/{userId} with improper credentials should return 403
  test('DELETE to /user/{userId} with improper credentials', () => {
    const nonAdminGroup = mockGroupUsers.filter(u => !u.isAdmin)
    const userToDelete = getRandomElement(nonAdminGroup)
    const nonAdminAuthUser = nonAdminGroup.find(u => u.id !== userToDelete.id) // get authUser that is not user
    expect.assertions(1)
    return service.userDELETE(userToDelete.id, nonAdminAuthUser.id).catch(e => expect(e).toBe(userNotAuthorized403))
  })
  // delete to /user/{userId} where userId does not exist and admin credentials should return 404
  test('DELETE to /user/{userId} where userId does not exist and admin credentials', () => {
    const nonExistentUser = mockUser()
    expect.assertions(1)
    return service.userDELETE(nonExistentUser.id, adminUser.id).catch(e => expect(e).toBe(user404))
  })
  // delete to /user/{userId} with hardcoded admin userId should return 403
  test('DELETE to /user/{userId} with hardcoded admin userId', () => {
    const adminGroup = mockGroupUsers.filter(u => u.isAdmin)
    const adminAuthUser = adminGroup.find(u => u.id !== adminUser.id)
    expect.assertions(1)
    return service.userDELETE(adminUser.id, adminAuthUser.id).catch(e => expect(e).toBe(userNotAuthorized403))
  })
  // delete to /user/{userId} should delete user and return 202 User deleted
  test('DELETE to /user/{userId} with userId', () => {
    const adminGroup = mockGroupUsers.filter(u => u.isAdmin)
    const userToDelete = mockGroupUsers.find(u => u.id !== adminUser.id)
    const adminAuthUser = adminGroup.find(u => u.id !== userToDelete.id)
    return service.userDELETE(adminUser.id, adminAuthUser.id).then(res => expect(res).toBe(userDeleted202)).catch(e => expect(true).toBe(false))
  })

  //NB: discussionId and commentId are identical in appearance, but are distinguished here for clarity
  // A discussion can by default only be created by an admin, and it functions as a kind of root comment
  // to which replies are made. Every comment has a parentId, that either points to a discussion or another comment

  // Comment Create 
  // post comment to comment to /discussion/{discussionId} with too long comment should return 413 Comment too long
  //TODO: set max comment length by policy
  test('POST comment to /discussion/{discussionId} with too long comment', () => {
    const parentComment = getRandomElement( mockCommentTree )
    const user = getRandomElement(mockGroupUsers)
    const comment: Pick<Comment, "text" | "user"> = {
      text:randomString(userInputAlpha, maxCommentLengthChars + 1),
      user
    }
    expect.assertions(1)
    return service.commentPOST(parentComment.id, comment, user.id).catch(e => expect(e).toBe(commentTooLong413))
   })
  // post comment to /discussion/{discussionId} should return comment and 201 Comment created
  // test('POST to /discussion/{discussionId}', () => { })
  // post comment to /discussion/{discussionId} with identical information within a short length of time should return 425 Possible duplicate comment
  // test('POST comment to /discussion/{discussionId} with identical information', () => { })

  // Comment Read
  // get comment to /discussion/{discussionId}/{commentId} with no credentials and public-view-discussion false should return 401
  // test('GET comment to /discussion/{discussionId}/{commentId} with no credentials and public-view-discussion false', () => { })
  // get comment to /discussion/{discussionId}/{commentId} with improper credentials and public-view-discussion false should return 403
  // test('GET comment to /discussion/{discussionId}/{commentId} with improper credentials and public-view-discussion false', () => { })
  // get comment to /discussion/{discussionId}/{commentId} where either Id does not exist should return 404 and indicate which does not exist
  // test('GET comment to /discussion/{discussionId}/{commentId} where either Id does not exist', () => { })
  // get comment to /discussion/{discussionId}/{commentId} should return the comment with 200 OK
  // test('GET comment to /discussion/{discussionId}/{commentId} should', () => { })

  // Comment Update
  // put comment to /discussion/{commentId} with no credentials should return 401
  // test('PUT comment to /discussion/{commentId} with no credentials', () => { })
  // put comment to /discussion/{commentId} with improper credentials should return 403
  // test('PUT comment to /discussion/{commentId} with improper credentials', () => { })
  // put comment to /discussion/{commentId} where either Id does not exist should return 404 and indicate which does not exist
  // test('PUT comment to /discussion/{commentId} where either Id does not exist', () => { })
  // put comment to /discussion/{commentId} should return the edited comment with 202 Comment updated
  // test('PUT comment to /discussion/{commentId} should', () => { })

  // Comment Delete
  // delete comment to /discussion/{commentId} with no credentials should return 401
  test('DELETE comment to /discussion/{commentId} with no credentials', () => {
    const targetComment = mockCommentTree.find(m => !m.hasOwnProperty("isLocked"))
    expect.assertions(1)
    return service.commentDELETE(targetComment.id).catch(e => expect(e).toBe(userNotAuthenticated401))
  })
  // delete comment to /discussion/{commentId} with improper credentials should return 403
  test('DELETE comment to /discussion/{commentId} with improper credentials', () => {
    const targetComment: Comment = mockCommentTree.find(m => !m.hasOwnProperty("isLocked")) as Comment
    // improper user is neither an admin nor the comment poster
    const improperUser = mockGroupUsers.find(u => !u.isAdmin && u.id !== targetComment.user.id)
    expect.assertions(1)
    return service.commentDELETE(targetComment.id, improperUser.id).catch(e => expect(e).toBe(userNotAuthenticated401))
  })
  // delete comment to /discussion/{commentId} where Id does not exist should return 404 and indicate which does not exist
  test('DELETE comment to /discussion/{commentId} where Id does not exist', () => {
    const commentId = randomString()
    const adminUser = mockGroupUsers.find(u => u.isAdmin)
    expect.assertions(1)
    return service.commentDELETE(commentId, adminUser.id).catch(e => expect(e).toBe(comment404))
  })
  // delete comment to /discussion/{commentId} by an admin should delete the comment and return 202 Comment deleted
  test('DELETE comment to /discussion/{commentId} should', () => {
    const targetComment: Comment = mockCommentTree.find(m => !m.hasOwnProperty("isLocked")) as Comment
    const adminUser = mockGroupUsers.find(u => u.isAdmin)
    expect.assertions(1)
    return service.commentDELETE(targetComment.id, adminUser.id).then(value => expect(value).toBe(commentDeleted202))
  })
  // delete comment to /discussion/{commentId} by the user should delete the comment and return 202 Comment deleted
  test('DELETE comment to /discussion/{commentId} should', () => {
    const targetComment: Comment = mockCommentTree.find(m => !m.hasOwnProperty("isLocked")) as Comment
    expect.assertions(1)
    return service.commentDELETE(targetComment.id, targetComment.user.id).then(value => expect(value).toBe(commentDeleted202))
  })

  // Discussion Create
  // post to /discussion with identical information should return 400 Discussion already exists
  test('POST to /discussion with identical information', () => {
    expect.assertions(1)
    return service.discussionPOST(newDiscussionId, adminUser.id).catch(value => expect(value).toHaveProperty("code", 400))
  })
  // post to /discussion with no credentials should return 401
  test('POST to /discussion with no credentials and public-can-create-discussion=false policy', () => {
    expect.assertions(1)
    return service.discussionPOST(newDiscussionId).catch(value => expect(value).toHaveProperty("code", 403))
  })
  // post to /discussion with improper credentials should return 403
  test('POST to /discussion with improper credentials', () => {
    expect.assertions(1)
    return service.discussionPOST(newDiscussionId, newUser.id).catch(value => expect(value).toHaveProperty("code", 403))
  })
  // post to /discussion should return Discussion object and 201 Discussion created
  test('POST to /discussion', () => {
    return service.discussionPOST(newDiscussionId, adminUser.id).then(value => expect(value).toHaveProperty("code", 201))
  })

  // Discussion Read
  // GET to /discussion should return a list of discussions and 200 OK
  test('GET to /discussion', () => {
    return service.discussionListGET().then((res: Discussion[]) => expect(res).toContainEqual(mockDiscussions))
  })
  // GET to /discussion/{discussionId} should return a discussion and descendent comments
  test('GET to /discussion', () => {
    const targetDiscussionId = singleMockDiscussion[0].id
    return service.discussionGET(targetDiscussionId).then(
      (res: Discussion) => {
        expect(res.id).toBe(targetDiscussionId)
        expect(res.comments).toContainEqual(singleMockCommentTree)
      }
    )
  })

  // Discussion Update
  // put discussion with *not* {discussionId} to /discussion/{discussionId} should return 400 Invalid endpoint to update discussion
  // test('PUT to /discussion/{discussionId}', () => { })
  // put discussion with {discussionId} to /discussion/{discussionId} should return discussion and 204 Discussion updated
  // test('PUT discussion to /discussion/{discussionId}', () => { })

  // Discussion Delete
  // delete discussion to /discussion/{discussionId} with no credentials should return 401
  // test('DELETE discussion to /discussion/{discussionId} with no credentials', () => { })
  // delete discussion to /discussion/{discussionId} with improper credentials should return 403
  // test('DELETE to /discussion/{discussionId} with improper credentials', () => { })
  // delete to /discussion/{discussionId} where Id does not exist should return 404 
  // test('DELETE discussion to /discussion/{discussionId} where Id does not exist', () => { })
  // delete to /discussion/{discussionId} should delete the discussion and return 202 Discussion deleted
  // test('DELETE discussion to /discussion/{discussionId} should', () => { })
  // delete to /discussion/{discussionId} should delete all descended comments
  // test('DELETE discussion to /discussion/{discussionId} should', () => { })
});

  //TODO: These require 'policy' to be implemented
  // get to /discussion with improper credentials and users-can-view-discussions=false should return 403 // test('GET to /discussion with improper credentials and users-can-view-discussions=false', () => { })
  // get to /discussion with no credentials and public-can-view-discussions=false policy should return 401 // test('GET to /discussion with no credentials and public-can-view-discussions=false', () => { })
  // get to /user with improper credentials and users-can-view-users false should return 403 // test('GET to /user with improper credentials and users-can-view-users false', () => { })
  // get to /user with no credentials and public-can-view-users set to false should return 401 // test('GET to /user with no credentials and public-can-view-users set to false', () => { })
  // get to /user/{userId} with no credentials and public-view-users=false should return 401 // test('GET to /user/{userId} with no credentials and public-view-users=false', () => { })
  // get to /user/{userId} without admin credentials and users-can-view-users=false should return 403 // test('GET to /user/{userId} without admin credentials and users-can-view-users=false', () => { })
  // post comment to /discussion/{discussionId} with improper credentials and public-can-post-comment false policy should return 401 // test('POST to /discussion/{discussionId} with improper credentials and public-can-post-comment false policy', () => { })
  // post to /discussion too often should return 429 Too much discussion (only makes sense if public-can-create-discussion=true or users-can-create-discussion=true) // test('POST to /discussion too often', () => { })
  // post to /user too quickly should return 425 too early // test('POST to /user too quickly', () => { })
  // post to /user with improper credentials and admin-only-create-user policy should return 401 // test('POST to /user with improper credentials and admin-only-create-user policy', () => { })
  // post to comment /discussion/{discussionId} too often should return 429 Too many comments // test('POST to /discussion/{discussionId} too often', () => { })
  // post to /discussion with no credentials and public-can-create-discussion false policy should return 401
  // post to /discussion with improper credentials and user-can-create-discussion false policy should return 403