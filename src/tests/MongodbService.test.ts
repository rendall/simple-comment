/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
  AdminSafeUser,
  AuthToken,
  Comment,
  CommentId,
  CreateUserPayload,
  DeletedComment,
  Discussion,
  Error,
  PublicSafeUser,
  Success,
  Topic,
  UpdateUser,
  User
} from "../../src/lib/simple-comment"
import { MongodbService } from "../../src/lib/MongodbService"
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
} from "../../src/lib/messages"
import { getAuthToken, hashPassword, uuidv4 } from "../../src/lib/crypt"
import policy from "../policy.json"
import {
  isComment,
  isDeletedComment,
  isDiscussion,
  toAdminSafeUser
} from "../../src/lib/utilities"
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
  mockUserId,
  mockUsersArray,
  randomString
} from "./mockData"

declare const global: { __MONGO_URI__: string; __MONGO_DB_NAME__: string }
const MONGO_URI = global.__MONGO_URI__
const MONGO_DB = global.__MONGO_DB_NAME__

const longFile = `${process.cwd()}/src/tests/veryLongRandomTestString`
const veryLongString = fs.readFileSync(longFile, "utf8")

const adminUnsafeUserProperties: (keyof User | "password")[] = [
  "hash",
  "_id",
  "password"
]
const publicUnsafeUserProperties: (keyof User | "password")[] = [
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
const testNewUser: CreateUserPayload = {
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
const usedUsersTest: User[] = []
/** Return user from the mock pool, filtered optionally by a predicate
 * and then add the user to used pool
 */
const getTargetUser = (p: (u: User) => boolean = () => true) => {
  const user = getAuthUser(p)
  usedUsersTest.push(user)
  return user
}
/** Return user from the unused pool, filtered optionally by a predicate */
const getAuthUser = (p: (u: User) => boolean = (_u: User) => true) => {
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
  let testAllUsers: User[] = []
  let service: MongodbService
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _client: MongoClient
  let db: Db

  beforeAll(async () => {
    const connectionString = MONGO_URI
    const databaseName = MONGO_DB

    service = new MongodbService(connectionString, databaseName)
    _client = await service.getClient()
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
    await db.dropDatabase()
    await service.close()
  }, 120000)

  test("POST to auth with unknown credentials should return error 404", () => {
    expect.assertions(1)
    const unknownUserId = randomString()
    const unknownPassword = randomString(alphaUserInput)
    return service
      .authPOST(unknownUserId, unknownPassword)
      .catch(e => expect(e).toEqual(error404UserUnknown))
  })
  test("POST to auth with incorrect password should 401", () => {
    expect.assertions(1)
    const testAdmin = getAuthUser(u => u.isAdmin!)
    const badPassword = mockPassword()
    return service
      .authPOST(testAdmin.id, badPassword)
      .catch(e => expect(e).toEqual(error401BadCredentials))
  })
  test("POST to auth with user id and correct password should return auth token", () => {
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
  test("POST to auth with email and correct password should return auth token", () => {
    const authToken = getAuthToken(authUserTest.id)
    return service
      .authPOST(authUserTest.email, authUserTest.password)
      .then((value: Success<AuthToken>) =>
        expect(value.body.slice(0, 70)).toEqual(authToken.slice(0, 70))
      )
  })
  // hardcoded moderator should always be able to log in
  test("POST to auth with hardcoded credentials should return auth token", () => {
    const moderatorId = process.env.SIMPLE_COMMENT_MODERATOR_ID
    if (!moderatorId) throw "SIMPLE_COMMENT_MODERATOR_ID is not defined"
    const moderatorPassword = process.env.SIMPLE_COMMENT_MODERATOR_PASSWORD
    if (!moderatorPassword)
      throw "SIMPLE_COMMENT_MODERATOR_PASSWORD is not defined"
    return service
      .authPOST(moderatorId, moderatorPassword)
      .then((value: Success<AuthToken>) =>
        expect(value.statusCode).toEqual(200)
      )
  })
  // User Create
  test("POST to /user with id should return user with same id and 201 User created", () => {
    const adminUser = getAuthUser(u => u.isAdmin!)
    return service.userPOST(testNewUser, adminUser.id).then(value => {
      expect(value).toHaveProperty("statusCode", 201)
      expect(value).toHaveProperty("body")
      expect(value.body).toHaveProperty("email", testNewUser.email)
      expect(value.body).toHaveProperty("id", testNewUser.id)
    })
  })

  test("POST to /user without id should return user with generated id and 201 User created", () => {
    const adminUser = getAuthUser(u => u.isAdmin!)
    const testUserWithoutId = { ...testNewUser }
    delete testUserWithoutId.id
    return service.userPOST(testUserWithoutId, adminUser.id).then(value => {
      expect(value).toHaveProperty("statusCode", 201)
      expect(value).toHaveProperty("body")
      expect(value.body).toHaveProperty("email", testNewUser.email)
      expect(value.body).toHaveProperty("id")
    })
  })

  test("POST to /user with id uuid with admin credentials should fail", async () => {
    const guestUser = { ...testNewUser, id: uuidv4() }
    const authUser = getAuthUser(u => u.isAdmin!)
    expect.assertions(1)
    const e = await service.userPOST(guestUser, authUser.id)
    expect(e).toHaveProperty("statusCode", 403)
  })
  test("POST to /user with id uuid with same credentials should succeed", () => {
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
  if (policy.canPublicCreateUser === true) {
    test("POST to /user without credentials should create user", async () => {
      const id = mockUserId()
      const name = randomString(alphaUserInput)
      const email = mockEmail()
      const newUser = {
        id,
        name,
        email,
        password: mockPassword()
      }
      expect.assertions(1)
      const response = await service.userPOST(newUser)
      expect(response).toEqual({ body: { email, id, name }, statusCode: 201 })
    })
    test("POST to /user with admin-only properties without credentials should error 403", async () => {
      const newUser = {
        ...mockUser(),
        password: mockPassword(),
        email: mockEmail(),
        isAdmin: true
      }
      expect.assertions(1)
      const e = await service.userPOST(newUser)
      expect(e).toHaveProperty("statusCode", 403)
    })
    test("POST to /user with admin-only properties without admin credentials should error 403", async () => {
      const newUser = {
        ...mockUser(),
        password: mockPassword(),
        email: mockEmail(),
        isAdmin: true
      }
      const ordinaryUser = getAuthUser(u => !u.isAdmin)
      expect.assertions(1)
      const e = await service.userPOST(newUser, ordinaryUser.id)
      expect(e).toHaveProperty("statusCode", 403)
    })
  } else {
    // policy is canPublicCreateUser = false
    test("POST to /user without admin credentials should fail", async () => {
      const newUser = {
        ...mockUser(),
        password: mockPassword(),
        email: mockEmail(),
        isAdmin: false,
        isVerified: false
      }
      expect.assertions(1)
      const e = await service.userPOST(newUser)
      expect(e).toHaveProperty("statusCode", 401)
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
  test("POST to /user with a guestUserId as targetId should fail", async () => {
    const newUser = {
      ...mockUser(),
      id: uuidv4(),
      password: mockPassword(),
      email: mockEmail(),
      isAdmin: false,
      isVerified: false
    }

    const adminUser = getAuthUser(u => u.isAdmin!)
    expect.assertions(1)
    const e = await service.userPOST(newUser, adminUser.id)
    expect(e).toHaveProperty("statusCode", 403)
  })
  test("POST to /user with existing username should return 409 user exists", async () => {
    const authUser = getAuthUser(u => u.isAdmin!)
    expect.assertions(1)
    const e = await service.userPOST(testNewUser, authUser.id)
    expect(e).toBe(error409UserExists)
  })
  test("GET to /auth with newly created user should return authtoken", () => {
    const authToken = getAuthToken(testNewUser.id!)
    return service
      .authPOST(testNewUser.id!, testNewUser.password)
      .then((value: Success<AuthToken>) =>
        expect(value.body.slice(0, 70)).toEqual(authToken.slice(0, 70))
      )
  })

  // User Read
  test("GET to /user/{userId} where userId does not exist should return 404", () => {
    const adminUserTest = getAuthUser(u => u.isAdmin!)
    expect.assertions(1)
    return service
      .userGET(randomString(), adminUserTest.id)
      .then(e =>
        expect(e).toEqual({
          ...error404UserUnknown,
          body: "Authenticating user is unknown"
        })
      )
  })
  test("GET to /user/{userId} should return User and 200", () => {
    const targetUser = getTargetUser()
    const authAdminUser = getAuthUser(u => u.isAdmin!)
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
  test("GET to /user should return list of users", () => {
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
  test("GET to /user with admin credentials can return list of users with email", () => {
    const adminUserTest = getAuthUser(u => u.isAdmin!)
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
  test("GET get to /user/{userId} should return user", () => {
    const user = getAuthUser()
    const adminUserTest = getAuthUser(u => u.isAdmin!)
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
  test("PUT to /user/{userId} with no credentials should return 401", async () => {
    const targetUser = getTargetUser()
    expect.assertions(1)
    const e = await service.userPUT(targetUser.id, targetUser)
    expect(e).toBe(error401UserNotAuthenticated)
  })
  test("PUT to /user/{userId} with improper credentials should return 403", async () => {
    const targetUser = getTargetUser()
    const ordinaryUser = getAuthUser(u => !u.isAdmin)
    expect.assertions(1)
    const e = await service.userPUT(targetUser.id, targetUser, ordinaryUser.id)
    expect(e.statusCode).toBe(403)
  })
  test("PUT to /user/{userId} with public, own credentials cannot modify isAdmin", async () => {
    const ordinaryUser = getTargetUser(u => !u.isAdmin)
    const updatedUser = { ...ordinaryUser, isAdmin: true }
    expect.assertions(1)
    const e = await service.userPUT(
      updatedUser.id,
      updatedUser,
      ordinaryUser.id
    )
    expect(e).toBe(error403ForbiddenToModify)
  })
  test("PUT to /user/{userId} with public, own credentials cannot modify isVerified", async () => {
    const ordinaryUser = getTargetUser(u => !u.isAdmin)
    const updatedUser = { ...ordinaryUser, isVerified: true }
    expect.assertions(1)
    const e = await service.userPUT(
      updatedUser.id,
      updatedUser,
      ordinaryUser.id
    )
    expect(e).toBe(error403ForbiddenToModify)
  })
  test("PUT to /user/{userId} with own credentials should alter user return 204 User updated", () => {
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
  test("PUT to /user/{userId} with invalid name, email, password should fail", async () => {
    const targetUser = getTargetUser(u => !u.isAdmin && !u.isVerified)
    const adminAuthUser = getAuthUser(u => u.isAdmin!)
    const updatedUser: UpdateUser = {
      ...targetUser,
      name: " ",
      email: " ",
      password: " ",
      isAdmin: true,
      isVerified: true
    }
    expect.assertions(1)
    const e = await service.userPUT(
      targetUser.id,
      updatedUser,
      adminAuthUser.id
    )
    expect(e).toHaveProperty("statusCode", 400)
  })
  test("PUT to /user/{userId} with admin credentials should alter user return 204 User updated", () => {
    const targetUser = getTargetUser(u => !u.isAdmin && !u.isVerified)
    const adminAuthUser = getAuthUser(u => u.isAdmin!)
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
  test("PUT to /user/{userId} with userId as uuid should succeed", async () => {
    const id = uuidv4()
    const guestUser = {
      id,
      name: randomString(alphaUserInput),
      password: mockPassword(),
      email: mockEmail()
    }
    const adminAuthUser = getAuthUser(u => u.isAdmin!)
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
    const adminAuthUser = getAuthUser(u => u.isAdmin!)
    const updatedGuestUser: User = {
      ...guestUser,
      name: randomString(alphaUserInput, 25),
      isAdmin: true
    }
    expect.assertions(1)

    await service.userPOST(guestUser, id)
    const e = await service.userPUT(
      updatedGuestUser.id,
      updatedGuestUser,
      adminAuthUser.id
    )

    expect(e).toHaveProperty("statusCode", 403)
  })
  test("PUT to /user/{userId} where userId does not exist (and admin credentials) should return 404", async () => {
    const targetUser = mockUser()
    const adminAuthUser = getAuthUser(u => u.isAdmin!)
    expect.assertions(1)
    const e = await service.userPUT(targetUser.id, targetUser, adminAuthUser.id)
    expect(e).toBe(error404UserUnknown)
  })

  // User Delete
  test("DELETE to /user/{userId} with no credentials should return 401", async () => {
    const user = getTargetUser()
    expect.assertions(1)
    const e = await service.userDELETE(user.id)
    expect(e).toBe(error401UserNotAuthenticated)
  })
  test("DELETE to /user/{userId} with improper credentials should return 403", async () => {
    const userToDelete = getTargetUser()
    const improperAuthUser = getAuthUser(
      u => !u.isAdmin && u.id !== userToDelete.id
    )
    expect.assertions(1)
    const e = await service.userDELETE(userToDelete.id, improperAuthUser.id)
    expect(e).toBe(error403UserNotAuthorized)
  })
  test("DELETE to /user/{userId} where userId does not exist and admin credentials should return 404", async () => {
    const nonExistentUser = mockUser()
    const adminAuthUser = getAuthUser(u => u.isAdmin!)
    expect.assertions(1)
    const e = await service.userDELETE(nonExistentUser.id, adminAuthUser.id)
    expect(e).toBe(error404UserUnknown)
  })
  test("DELETE to /user/{userId} with hardcoded admin userId should return 403", async () => {
    const adminAuthUser = getAuthUser(u => u.isAdmin!)
    const simpleCommentModeratorId = process.env.SIMPLE_COMMENT_MODERATOR_ID
    if (!simpleCommentModeratorId)
      throw "SIMPLE_COMMENT_MODERATOR_ID is not defined"
    expect.assertions(1)
    const e = await service.userDELETE(
      simpleCommentModeratorId,
      adminAuthUser.id
    )
    expect(e).toBe(error403Forbidden)
  })
  test("DELETE to /user/{userId} should delete user and return 202 User deleted", () => {
    const userToDelete = getTargetUser()
    const adminAuthUser = getAuthUser(u => u.isAdmin!)
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
  test("POST comment to comment to /discussion/{discussionId} with too long comment should return 413 Comment too long", async () => {
    const parentComment = chooseRandomElement(testComments)
    const user = getAuthUser()

    try {
      await service.commentPOST(parentComment.id, veryLongString, user.id)
    } catch (error) {
      expect(error).toBe(error413CommentTooLong)
    }
  })
  test("POST comment to /comment/{commentId} should return comment and 201 Comment created", async () => {
    const postResponse = await service.commentPOST(
      newCommentTest.parentId,
      newCommentTest.text!,
      newCommentTest.userId
    )

    const resbody = postResponse.body as Comment
    expect(postResponse).toHaveProperty("statusCode", 201)
    expect(postResponse).toHaveProperty("body")
    expect(resbody).toHaveProperty("text", newCommentTest.text)
    expect(resbody).toHaveProperty("user")
    expect(resbody?.user?.id).toBe(newCommentTest.userId)
  })
  test("POST comment to /comment/{commentId} without credentials should fail", async () => {
    const parentComment = chooseRandomElement(testComments)
    const text = randomString(alphaUserInput, 400)
    expect.assertions(1)
    const e = await service.commentPOST(parentComment.id, text)
    expect(e).toBe(error401UserNotAuthenticated)
  })

  test("POST comment to /comment/{commentId} with identical information within a short length of time should return 425 Possible duplicate comment", async () => {
    expect.assertions(1)
    const e = await service.commentPOST(
      newCommentTest.parentId,
      newCommentTest.text!,
      newCommentTest.userId
    )
    expect(e).toBe(error409DuplicateComment)
  })

  // Comment Read
  test("GET comment to /comment/{commentId} where commentId does not exist should return 404", async () => {
    const parentCommentId = uuidv4()
    const user = getAuthUser()
    expect.assertions(1)
    const e = await service.commentGET(parentCommentId, user.id)
    expect(e).toHaveProperty("statusCode", 404)
  })
  test("GET comment to /comment/{commentId} should return the comment with 200 OK", async () => {
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

    const res = (await service.commentGET(targetComment.id)) as Success<Comment>

    expect.assertions(10)

    const allUsers = (comments: Comment[]) => comments.map(c => c.user)
    expect(res).toHaveProperty("statusCode", 200)
    expect(res).toHaveProperty("body")
    expect(res.body).toHaveProperty("id", targetComment.id)
    expect(res.body).toHaveProperty("text", targetComment.text)
    expect(isPublicSafeUser(res.body.user!)).toBe(true)
    expect(res.body).toHaveProperty("replies")
    expect(res.body.replies?.length).toBeGreaterThan(0)
    expect(
      getChildren(res.body.id, res.body.replies!).map(r => r.id.toLowerCase())
    ).toEqual(
      expect.arrayContaining(targetChildren.map(t => t.id.toLowerCase()))
    )
    expect(res.body).toHaveProperty("user")
    expect(allUsers(res.body.replies!).every(u => isPublicSafeUser(u!))).toBe(
      true
    )
  })

  // Comment Update
  test("PUT comment to /comment/{commentId} with no credentials should return 401", async () => {
    const randomComment = chooseRandomElement(testComments.filter(isComment))
    const updateText = randomString(alphaUserInput)
    expect.assertions(1)
    const e = await service.commentPUT(randomComment.id, updateText)
    expect(e).toBe(error401UserNotAuthenticated)
  })
  test("PUT comment to /comment/{commentId} with improper credentials should return 403", async () => {
    const randomComment = chooseRandomElement(
      testComments.filter(c => !("isLocked" in c))
    ) as Comment
    const updateText = randomString(alphaUserInput)
    const improperAuthUser = getAuthUser(
      u => !u.isAdmin && u.id !== randomComment.userId
    )
    expect.assertions(1)
    const e = await service.commentPUT(
      randomComment.id,
      updateText,
      improperAuthUser.id
    )
    expect(e).toBe(error403UserNotAuthorized)
  })
  test("PUT comment to /comment/{commentId} where Id does not exist should return 404", async () => {
    const unknownComment = { text: randomString(), id: uuidv4() }
    const adminUserTest = authUserTest
    expect.assertions(1)
    const e = await service.commentPUT(
      unknownComment.id,
      unknownComment.text,
      adminUserTest.id
    )
    expect(e).toHaveProperty("statusCode", 404)
  })
  test("PUT comment to /comment/{commentId} should return the edited comment with 202 Comment updated", () => {
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
        expect(res).toEqual(
          expect.objectContaining({
            body: expect.objectContaining({
              dateCreated: expect.any(Object),
              id: targetComment.id,
              parentId: targetComment.parentId,
              text: updatedComment.text,
              user: undefined,
              userId
            }),
            statusCode: 204
          })
        )
      })
  })

  // Comment Delete
  test("DELETE comment to /comment/{commentId} with no credentials should return 401", async () => {
    const targetComment = chooseRandomElement(testComments.filter(isComment))
    expect.assertions(1)
    const e = await service.commentDELETE(targetComment.id)
    expect(e).toBe(error401UserNotAuthenticated)
  })
  test("DELETE comment to /comment/{commentId} with improper credentials should return 403", async () => {
    const targetComment = chooseRandomElement(testComments.filter(isComment))
    // improper user is neither an admin nor the comment poster
    const improperUser = getAuthUser(
      u => !u.isAdmin && u.id !== targetComment.userId
    )
    expect.assertions(1)
    const e = await service.commentDELETE(targetComment.id, improperUser.id)
    expect(e).toBe(error403UserNotAuthorized)
  })
  test("DELETE comment to /comment/{commentId} where Id does not exist should return 404", async () => {
    const commentId = randomString()
    const adminUser = getAuthUser(u => u.isAdmin!)
    expect.assertions(1)
    const e = await service.commentDELETE(commentId, adminUser.id)
    expect(e).toHaveProperty("statusCode", 404)
  })
  test("DELETE comment to /comment/{commentId} by an admin should delete the comment and return 202 Comment deleted", () => {
    const targetComment = chooseRandomElement(testComments.filter(isComment))
    const adminUser = getAuthUser(u => u.isAdmin!)
    return service
      .commentDELETE(targetComment.id, adminUser.id)
      .then(value =>
        expect(value).toEqual(expect.objectContaining(success202CommentDeleted))
      )
  })
  test("DELETE comment to /comment/{commentId} by the user should delete the comment and return 202 Comment deleted", () => {
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
  test("POST to /topic with improper credentials should return 403", async () => {
    const newTopic = mockTopic()
    const ordinaryUser = getAuthUser(u => !u.isAdmin)
    expect.assertions(2)
    const postResponse = await service.topicPOST(newTopic, ordinaryUser.id)
    const deletedTopic = await db
      .collection<Comment | Discussion>("comments")
      .findOne({ id: newTopic.id })
    expect(deletedTopic).toBeNull()
    expect(postResponse).toHaveProperty("statusCode", 403)
  })
  test("POST to /topic should return Discussion object and 201 Discussion created", () => {
    const adminUserTest = getAuthUser(u => u.isAdmin!)
    return service
      .topicPOST(testNewTopic, adminUserTest.id)
      .then(async value => {
        const insertedTopic: Discussion | null = await db
          .collection<Discussion>("comments")
          .findOne({ id: testNewTopic.id })
        expect(insertedTopic?.id).toBe(testNewTopic.id)
        expect(insertedTopic?.title).toBe(testNewTopic.title)
        expect(insertedTopic?.isLocked).toBe(testNewTopic.isLocked)
        expect(value).toHaveProperty("statusCode", 201)
      })
  })

  // Topic Read
  test("GET to /topic should return a list of topics and 200 OK", () => {
    return service.topicListGET().then((res: Success<Topic[]> | Error) => {
      const resbody = res.body as Topic[]
      expect(resbody.map(i => i.id)).toEqual(
        [...testTopics, testDeleteTopic, testNewTopic].map(i => i.id)
      )
    })
  })
  test("GET to /topic/{topicId} should return a topic and descendent comments", () => {
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
  test("PUT topic  to /topic/{topicId} editing anything except title or isLocked should be ignored", () => {
    const topic = chooseRandomElement(testTopics)
    const putTopic = {
      ...topic,
      dateCreated: new Date(),
      title: randomString()
    }
    const adminUserTest = getAuthUser(u => u.isAdmin!)
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
  test("PUT topic to /topic/{topicId} with no credentials should return 401", async () => {
    const topic = chooseRandomElement(testTopics)
    const putTopic = {
      ...topic,
      isLocked: !topic.isLocked,
      title: randomString(alphaUserInput, 500)
    }
    expect.assertions(1)
    const e = await service.topicPUT(putTopic.id, putTopic)
    expect(e).toBe(error401UserNotAuthenticated)
  })
  test("PUT topic to /topic/{topicId} with improper credentials should return 403", async () => {
    const topic = chooseRandomElement(testTopics)
    const putTopic = {
      ...topic,
      isLocked: !topic.isLocked,
      title: randomString(alphaUserInput, 500)
    }
    expect.assertions(1)
    const e = await service.topicPUT(putTopic.id, putTopic, testNewUser.id)
    expect(e).toBe(error403UserNotAuthorized)
  })
  test("PUT to /topic/{topicId} where Id does not exist should return 404", async () => {
    const topic = chooseRandomElement(testTopics)
    const putTopic = { ...topic, id: randomString() }
    const adminUserTest = getAuthUser(u => u.isAdmin!)
    expect.assertions(1)
    const e = await service.topicPUT(putTopic.id, putTopic, adminUserTest.id)
    expect(e).toHaveProperty("statusCode", 404)
  })
  test("PUT topic with {topicId} to /topic/{topicId} should return topic and 204 Discussion updated", () => {
    const topic = chooseRandomElement(testTopics)
    const putTopic = { ...topic, title: randomString() }
    const adminUserTest = getAuthUser(u => u.isAdmin!)
    return service
      .topicPUT(putTopic.id, putTopic, adminUserTest.id)
      .then((res: Success<Topic> | Error) => {
        expect(res).toHaveProperty("statusCode", 204)
        expect(res).toHaveProperty("body", putTopic)
      })
  })

  // Discussion Delete
  test("DELETE topic to /topic/{topicId} with no credentials should return 401", () => {
    const topic = chooseRandomElement(testTopics)
    return service
      .topicDELETE(topic.id)
      .catch(e => expect(e).toBe(error401UserNotAuthenticated))
  })
  test("DELETE topic to /topic/{topicId} with improper credentials should return 403", () => {
    const topic = chooseRandomElement(testTopics)
    return service
      .topicDELETE(topic.id, testNewUser.id)
      .catch(e => expect(e).toBe(error403UserNotAuthorized))
  })
  test("DELETE to /topic/{topicId} where Id does not exist should return 404", () => {
    const deleteTopicId = uuidv4()
    const adminUserTest = getAuthUser(u => u.isAdmin!)
    return service
      .topicDELETE(deleteTopicId, adminUserTest.id)
      .catch(e => expect(e).toHaveProperty("statusCode", 404))
  })
  test("DELETE to /topic/{topicId} should delete the topic and return 202 Discussion deleted", () => {
    const adminUserTest = getAuthUser(u => u.isAdmin!)
    return service
      .topicDELETE(testDeleteTopic.id, adminUserTest.id)
      .then((res: Success) => expect(res).toBe(success202TopicDeleted))
  })
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
