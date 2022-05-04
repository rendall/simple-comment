import type {
  AdminSafeUser,
  AuthToken,
  Comment,
  CommentId,
  DeletedComment,
  Discussion,
  Email,
  Error,
  NewUser,
  PublicSafeUser,
  Success,
  Topic,
  UpdateUser,
  User
} from "../src/lib/simple-comment"
import { MongodbService } from "../src/lib/MongodbService"
import { Db, MongoClient } from "mongodb"
import {
  error401BadCredentials,
  error401UserNotAuthenticated,
  error403Forbidden,
  error403ForbiddenToModify,
  error403UserNotAuthorized,
  error404UserUnknown,
  error409DuplicateComment,
  error409UserExists,
  error413CommentTooLong,
  success202CommentDeleted,
  success202TopicDeleted,
  success202UserDeleted
} from "../src/lib/messages"
import { getAuthToken, hashPassword, uuidv4 } from "../src/lib/crypt"
import { policy } from "../src/policy"
import {
  isComment,
  isDeletedComment,
  isDiscussion,
  toAdminSafeUser
} from "../src/lib/utilities"
import * as fs from "fs"
import {
  alphaUserInput,
  chooseRandomElement,
  mockCommentTree,
  mockEmail,
  mockPassword,
  mockTopic,
  mockTopicsArray,
  mockUser,
  mockUsersArray,
  randomString
} from "./mockData"

const longFile = `${process.cwd()}/tests/veryLongRandomTestString`
const veryLongString = fs.readFileSync(longFile, "utf8")
const MONGO_URI = global.__MONGO_URI__
const MONGO_DB = global.__MONGO_DB_NAME__

// This is set to false in order to inspect data directly in the database
const doDropTestDatabase = true

declare const global: any

//@ts-expect-error
const adminUnsafeUserProperties: (keyof User)[] = ["hash", "_id", "password"]
const publicUnsafeUserProperties: (keyof User)[] = [
  ...adminUnsafeUserProperties,
  "email",
  "isVerified"
]

// Verification functions
const isPublicSafeUser = (u: Partial<User>): u is PublicSafeUser =>
  (Object.keys(u) as (keyof User)[]).every(
    key => !publicUnsafeUserProperties.includes(key)
  )

const isAdminSafeUser = (u: Partial<User>): u is AdminSafeUser =>
  (Object.keys(u) as (keyof User)[]).every(
    key => !adminUnsafeUserProperties.includes(key)
  )

// Fake data objects

const testUsers = mockUsersArray(100)

const testNewTopic = mockTopic("new-")
const testNewUser: NewUser = {
  ...mockUser("new-"),
  isAdmin: false,
  password: mockPassword(),
  email: mockEmail()
}

// This is a topic + comments that will be deleted
const testDeleteTopic: Topic = mockTopic("delete-")
const testDeleteTopicComments = mockCommentTree(20, testUsers, [
  testDeleteTopic
])

const testTopics: Topic[] = mockTopicsArray()
const testComments = mockCommentTree(500, testUsers, testTopics)

// This user tests that login happens
const authUserTest = {
  ...mockUser("auth-"),
  isAdmin: true,
  password: mockPassword(),
  email: mockEmail()
}

// Testing randomly from testGroupUsers causes test fails if the user has been
// deleted or otherwise altered. Using this function ensures that users are not
// used again
let usedUsersTest: User[] = []
/** Return user from the mock pool, filtered optionally by a predicate
 * and then add the user to used pool
 */
const getTargetUser = (p: (u: User) => boolean = (u: User) => true) => {
  const user = getAuthUser(p)
  usedUsersTest.push(user)
  return user
}
/** Return user from the unused pool, filtered optionally by a predicate */
const getAuthUser = (p: (u: User) => boolean = (u: User) => true) => {
  const user = chooseRandomElement(
    testUsers
      .filter(t => !usedUsersTest.map(u => u.id).includes(t.id))
      .filter(p)
  )
  return user
}

// This comment will be inserted
const newCommentTest: Pick<Comment, "text" | "userId" | "parentId"> = {
  text: randomString(alphaUserInput, policy.maxCommentLengthChars - 1),
  parentId: chooseRandomElement(testComments).id,
  userId: getAuthUser().id
}

