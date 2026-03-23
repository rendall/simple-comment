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
  UserId,
} from "../../../src/lib/simple-comment-types"
import { AbstractDbService } from "../../../src/lib/AbstractDbService"

type Method = "get" | "post" | "delete" | "put"

/**
 * Make sure that the OpenAPI 3 spec is represented in the code
 **/
describe("Ensures API specs match controller service", () => {
  // Does the OpenAPI 3 spec file exist?
  test("simple-comment-openapi3.json exists", () => {
    const doesApiSpecExist = fs.existsSync(
      `${process.cwd()}/src/schema/simple-comment-openapi3.json`
    )
    expect(doesApiSpecExist).toBe(true)
  })

  // Read the spec file
  const apiSpecText = fs.readFileSync(
    `${process.cwd()}/src/schema/simple-comment-openapi3.json`,
    "utf8"
  )

  // Parse the spec file
  const apiSpecJSON: {
    paths: {
      [route: string]: {
        [key in Method]: Record<string, unknown>
      }
    }
  } = JSON.parse(apiSpecText)

  class TestService extends AbstractDbService {
    authDELETE = async (): Promise<Success | Error> => {
      throw "Error: not implemented"
    }

    authGET = async (
      _username: string,
      _password: string
    ): Promise<AuthToken | Error> => {
      throw "Error: not implemented"
    }

    authPOST = async (
      _username: string,
      _password: string
    ): Promise<AuthToken | Error> => {
      throw "Error: not implemented"
    }

    close = (): Promise<void> => {
      throw "Error: not implemented"
    }
    commentDELETE = async (
      _topicId: TopicId,
      _commentId: CommentId,
      _authUser: UserId
    ): Promise<Success | Error> => {
      throw "Error: not implemented"
    }

    commentGET = async (
      _targetId: TopicId | CommentId,
      _authUserId?: UserId
    ): Promise<Success<Comment | Discussion> | Error> => {
      throw "Error: not implemented"
    }

    commentPOST = async (
      _parentId: TopicId | CommentId,
      _text: string,
      _authUser?: UserId
    ): Promise<Success<Comment> | Error> => {
      throw "Error: not implemented"
    }

    commentPUT = async (
      _targetId: CommentId,
      _text: string,
      _authUser?: UserId
    ): Promise<Success<Comment> | Error> => {
      throw "Error: not implemented"
    }

    gauthGET = async (): Promise<AuthToken | Error> => {
      throw "Error: not implemented"
    }

    topicDELETE = async (
      _topicId: TopicId,
      _authUser?: UserId
    ): Promise<Success | Error> => {
      throw "Error: not implemented"
    }

    topicGET = async (
      _topicId: TopicId,
      _authUser?: UserId
    ): Promise<Success<Discussion> | Error> => {
      throw "Error: not implemented"
    }

    topicListGET = async (
      _authUser?: UserId
    ): Promise<Success<Discussion[]> | Error> => {
      throw "Error: not implemented"
    }

    topicPOST = async (
      _topic: Topic,
      _authUserId?: UserId
    ): Promise<Success<Discussion> | Error> => {
      throw "Error: not implemented"
    }

    topicPUT = async (
      _topicId: TopicId,
      _topic: Pick<Topic, "title" | "isLocked">,
      _authUserId?: UserId
    ): Promise<Success<Topic> | Error> => {
      throw "Error: not implemented"
    }

    userDELETE = async (
      _userId: UserId,
      _authUser: UserId
    ): Promise<Success | Error> => {
      throw "Error: not implemented"
    }

    userGET = async (
      _userId?: UserId,
      _authUserId?: UserId
    ): Promise<Success<Partial<User>> | Error> => {
      throw "Error: not implemented"
    }

    userListGET = async (
      _authUserId?: UserId
    ): Promise<Success<AdminSafeUser[] | PublicSafeUser[]> | Error> => {
      throw "Error: not implemented"
    }

    userPOST = async (
      _newUser: NewUser,
      _authUserId?: UserId
    ): Promise<Success<User> | Error> => {
      throw "Error: not implemented"
    }

    userPUT = async (
      _targetId: UserId,
      _user: UpdateUser,
      _authUserId?: UserId
    ): Promise<Success<User> | Error> => {
      throw "Error: not implemented"
    }

    verifyGET = async (
      _authToken: AuthToken
    ): Promise<Success<TokenClaim> | Error> => {
      throw "Error: not implemented"
    }
  }

  // TestService indirectly tests the abstract class AbstractDbService
  // This test relies on compile time flagging an error that TestService does not implment AbstractDbService
  const testService = new TestService()

  const expectedRouteToServiceMethodMap = [
    ["/topic", "get", "topicListGET"],
    ["/topic", "post", "topicPOST"],
    ["/topic/{topicId}", "get", "topicGET"],
    ["/topic/{topicId}", "put", "topicPUT"],
    ["/topic/{topicId}", "delete", "topicDELETE"],
    ["/comment/{commentId}", "post", "commentPOST"],
    ["/comment/{commentId}", "get", "commentGET"],
    ["/comment/{commentId}", "put", "commentPUT"],
    ["/comment/{commentId}", "delete", "commentDELETE"],
    ["/user", "get", "userListGET"],
    ["/user", "post", "userPOST"],
    ["/user/{userId}", "get", "userGET"],
    ["/user/{userId}", "put", "userPUT"],
    ["/user/{userId}", "delete", "userDELETE"],
    ["/auth", "post", "authPOST"],
    ["/auth", "delete", "authDELETE"],
    ["/gauth", "get", "gauthGET"],
    ["/verify", "get", "verifyGET"],
  ] as const

  const specRouteMethods = Object.entries(apiSpecJSON.paths)
    .flatMap(([route, methodMap]) =>
      Object.keys(methodMap).map(method => `${route} ${method}`)
    )
    .sort()

  const mappedRouteMethods = expectedRouteToServiceMethodMap
    .map(([route, method]) => `${route} ${method}`)
    .sort()

  test("OpenAPI route-to-service mapping table should match current spec paths", () => {
    expect(mappedRouteMethods).toEqual(specRouteMethods)
  })

  // Make sure that each explicit route/method mapping points to a corresponding
  // value in the AbstractDbService instance, `testService`
  expectedRouteToServiceMethodMap.forEach(([route, method, serviceMethod]) => {
    test(`${route} ${method} should map to ${serviceMethod} in AbstractDbService`, () => {
      const serviceRecord = testService as unknown as Record<string, unknown>
      expect(serviceRecord[serviceMethod]).toBeDefined()
    })
  })
})
