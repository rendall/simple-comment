import {
  addHeaders,
  generateGuestId,
  getAllowOriginHeaders,
  generateCommentId,
  isAllowedReferer,
  parseQuery,
} from "../../../src/lib/backend-utilities"
import type { Email } from "../../../src/lib/simple-comment-types"
import {
  isGuestId,
  validateEmail,
  validateUserId,
} from "../../lib/shared-utilities"
import { mockUserId } from "../mockData"

describe("test the `getAllowOriginHeaders` function", () => {
  it("should return {headers} if there is a header match", () => {
    const headers = {
      "Origin": "https://blog.example.com",
      "Pragma": "no-cache",
      "referer": "https://blog.example.com/",
    }
    const allowedOrigin = ["https://blog.example.com"]
    expect(getAllowOriginHeaders(headers, allowedOrigin)).toEqual({
      "Access-Control-Allow-Origin": "https://blog.example.com",
      Vary: "Origin",
    })
  })

  it("should return {} if there is no header match", () => {
    const headers = {
      "Origin": "https://blog.example.com",
      "Pragma": "no-cache",
      "referer": "https://blog.example.com/",
    }
    const allowedOrigin = ["https://blog.no-example.com"]
    expect(getAllowOriginHeaders(headers, allowedOrigin)).toEqual({})
  })

  it("should return { 'Access-Control-Allow-Origin': '*' } if allowed origin includes *", () => {
    const headers = {
      "Origin": "https://blog.example.com",
      "Pragma": "no-cache",
      "referer": "https://blog.example.com/",
    }
    const allowedOrigin = ["*"]
    expect(getAllowOriginHeaders(headers, allowedOrigin)).toEqual({
      "Access-Control-Allow-Origin": "*",
    })
  })
})

describe("Test guest id utility", () => {
  test("isGuestId should pass id from generateGuestId", () => {
    //TODO: make this more random
    expect(isGuestId("rendall")).toBe(false)
    const guestId = generateGuestId()
    expect(isGuestId(guestId)).toBe(true)
  })
})
describe("generateCommentId", () => {
  const commentPattern = "[a-z0-9]{3}-[a-z0-9]{1,4}-[a-z0-9]{5}"
  test("generates a comment ID with a given parent ID", () => {
    const commentId = generateCommentId("topic-1")
    const expectedRegex = new RegExp(`^topic-1_${commentPattern}$`)
    expect(commentId).toMatch(expectedRegex)
  })

  test("has parent id in string", () => {
    const cId = "tuw-26xt-c1m4i"
    const pId = "not_in-string"
    const parentId = `${pId}_${cId}`
    const commentId = generateCommentId(parentId)
    const regex = new RegExp(`^${cId}_${commentPattern}`)
    expect(commentId).toContain(cId)
    expect(commentId).toMatch(regex)
    expect(commentId).not.toContain(pId)
  })

  test("generates a comment ID without a parent ID", () => {
    const commentId = generateCommentId()
    const regex = new RegExp(`^${commentPattern}$`)
    expect(commentId).toMatch(regex)
  })

  test("generates a valid comment even with Date(0, 0)", () => {
    const commentId = generateCommentId(undefined, new Date(0, 0))
    const regex = new RegExp(`^${commentPattern}$`)
    expect(commentId).toMatch(regex)
  })

  test("generates unique comment IDs", () => {
    const commentId1 = generateCommentId("parent1")
    const commentId2 = generateCommentId("parent2")
    expect(commentId1).not.toBe(commentId2)
  })
})

describe("Test validations", () => {
  test("good validateUserId", () => {
    expect(validateUserId("rendall-775-id")).toEqual({ isValid: true })
  })

  test("guestId is validateUserId", () => {
    expect(validateUserId(generateGuestId())).toEqual({ isValid: true })
  })

  test("incorrect characters in validateUserId", () => {
    expect(validateUserId("A-rendall-775-id")).toEqual({
      isValid: false,
      reason:
        "'A-rendall-775-id' must have only lower-case letters, numbers and the characters - and _, but 'A-rendall-775-id' contains A",
    })
  })

  test("not enough characters in validateUserId", () => {
    expect(validateUserId("ad")).toEqual({
      isValid: false,
      reason:
        "'ad' has only 2 characters, but it must be at least 5 characters long.",
    })
  })

  test("too many characters in validateUserId", () => {
    const tooMany = mockUserId(37)
    expect(tooMany.length).toBeGreaterThan(36)
    expect(validateUserId(tooMany)).toEqual({
      isValid: false,
      reason: `'${tooMany}' has 37 characters, but it must be no more than 36 characters long.`,
    })
  })

  const emailAscii = "abcdefghijklmnopqrstuvwxyz01234567890"
  const randomNumber = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min)) + min
  const randomString = (
    alpha: string = emailAscii,
    len: number = randomNumber(10, 50),
    str: string = ""
  ): string =>
    len === 0
      ? str
      : randomString(
          alpha,
          len - 1,
          `${str}${alpha.charAt(Math.floor(Math.random() * alpha.length))}`
        )
  const createRandomEmail = (): Email =>
    `${randomString(emailAscii)}@${randomString(emailAscii)}.${randomString(
      "abcdefghijklmnopqrstuvwxyz",
      3
    )}`
  const badEmail = randomString()
  const goodEmail = createRandomEmail()

  const badEmailValidation = validateEmail(badEmail)
  const goodEmailValidation = validateEmail(goodEmail)

  test("bad email should fail", () => {
    expect(badEmailValidation).toMatchObject({ isValid: false })
  })

  test("good email should pass", () => {
    expect(goodEmailValidation).toMatchObject({ isValid: true })
  })
})

