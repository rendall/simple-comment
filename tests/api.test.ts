import * as fs from "fs"
import type {
  AdminSafeUser,
  AuthToken,
  Comment,
  CommentId,
  Discussion,
  Error,
  NewUser,
  PublicSafeUser,
  Success,
  TokenClaim,
  Topic,
  TopicId,
  UpdateUser,
  User,
  UserId
} from "../src/lib/simple-comment"
import { Service } from "./../src/lib/Service"

type Method = "get" | "post" | "delete" | "put"

/**
 * Make sure that the OpenAPI 3 spec is represented in the code
 **/
describe("Ensures API specs match controller service", () => {
  // Does the OpenAPI 3 spec file exist?
  test("simple-comment-api.json exists", () => {
    const doesApiSpecExist = fs.existsSync(
      `${process.cwd()}/src/schema/simple-comment-api.json`
    )
    expect(doesApiSpecExist).toBe(true)
  })

  // Read the spec file
  const apiSpecText = fs.readFileSync(
    `${process.cwd()}/src/schema/simple-comment-api.json`,
    "utf8"
  )

  // Parse the spec file
  const apiSpecJSON: {
    paths: {
      [route: string]: {
        [key in Method]: {}
      }
    }
  } = JSON.parse(apiSpecText)

  // Get the `dir` part of `/dir/{id}`
  const normalizeRoute = (route: string) => route.split("/")[1]

  type RouteTuple = [string, { [key in Method]: {} }]
  // serviceMethods is an array of strings like `userGET` or `topicPOST`
  // all of these methods should exist on testService
  const serviceMethods = Object.keys(apiSpecJSON.paths)
    .map<RouteTuple>(route => [route, apiSpecJSON.paths[route]])
    .reduce(
      (methods: string[], [route, mObj]: RouteTuple) => [
        ...methods,
        ...Object.keys(mObj).map(
          method => `${normalizeRoute(route)}${method.toUpperCase()}`
        )
      ],
      []
    )

  class TestService extends Service {
    authDELETE = () =>
      new Promise<Success | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    authGET = (username: string, password: string) =>
      new Promise<AuthToken | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    authPOST = (username: string, password: string) =>
      new Promise<AuthToken | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    close = (): Promise<void> =>
      new Promise<void>((resolve, reject) => reject("Error: not implemented"))
    commentDELETE = (
      topicId: TopicId,
      commentId: CommentId,
      authUser: UserId
    ) =>
      new Promise<Success | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    commentGET = (targetId: TopicId | CommentId, authUserId?: UserId) =>
      new Promise<Success<Comment | Discussion> | Error>(
        async (resolve, reject) => reject("Error: not implemented")
      )
    commentPOST = (
      parentId: TopicId | CommentId,
      text: string,
      authUser?: UserId
    ) =>
      new Promise<Success<Comment> | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    commentPUT = (targetId: CommentId, text: string, authUser?: UserId) =>
      new Promise<Success<Comment> | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    gauthGET = () =>
      new Promise<AuthToken | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    topicDELETE = (topicId: TopicId, authUser?: UserId) =>
      new Promise<Success | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    topicGET = (topicId: TopicId, authUser?: UserId) =>
      new Promise<Success<Discussion> | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    topicListGET = (authUser?: UserId) =>
      new Promise<Success<Discussion[]> | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    topicPOST = (topic: Topic, authUserId?: UserId) =>
      new Promise<Success<Discussion> | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    topicPUT = (
      topicId: TopicId,
      topic: Pick<Topic, "title" | "isLocked">,
      authUserId?: UserId
    ) =>
      new Promise<Success<Topic> | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    userDELETE = (userId: UserId, authUser: UserId) =>
      new Promise<Success | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    userGET = (userId?: UserId, authUserId?: UserId) =>
      new Promise<Success<Partial<User>> | Error>(async (resolve, reject) =>
        reject("Error: not implemented")
      )
    userListGET = (authUserId?: UserId) =>
      new Promise<Success<AdminSafeUser[] | PublicSafeUser[]> | Error>(
        async (resolve, reject) => reject("Error: not implemented")
      )
    userPOST = (newUser: NewUser, authUserId?: UserId) =>
      new Promise<Success<User> | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    userPUT = (targetId: UserId, user: UpdateUser, authUserId?: UserId) =>
      new Promise<Success<User> | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
    verifyGET = (authToken: AuthToken) =>
      new Promise<Success<TokenClaim> | Error>((resolve, reject) =>
        reject("Error: not implemented")
      )
  }

  // TestService indirectly tests the abstract class Service
  const testService = new TestService()

  // Make sure that each entry in serviceMethods has a corresponding
  // value in the Service instance, `testService`
  serviceMethods.forEach(method => {
    test(`${method} should be defined in Service`, () => {
      expect(testService[method]).toBeDefined()
    })
  })

  test(`non existent method on Service should fail`, () => {
    expect(testService["nonexistent"]).toBeUndefined()
  })
})