describe("Full API service test", () => {
  let testAllUsers = []
  let service: MongodbService
  let client: MongoClient
  let db: Db

  beforeAll(async () => {
    const connectionString = MONGO_URI
    const databaseName = MONGO_DB

    service = new MongodbService(connectionString, databaseName)
    client = await service.getClient()
    db = await service.getDb()

    // authUserTest needs a real hash
    const hash = await hashPassword(authUserTest.password)

    testAllUsers = [...testUsers, { ...authUserTest, hash }]
    const users = db.collection("users")
    await users.insertMany(testAllUsers)
    const comments = db.collection<Comment | DeletedComment | Discussion>(
      "comments"
    )
    // This insert includes both topics and comments
    await comments.insertMany([...testComments, ...testDeleteTopicComments])
  }, 120000)

  afterAll(async () => {
    if (doDropTestDatabase) await db.dropDatabase()
    await service.close()
  }, 120000)

  // post to auth with unknown credentials should return error 404
  test("POST to auth with unknown user should 404", () => {
    expect.assertions(1)
    const unknownUserId = randomString()
    const unknownPassword = randomString(alphaUserInput)
    return service
      .authPOST(unknownUserId, unknownPassword)
      .catch(e => expect(e).toEqual(error404UserUnknown))
  })
  // post to auth with incorrect credentials should return error 401
  test("POST to auth with incorrect password should 401", () => {
    expect.assertions(1)
    const testAdmin = getAuthUser(u => u.isAdmin)
    const badPassword = mockPassword()
    return service
      .authPOST(testAdmin.id, badPassword)
      .catch(e => expect(e).toEqual(error401BadCredentials))
  })
  // post to auth with correct credentials should return authtoken
  test("POST to auth with correct credentials should return auth token", () => {
    const authToken = getAuthToken(authUserTest.id)
    // The difference in timing between the line above and the authToken returned from the service
    // can change the two. We will compare only the first 70 characters, just to be sure that it
    // is correct. It does not have to be exact for this purpose
    return service
      .authPOST(authUserTest.id, authUserTest.password)
      .then((value: Success<AuthToken>) =>
        expect(value.body.slice(0, 70)).toEqual(authToken.slice(0, 70))
      )
  })
  // hardcoded moderator should always be able to log in
  test("POST to auth with hardcoded credentials should return auth token", () => {
    const moderatorId = process.env.SIMPLE_COMMENT_MODERATOR_ID
    const moderatorPassword = process.env.SIMPLE_COMMENT_MODERATOR_PASSWORD
    return service
      .authPOST(moderatorId, moderatorPassword)
      .then((value: Success<AuthToken>) =>
        expect(value.statusCode).toEqual(200)
      )
  })
  // User Create
  // post to /user should return user and 201 User created
  test("POST to /user", () => {
    const adminUser = getAuthUser(u => u.isAdmin)
    return service.userPOST(testNewUser, adminUser.id).then(value => {
      expect(value).toHaveProperty("statusCode", 201)
      expect(value).toHaveProperty("body")
      expect(value.body).toHaveProperty("email", testNewUser.email)
    })
  })
  // POST to /user with id uuid with admin credentials should fail
  test("POST to /user with id uuid with admin credentials", () => {
    const guestUser = { ...testNewUser, id: uuidv4() }
    const authUser = getAuthUser(u => u.isAdmin)
    expect.assertions(1)
    return service
      .userPOST(guestUser, authUser.id)
      .catch(error => expect(error).toHaveProperty("statusCode", 403))
  })
  // POST to /user with id uuid with same credentials should succeed
  test("POST to /user with id uuid with same credentials", () => {
    const id = uuidv4()
    const guestUser = {
      id,
      name: randomString(alphaUserInput),
      password: mockPassword(),
      email: mockEmail()
    }
    return service
      .userPOST(guestUser, id)
      .then(value => expect(value).toHaveProperty("statusCode", 201))
  })
  // post to /user without credentials should return according to policy
  if (policy.canPublicCreateUser === true) {
    test("POST to /user without credentials should create user", () => {
      const newUser = {
        id: randomString(),
        name: randomString(alphaUserInput),
        password: mockPassword(),
        email: mockEmail()
      }
      return service
        .userPOST(newUser)
        .then(value => expect(value).toHaveProperty("statusCode", 201))
    })
    // post to /user changing admin-only properties without credentials should error 403
    test("POST to /user with admin-only properties without credentials should error 403", () => {
      const newUser = {
        ...mockUser(),
        password: mockPassword(),
        email: mockEmail(),
        isAdmin: true
      }
      expect.assertions(1)
      return service
        .userPOST(newUser)
        .catch(error => expect(error).toHaveProperty("statusCode", 403))
    })
    // post to /user changing admin-only properties without credentials should error 403
    test("POST to /user with admin-only properties without admin credentials should error 403", () => {
      const newUser = {
        ...mockUser(),
        password: mockPassword(),
        email: mockEmail(),
        isAdmin: true
      }
      const ordinaryUser = getAuthUser(u => !u.isAdmin)
      expect.assertions(1)
      return service
        .userPOST(newUser, ordinaryUser.id)
        .catch(error => expect(error).toHaveProperty("statusCode", 403))
    })
  } else {
    // policy is canPublicCreateUser = false
    test("POST to /user without admin credentials should fail", () => {
      const newUser = {
        ...mockUser(),
        password: mockPassword(),
        email: mockEmail(),
        isAdmin: false,
        isVerified: false
      }
      expect.assertions(1)
      return service
        .userPOST(newUser)
        .catch(value => expect(value).toHaveProperty("statusCode", 401))
    })
    test("POST to /user without admin credentials should fail", () => {
      const newUser = {
        ...mockUser(),
        password: mockPassword(),
        email: mockEmail(),
        isAdmin: false,
        isVerified: false
      }
      const ordinaryUser = getAuthUser(u => !u.isAdmin)
      expect.assertions(1)
      return service
        .userPOST(newUser, ordinaryUser.id)
        .catch(error => expect(error).toHaveProperty("statusCode", 403))
    })
  }
  test("POST to /user with a guestUserId as targetId should fail", () => {
    const newUser = {
      ...mockUser(),
      id: uuidv4(),
      password: mockPassword(),
      email: mockEmail(),
      isAdmin: false,
      isVerified: false
    }

    const adminUser = getAuthUser(u => u.isAdmin)
    expect.assertions(1)
    return service
      .userPOST(newUser, adminUser.id)
      .catch(value => expect(value).toHaveProperty("statusCode", 403))
  })
  // post to /user with existing username should return 409 user exists
  test("POST to /user with identical credentials", () => {
    const authUser = getAuthUser(u => u.isAdmin)
    expect.assertions(1)
    return service
      .userPOST(testNewUser, authUser.id)
      .catch(value => expect(value).toBe(error409UserExists))
  })
  // get to /auth with newly created user should return authtoken
  test("GET to /auth with newly created user", () => {
    const authToken = getAuthToken(testNewUser.id)
    return service
      .authPOST(testNewUser.id, testNewUser.password)
      .then((value: Success<AuthToken>) =>
        expect(value.body.slice(0, 70)).toEqual(authToken.slice(0, 70))
      )
  })

  // User Read
  // get to /user/{userId} where userId does not exist should return 404
  test("GET to /user/{userId} where userId does not exist", () => {
    const adminUserTest = getAuthUser(u => u.isAdmin)
    expect.assertions(1)
    return service
      .userGET(randomString(), adminUserTest.id)
      .catch(e => expect(e).toEqual(error404UserUnknown))
  })
  // get to /user/{userId} should return User and 200
  test("GET to /user/{userId} should", () => {
    const targetUser = getTargetUser()
    const authAdminUser = getAuthUser(u => u.isAdmin)
    return service
      .userGET(targetUser.id, authAdminUser.id)
      .then((res: Success<PublicSafeUser | AdminSafeUser> | Error) => {
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
    return service
      .userListGET()
      .then((res: Success<AdminSafeUser[] | PublicSafeUser[]> | Error) => {
        if (res instanceof Error) return // Type guard. This will never be an Error in practice, which would instead by passed to .catch

        const resBody = res.body as { id: string }[]

        expect(res.statusCode).toBe(200)
        expect(resBody.map(u => u.id)).toEqual(
          expect.arrayContaining(testAllUsers.map(u => u.id))
        )
        const checkProp = (prop: string) => resBody.some(u => u[prop])
        expect(checkProp("email")).toBe(false)
        expect(checkProp("hash")).toBe(false)
      })
  })
  // get to /user with admin credentials can return list of users with email
  test("GET /user admin", () => {
    const adminUserTest = getAuthUser(u => u.isAdmin)
    return service
      .userListGET(adminUserTest.id)
      .then((res: Success<AdminSafeUser[] | PublicSafeUser[]> | Error) => {
        if (res instanceof Error) return // type guard only, res will never be Error here
        const resbody = res.body as { id: string }[]
        expect(res.statusCode).toBe(200)
        expect(resbody.map(u => u.id)).toEqual(
          expect.arrayContaining(testAllUsers.map(u => u.id))
        )
        const checkProp = (prop: string) => resbody.some(u => u[prop])
        expect(checkProp("email")).toBe(true)
        expect(checkProp("hash")).toBe(false)
      })
  }) // get to /user/{userId} should return user
  test("GET to /user/{userId} with admin", () => {
    const user = getAuthUser()
    const adminUserTest = getAuthUser(u => u.isAdmin)
    return service
      .userGET(user.id, adminUserTest.id)
      .then((res: Success<PublicSafeUser | AdminSafeUser> | Error) => {
        expect(res).toHaveProperty("statusCode", 200)
        expect(res.body).toHaveProperty("id", user.id)
        expect(res.body).toHaveProperty("name", user.name)
        expect(res.body).not.toHaveProperty("hash")
        expect(res.body).toHaveProperty("email")
      })
  })

  test("GET to /user/{userId} with public user", () => {
    const user = getAuthUser()
    return service
      .userGET(user.id)
      .then((res: Success<PublicSafeUser | AdminSafeUser> | Error) => {
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
    return service
      .userPUT(targetUser.id, targetUser)
      .then(res => expect(true).toBe(false))
      .catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // put to /user/{userId} with improper credentials should return 403
  test("PUT to /user/{userId} with improper credentials", () => {
    const targetUser = getTargetUser()
    const ordinaryUser = getAuthUser(u => !u.isAdmin)
    return service
      .userPUT(targetUser.id, targetUser, ordinaryUser.id)
      .then(res => expect(true).toBe(false))
      .catch(e => expect(e.statusCode).toBe(403))
  })
  // put to /user/{userId} with public, own credentials cannot modify isAdmin
  test("PUT to /user/{userId} with public, own credentials cannot modify isAdmin", () => {
    const ordinaryUser = getTargetUser(u => !u.isAdmin)
    const updatedUser = { ...ordinaryUser, isAdmin: true }
    expect.assertions(1)
    return service
      .userPUT(updatedUser.id, updatedUser, ordinaryUser.id)
      .catch(error => expect(error).toBe(error403ForbiddenToModify))
  })
  // put to /user/{userId} with public, own credentials cannot modify isVerified
  test("PUT to /user/{userId} with public, own credentials cannot modify isVerified", () => {
    const ordinaryUser = getTargetUser(u => !u.isAdmin)
    const updatedUser = { ...ordinaryUser, isVerified: true }
    expect.assertions(1)
    return service
      .userPUT(updatedUser.id, updatedUser, ordinaryUser.id)
      .catch(error => expect(error).toBe(error403ForbiddenToModify))
  })
  // put to /user/{userId} with own credentials should alter user return 204 User updated
  test("PUT to /user/{userId} with own credentials", () => {
    const targetUser = getTargetUser()
    const updatedUser = {
      id: targetUser.id,
      name: randomString(alphaUserInput, 25)
    }
    return service
      .userPUT(updatedUser.id, updatedUser, targetUser.id)
      .then((res: Success<PublicSafeUser | AdminSafeUser> | Error) => {
        if (res instanceof Error) return // type guard only, res will never be Error here
        const resbody = res.body as { name: string }

        expect(res).toHaveProperty("statusCode", 204)
        expect(res).toHaveProperty("body")
        expect(resbody.name).toBe(updatedUser.name)
        expect(isAdminSafeUser(resbody)).toBe(true)
      })
  })
  // put to /user/{userId} with very long password should not timeout
  test("PUT to /user/{userId} with very long password should not timeout", () => {
    const targetUser = getTargetUser()
    const updatedUser = {
      id: targetUser.id,
      name: randomString(alphaUserInput, 25),
      password: veryLongString
    }
    return service
      .userPUT(updatedUser.id, updatedUser, targetUser.id)
      .then((res: Success<AdminSafeUser> | Error) => {
        if (res instanceof Error) return
        const resbody = res.body as Partial<User>
        expect(res).toHaveProperty("statusCode", 204)
        expect(res).toHaveProperty("body")
        expect(resbody.name).toBe(updatedUser.name)
        expect(isAdminSafeUser(resbody)).toBe(true)
      })
  })
  // put to /user/{userId} with invalid name, email, password should fail
  test("PUT to /user/{userId} with invalid name, email, password should fail", () => {
    const targetUser = getTargetUser(u => !u.isAdmin && !u.isVerified)
    const adminAuthUser = getAuthUser(u => u.isAdmin)
    const updatedUser: UpdateUser = {
      ...targetUser,
      name: " ",
      email: " ",
      password: " ",
      isAdmin: true,
      isVerified: true
    }
    expect.assertions(1)
    return service
      .userPUT(targetUser.id, updatedUser, adminAuthUser.id)
      .catch((err: Error) => {
        expect(err).toHaveProperty("statusCode", 400)
      })
  })
  // put to /user/{userId} with admin credentials should alter user return 204 User updated
  test("PUT to /user/{userId} with admin credentials", () => {
    const targetUser = getTargetUser(u => !u.isAdmin && !u.isVerified)
    const adminAuthUser = getAuthUser(u => u.isAdmin)
    const updatedUser: User = {
      ...targetUser,
      name: randomString(alphaUserInput, 25),
      isAdmin: true,
      isVerified: true
    }
    return service
      .userPUT(updatedUser.id, updatedUser, adminAuthUser.id)
      .then((res: Success<AdminSafeUser> | Error) => {
        expect(res).toHaveProperty("statusCode", 204)
        expect(res).toHaveProperty("body", toAdminSafeUser(updatedUser))
        expect(res.body).toHaveProperty("isAdmin", true)
        expect(res.body).toHaveProperty("isVerified", true)
      })
  })
  // put to /user/{userId} with userId as uuid should succeed
  test("PUT to /user/{userId} with userId as uuid should succeed", async () => {
    const id = uuidv4()
    const guestUser = {
      id,
      name: randomString(alphaUserInput),
      password: mockPassword(),
      email: mockEmail()
    }
    const adminAuthUser = getAuthUser(u => u.isAdmin)
    const updatedGuestUser: User = {
      ...guestUser,
      name: randomString(alphaUserInput, 25)
    }

    await service.userPOST(guestUser, id)

    expect.assertions(3)
    return service
      .userPUT(updatedGuestUser.id, updatedGuestUser, adminAuthUser.id)
      .then((res: Success<AdminSafeUser> | Error) => {
        const resbody = res.body as { name: string }
        expect(res).toHaveProperty("statusCode", 204)
        expect(res).toHaveProperty("body", toAdminSafeUser(updatedGuestUser))
        expect(resbody.name).toBe(updatedGuestUser.name)
      })
  })

  test("PUT to /user/{userId} with guestUser  changing isAdmin should fail", async () => {
    const id = uuidv4()
    const guestUser = {
      id,
      name: randomString(alphaUserInput),
      password: mockPassword(),
      email: mockEmail()
    }
    const adminAuthUser = getAuthUser(u => u.isAdmin)
    const updatedGuestUser: User = {
      ...guestUser,
      name: randomString(alphaUserInput, 25),
      isAdmin: true
    }
    expect.assertions(1)

    await service.userPOST(guestUser, id)
    return service
      .userPUT(updatedGuestUser.id, updatedGuestUser, adminAuthUser.id)
      .catch(error => {
        expect(error).toHaveProperty("statusCode", 403)
      })
  })

  // put to /user/{userId} where userId does not exist (and admin credentials) should return 404
  test("PUT to /user/{userId} where userId does not exist and admin credentials", () => {
    const targetUser = mockUser()
    const adminAuthUser = getAuthUser(u => u.isAdmin)
    expect.assertions(1)
    return service
      .userPUT(targetUser.id, targetUser, adminAuthUser.id)
      .catch(error => expect(error).toBe(error404UserUnknown))
  })

  // User Delete
  // delete to /user/{userId} with no credentials should return 401
  test("DELETE to /user/{userId} with no credentials", () => {
    const user = getTargetUser()
    expect.assertions(1)
    return service
      .userDELETE(user.id)
      .catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // delete to /user/{userId} with improper credentials should return 403
  test("DELETE to /user/{userId} with improper credentials", () => {
    const userToDelete = getTargetUser()
    const improperAuthUser = getAuthUser(
      u => !u.isAdmin && u.id !== userToDelete.id
    )
    expect.assertions(1)
    return service
      .userDELETE(userToDelete.id, improperAuthUser.id)
      .catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // delete to /user/{userId} where userId does not exist and admin credentials should return 404
  test("DELETE to /user/{userId} where userId does not exist and admin credentials", () => {
    const nonExistentUser = mockUser()
    const adminAuthUser = getAuthUser(u => u.isAdmin)
    expect.assertions(1)
    return service
      .userDELETE(nonExistentUser.id, adminAuthUser.id)
      .catch(e => expect(e).toBe(error404UserUnknown))
  })
  // delete to /user/{userId} with hardcoded admin userId should return 403
  test("DELETE to /user/{userId} targeting hardcoded admin userId", () => {
    const adminAuthUser = getAuthUser(u => u.isAdmin)
    const simpleCommentModeratorId = process.env.SIMPLE_COMMENT_MODERATOR_ID
    expect.assertions(1)
    return service
      .userDELETE(simpleCommentModeratorId, adminAuthUser.id)
      .catch(e => expect(e).toBe(error403Forbidden))
  })
  // delete to /user/{userId} should delete user and return 202 User deleted
  test("DELETE to /user/{userId} by admin", () => {
    const userToDelete = getTargetUser()
    const adminAuthUser = getAuthUser(u => u.isAdmin)
    expect.assertions(2)
    return service
      .userDELETE(userToDelete.id, adminAuthUser.id)
      .then(async res => {
        expect(res).toBe(success202UserDeleted)
        const user = await db
          .collection("users")
          .findOne({ id: userToDelete.id })
        expect(user).toBeNull()
      })
  })
  test("DELETE to /user/{userId} by self", () => {
    const userToDelete = getTargetUser()
    expect.assertions(2)
    return service
      .userDELETE(userToDelete.id, userToDelete.id)
      .then(async res => {
        expect(res).toBe(success202UserDeleted)
        const user = await db
          .collection("users")
          .findOne({ id: userToDelete.id })
        expect(user).toBeNull()
      })
  })
  // Comment Create
  // post comment to comment to /discussion/{discussionId} with too long comment should return 413 Comment too long
  test("POST comment to /comment/{commentId} with too long comment", async () => {
    const parentComment = chooseRandomElement(testComments)
    const user = getAuthUser()

    try {
      await service.commentPOST(parentComment.id, veryLongString, user.id)
    } catch (error) {
      expect(error).toBe(error413CommentTooLong)
    }
  })
  // post comment to /comment/{commentId} should return comment and 201 Comment created
  test("POST to /comment/{commentId}", async () => {
    const postResponse = await service.commentPOST(
      newCommentTest.parentId,
      newCommentTest.text,
      newCommentTest.userId
    )

    const resbody = postResponse.body as Comment
    expect(postResponse).toHaveProperty("statusCode", 201)
    expect(postResponse).toHaveProperty("body")
    expect(resbody).toHaveProperty("text", newCommentTest.text)
    expect(resbody).toHaveProperty("user")
    expect(resbody.user.id).toBe(newCommentTest.userId)
  })
  // post comment to /comment/{commentId} without credentials should fail
  test("POST to /comment/{commentId} without credentials", () => {
    const parentComment = chooseRandomElement(testComments)
    const text = randomString(alphaUserInput, 400)
    expect.assertions(1)
    return service.commentPOST(parentComment.id, text).catch(e => {
      expect(e).toBe(error401UserNotAuthenticated)
    })
  })

  // post comment to /comment/{commentId} with identical information within a short length of time should return 425 Possible duplicate comment
  test("POST comment to /comment/{commentId} with identical information", () => {
    expect.assertions(1)
    return service
      .commentPOST(
        newCommentTest.parentId,
        newCommentTest.text,
        newCommentTest.userId
      )
      .catch(e => expect(e).toBe(error409DuplicateComment))
  })

  // Comment Read
  // get comment to /comment/{commentId} where commentId does not exist should return 404
  test("GET comment to /comment/{commentId} where comment does not exist", async () => {
    const parentCommentId = uuidv4()
    const user = getAuthUser()
    expect.assertions(1)

    try {
      await service.commentGET(parentCommentId, user.id)
    } catch (error) {
      expect(error).toHaveProperty("statusCode", 404)
    }
  })
  // get comment to /comment/{commentId} should return the comment with 200 OK
  test("GET comment to /comment/{commentId}", () => {
    const commentsWithChildren = testComments
      .filter(isComment)
      .reduce(
        (withChildren: Comment[], comment: Comment, i, arr) =>
          arr.some(c => c.parentId === comment.id)
            ? [...withChildren, comment]
            : withChildren,
        []
      )
    const randomComment = chooseRandomElement(commentsWithChildren)
    const targetComment = { ...randomComment, userId: randomComment.userId }
    const getChildren = (
      commentId: CommentId,
      allComments: (Discussion | Comment)[]
    ) =>
      allComments
        .filter(c => isComment(c))
        .filter((c: Comment | Discussion) =>
          isDiscussion(c) ? false : c.parentId === commentId
        )
    const targetChildren = getChildren(
      targetComment.id,
      testComments
    ) as Comment[]

    return service
      .commentGET(targetComment.id)
      .then((res: Success<Comment>) => {
        const allUsers = (comments: Comment[]) => comments.map(c => c.user)
        expect(res).toHaveProperty("statusCode", 200)
        expect(res).toHaveProperty("body")
        expect(res.body).toHaveProperty("id", targetComment.id)
        expect(res.body).toHaveProperty("text", targetComment.text)
        expect(isPublicSafeUser(res.body.user)).toBe(true)
        expect(res.body).toHaveProperty("replies")
        expect(res.body.replies.length).toBeGreaterThan(0)
        expect(
          getChildren(res.body.id, res.body.replies).map(r =>
            r.id.toLowerCase()
          )
        ).toEqual(
          expect.arrayContaining(targetChildren.map(t => t.id.toLowerCase()))
        )
        expect(res.body).toHaveProperty("user")
        expect(allUsers(res.body.replies).every(u => isPublicSafeUser(u))).toBe(
          true
        )
      })
  })

  // Comment Update
  // put comment to /comment/{commentId} with no credentials should return 401
  test("PUT comment to /comment/{commentId} with no credentials", () => {
    const randomComment = chooseRandomElement(testComments.filter(isComment))
    const updateText = randomString(alphaUserInput)
    expect.assertions(1)
    return service
      .commentPUT(randomComment.id, updateText)
      .catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // put comment to /comment/{commentId} with improper credentials should return 403
  test("PUT comment to /comment/{commentId} with improper credentials", () => {
    const randomComment = chooseRandomElement(
      testComments.filter(c => !c.hasOwnProperty("isLocked"))
    ) as Comment
    const updateText = randomString(alphaUserInput)
    const improperAuthUser = getAuthUser(
      u => !u.isAdmin && u.id !== randomComment.userId
    )
    expect.assertions(1)
    return service
      .commentPUT(randomComment.id, updateText, improperAuthUser.id)
      .catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // put comment to /comment/{commentId} where Id does not exist should return 404
  test("PUT comment to /comment/{commentId} where Id does not exist", () => {
    const unknownComment = { text: randomString(), id: uuidv4() }
    const adminUserTest = authUserTest
    expect.assertions(1)
    return service
      .commentPUT(unknownComment.id, unknownComment.text, adminUserTest.id)
      .catch(e => expect(e).toHaveProperty("statusCode", 404))
  })
  // put comment to /comment/{commentId} should return the edited comment with 202 Comment updated
  test("PUT comment to /comment/{commentId}", () => {
    const targetComment = chooseRandomElement(
      testComments.filter(isComment)
    ) as Comment
    const updatedComment = {
      id: targetComment.id,
      text: randomString(alphaUserInput, 500)
    }
    const userId = targetComment.userId
    return service
      .commentPUT(updatedComment.id, updatedComment.text, userId)
      .then((res: Success<Comment> | Error) => {
        const resbody = res.body as { text: string }
        expect(res).toHaveProperty("statusCode", 204)
        expect(res).toHaveProperty("body")
        expect(res.body).toHaveProperty("text")
        expect(resbody.text).toBe(updatedComment.text)
      })
  })

  // Comment Delete
  // delete comment to /comment/{commentId} with no credentials should return 401
  test("DELETE comment to /comment/{commentId} with no credentials", () => {
    const targetComment = chooseRandomElement(testComments.filter(isComment))
    expect.assertions(1)
    return service
      .commentDELETE(targetComment.id)
      .catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // delete comment to /comment/{commentId} with improper credentials should return 403
  test("DELETE comment to /comment/{commentId} with improper credentials", () => {
    const targetComment = chooseRandomElement(testComments.filter(isComment))
    // improper user is neither an admin nor the comment poster
    const improperUser = getAuthUser(
      u => !u.isAdmin && u.id !== targetComment.userId
    )
    expect.assertions(1)
    return service
      .commentDELETE(targetComment.id, improperUser.id)
      .catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // delete comment to /comment/{commentId} where Id does not exist should return 404
  test("DELETE comment to /comment/{commentId} where Id does not exist", () => {
    const commentId = randomString()
    const adminUser = getAuthUser(u => u.isAdmin)
    expect.assertions(1)
    return service
      .commentDELETE(commentId, adminUser.id)
      .catch(e => expect(e).toHaveProperty("statusCode", 404))
  })
  // delete comment to /comment/{commentId} by an admin should delete the comment and return 202 Comment deleted
  test("DELETE comment to /comment/{commentId} by admin", () => {
    const targetComment = chooseRandomElement(testComments.filter(isComment))
    const adminUser = getAuthUser(u => u.isAdmin)
    return service
      .commentDELETE(targetComment.id, adminUser.id)
      .then(value =>
        expect(value).toEqual(expect.objectContaining(success202CommentDeleted))
      )
  })
  // delete comment to /comment/{commentId} by the user should delete the comment and return 202 Comment deleted
  test("DELETE comment to /comment/{commentId} by self user", () => {
    const selfUser = getAuthUser(u => !u.isAdmin)
    const targetComment = chooseRandomElement(
      testComments
        .filter(isComment)
        .filter(c => !isDeletedComment(c))
        .filter(c => c.userId === selfUser.id)
    )
    return service
      .commentDELETE(targetComment.id, targetComment.userId)
      .then(value => expect(value).toHaveProperty("statusCode", 202))
  })

  // Topic Create
  // post to /topic with no credentials should return 401
  if (!policy.canFirstVisitCreateTopic)
    test("POST to /topic with no credentials and policy.canPublicCreateTopic===false", () => {
      expect.assertions(2)
      const newTopic = mockTopic()
      return service.topicPOST(newTopic).catch(async value => {
        const deletedTopic = await db
          .collection<Comment | Discussion>("comments")
          .findOne({ id: newTopic.id })
        expect(deletedTopic).toBeNull()
        expect(value).toHaveProperty("statusCode", 401)
      })
    })
  // post to /topic with improper credentials should return 403
  test("POST to /topic with improper credentials", () => {
    const newTopic = mockTopic()
    const ordinaryUser = getAuthUser(u => !u.isAdmin)
    expect.assertions(2)
    return service.topicPOST(newTopic, ordinaryUser.id).catch(async value => {
      const deletedTopic = await db
        .collection<Comment | Discussion>("comments")
        .findOne({ id: newTopic.id })
      expect(deletedTopic).toBeNull()
      expect(value).toHaveProperty("statusCode", 403)
    })
  })
  // post to /topic should return Discussion object and 201 Discussion created
  test("POST to /topic", () => {
    const adminUserTest = getAuthUser(u => u.isAdmin)
    return service
      .topicPOST(testNewTopic, adminUserTest.id)
      .then(async value => {
        const insertedTopic: Discussion = await db
          .collection<Discussion>("comments")
          .findOne({ id: testNewTopic.id })
        expect(insertedTopic.id).toBe(testNewTopic.id)
        expect(insertedTopic.title).toBe(testNewTopic.title)
        expect(insertedTopic.isLocked).toBe(testNewTopic.isLocked)
        expect(value).toHaveProperty("statusCode", 201)
      })
  })

  // Topic Read
  // GET to /topic should return a list of topics and 200 OK
  test("GET to /topic", () => {
    return service.topicListGET().then((res: Success<Topic[]> | Error) => {
      const resbody = res.body as Topic[]
      expect(resbody.map(i => i.id)).toEqual(
        [...testTopics, testDeleteTopic, testNewTopic].map(i => i.id)
      )
    })
  })
  // GET to /topic/{topicId} should return a topic and descendent comments
  test("GET to /topic/{topicId}", () => {
    const targetTopicId = chooseRandomElement(testTopics).id
    return service
      .topicGET(targetTopicId)
      .then((res: Success<Discussion> | Error) => {
        const resbody = res.body as { id: string }
        expect(resbody.id).toBe(targetTopicId)
        expect(res.body).toHaveProperty("replies")
      })
  })

  // Discussion Update
  // put topic  to /topic/{topicId} editing anything except title or isLocked should be ignored
  test("PUT to /topic/{topicId}", () => {
    const topic = chooseRandomElement(testTopics)
    const putTopic = {
      ...topic,
      dateCreated: new Date(),
      title: randomString()
    }
    const adminUserTest = getAuthUser(u => u.isAdmin)
    return service
      .topicPUT(putTopic.id, putTopic, adminUserTest.id)
      .then((res: Success<Topic> | Error) => {
        const resbody = res.body as Topic
        expect(res).toHaveProperty("statusCode", 204)
        expect(resbody.dateCreated.toDateString()).toBe(
          topic.dateCreated.toDateString()
        )
      })
  })
  // put topic to /topic/{topicId} with no credentials should return 401
  test("PUT topic to /topic/{topicId} with no credentials", () => {
    const topic = chooseRandomElement(testTopics)
    const putTopic = {
      ...topic,
      isLocked: !topic.isLocked,
      title: randomString(alphaUserInput, 500)
    }
    expect.assertions(1)
    return service
      .topicPUT(putTopic.id, putTopic)
      .catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // put topic to /topic/{topicId} with improper credentials should return 403
  test("PUT to /topic/{topicId} with improper credentials", () => {
    const topic = chooseRandomElement(testTopics)
    const putTopic = {
      ...topic,
      isLocked: !topic.isLocked,
      title: randomString(alphaUserInput, 500)
    }
    expect.assertions(1)
    return service
      .topicPUT(putTopic.id, putTopic, testNewUser.id)
      .catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // put to /topic/{topicId} where Id does not exist should return 404
  test("PUT topic to /topic/{topicId} where Id does not exist", () => {
    const topic = chooseRandomElement(testTopics)
    const putTopic = { ...topic, id: randomString() }
    const adminUserTest = getAuthUser(u => u.isAdmin)
    expect.assertions(1)
    return service
      .topicPUT(putTopic.id, putTopic, adminUserTest.id)
      .catch(e => expect(e).toHaveProperty("statusCode", 404))
  })
  // put topic with {topicId} to /topic/{topicId} should return topic and 204 Discussion updated
  test("PUT topic to /topic/{topicId}", () => {
    const topic = chooseRandomElement(testTopics)
    const putTopic = { ...topic, title: randomString() }
    const adminUserTest = getAuthUser(u => u.isAdmin)
    return service
      .topicPUT(putTopic.id, putTopic, adminUserTest.id)
      .then((res: Success<Topic> | Error) => {
        expect(res).toHaveProperty("statusCode", 204)
        expect(res).toHaveProperty("body", putTopic)
      })
  })

  // Discussion Delete
  // delete topic to /topic/{topicId} with no credentials should return 401
  test("DELETE topic to /topic/{topicId} with no credentials", () => {
    const topic = chooseRandomElement(testTopics)
    return service
      .topicDELETE(topic.id)
      .catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  // delete topic to /topic/{topicId} with improper credentials should return 403
  test("DELETE to /topic/{topicId} with improper credentials", () => {
    const topic = chooseRandomElement(testTopics)
    return service
      .topicDELETE(topic.id, testNewUser.id)
      .catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  // delete to /topic/{topicId} where Id does not exist should return 404
  test("DELETE topic to /topic/{topicId} where Id does not exist", () => {
    const deleteTopicId = uuidv4()
    const adminUserTest = getAuthUser(u => u.isAdmin)
    return service
      .topicDELETE(deleteTopicId, adminUserTest.id)
      .catch(e => expect(e).toHaveProperty("statusCode", 404))
  })
  // delete to /topic/{topicId} should delete the topic and return 202 Discussion deleted
  test("DELETE topic to /topic/{topicId} should delete the topic", () => {
    const adminUserTest = getAuthUser(u => u.isAdmin)
    return service
      .topicDELETE(testDeleteTopic.id, adminUserTest.id)
      .then((res: Success) => expect(res).toBe(success202TopicDeleted))
  })
  // delete to /topic/{topicId} should delete all descended comments
  test("DELETE topic to /topic/{topicId} should delete descended comments", async () => {
    // none of these replies should be in the database
    const replies = testDeleteTopicComments
    const comments = await db
      .collection<Comment | Discussion>("comments")
      .find({})
      .toArray()

    replies.forEach(c => {
      expect(comments).not.toContain(c)
    })
  })
})

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