describe("isAllowedReferer", () => {
  const normalAllowedOrigins = ["example.com", "example.com/*"]

  test.each([
    "https://example.com",
    "https://example.com/about/index.html",
    "https://www.example.com/blog",
  ])("%s should be allowed", (url: string) => {
    expect(isAllowedReferer(url, normalAllowedOrigins)).toBe(true)
  })

  test.each([
    "https://example.com/blog/no.html", // not in allowed patterns
    "https://other-example.com/about", // not in allowed patterns
    "https://yet-another-example.com", // completely different domain
  ])("%s should not be allowed", (url: string) => {
    expect(isAllowedReferer(url, normalAllowedOrigins)).toBe(false)
  })

  it("should handle URLs with hash, query parameters, and directory index", () => {
    const url = "https://www.example.com:443/about/index.html?param=value#hash"
    expect(isAllowedReferer(url, normalAllowedOrigins)).toBe(true)
  })

  it("should handle URLs without any of the stripped elements", () => {
    const url = "example.com"
    expect(isAllowedReferer(url, normalAllowedOrigins)).toBe(true)
  })
})

describe("isAllowedReferer with advanced patterns", () => {
  const allowedOriginArray = [
    "*.example.com", // any subdomain of example.com
    "example.com/*/**/blog", // any path segment followed by /blog
    "example-*.com", // any domain that starts with 'example-' and ends with '.com'
    "example.com/about(/foo)?", // optional path segment after /about
  ]

  test.each([
    "https://example-123.com",
    "https://example.com/about",
    "https://example.com/about/foo",
    "https://example.com/foo/bar/baz/blog/",
    "https://example.com/foo/blog",
    "https://sub.example.com",
  ])("%s should be allowed", (url: string) => {
    expect(isAllowedReferer(url, allowedOriginArray)).toBe(true)
  })

  test.each([
    "https://example.com", // no subdomain or path
    "https://example.com/blog", // missing path segment before /blog
    "https://example123.com", // does not start with 'example-'
    "https://example.com/about/foo/bar", // extra path segment after /about/foo
    "https://other-example.com", // not in allowed patterns
  ])("%s should not be allowed", (url: string) => {
    expect(isAllowedReferer(url, allowedOriginArray)).toBe(false)
  })

  // never use these as allowed origins
  test.each([
    "https://example.com", // protocol is stripped by normalization
    "http://example.com", // protocol is stripped by normalization
    "www.example.com", // 'www' is always stripped
    "example.com/", // trailing slash is stripped by normalization
    "example.com/index.html", // directory index is stripped by normalization
    "example.com?foo=bar", // query parameters are stripped by normalization
    "example.com#foo", // hash is stripped by normalization
  ])("allowed origin %s will not match", (url: string) => {
    expect(isAllowedReferer(url, [url])).toBe(false)
  })
})

describe("parseQuery()", () => {
  it("should parse correctly", () => {
    const query = "key1=value1&key2=value2"
    const expected = { key1: "value1", key2: "value2" }
    expect(parseQuery(query)).toEqual(expected)
  })

  it("should decode URI components", () => {
    const query = "key1=value%20with%20spaces&key2=value%2Bwith%2Bpluses"
    const expected = { key1: "value with spaces", key2: "value+with+pluses" }
    expect(parseQuery(query)).toEqual(expected)
  })

  it("should handle empty strings", () => {
    const query = ""
    const expected = {}
    expect(parseQuery(query)).toEqual(expected)
  })

  it("should handle keys without values", () => {
    const query = "key1=&key2"
    const expected = { key1: "", key2: "" }
    expect(parseQuery(query)).toEqual(expected)
  })

  it("should handle values without keys", () => {
    const query = "=value1&=value2"
    const expected = { "": "value2" } // Only the last value will be kept
    expect(parseQuery(query)).toEqual(expected)
  })

  it("should throw an error for malformed URI sequences", () => {
    const query = "key1=%C0%C1"
    expect(() => parseQuery(query)).toThrow()
  })
})

describe("addHeaders", () => {
  it("should add headers to a response without a body", () => {
    const res = {
      statusCode: 200,
    }
    const headers = {
      "Custom-Header": "CustomValue",
    }
    const result = addHeaders(res, headers)
    expect(result).toEqual({
      statusCode: 200,
      headers: {
        "Custom-Header": "CustomValue",
      },
    })
  })

  it("should add headers and stringify a JSON body", () => {
    const res = {
      statusCode: 200,
      body: { key: "value" },
    }
    const headers = {
      "Custom-Header": "CustomValue",
    }
    const result = addHeaders(res, headers)
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({ key: "value" }),
      headers: {
        "Custom-Header": "CustomValue",
        "Content-Type": "application/json",
      },
    })
  })

  it("should add headers and leave a string body as is", () => {
    const res = {
      statusCode: 200,
      body: "Hello, world!",
    }
    const headers = {
      "Custom-Header": "CustomValue",
    }
    const result = addHeaders(res, headers)
    expect(result).toEqual({
      statusCode: 200,
      body: "Hello, world!",
      headers: {
        "Custom-Header": "CustomValue",
        "Content-Type": "text/plain",
      },
    })
  })
})

// Tests to do:
// decodeAuthHeader
// getAuthCredentials
// getAuthHeaderValue
// getCookieToken
// getNewTopicInfo
// getNewUserInfo
// getTargetId
// getTokenClaim
// getUpdateTopicInfo
// getUpdatedUserInfo
// getUserId
// getUserIdPassword
// hasBasicScheme
// hasBearerScheme
// hasTokenCookie
// isAdminSafeUser
// isError
// isPublicSafeUser
// parseAuthHeader
// toAdminSafeUser
// toPublicSafeUser
// toSafeUser
// toTopic
// toUpdatedUser
