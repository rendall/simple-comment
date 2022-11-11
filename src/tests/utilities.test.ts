import {
  getAllowOriginHeaders,
  isAllowedReferer,
  isGuestId,
  validateEmail,
  validateUserId
} from "../../src/lib/utilities"
import { v4 as uuidv4 } from "uuid"
import { Email } from "../../src/lib/simple-comment"

describe("test the `getAllowOriginHeaders` function", () => {
  it("should return {headers} if there is a header match", () => {
    const headers = {
      "Origin": "https://blog.example.com",
      "Pragma": "no-cache",
      "referer": "https://blog.example.com/"
    }
    const allowedOrigin = ["https://blog.example.com"]
    expect(getAllowOriginHeaders(headers, allowedOrigin)).toEqual({
      "Access-Control-Allow-Origin": "https://blog.example.com",
      Vary: "Origin"
    })
  })

  it("should return {} if there is no header match", () => {
    const headers = {
      "Origin": "https://blog.example.com",
      "Pragma": "no-cache",
      "referer": "https://blog.example.com/"
    }
    const allowedOrigin = ["https://blog.no-example.com"]
    expect(getAllowOriginHeaders(headers, allowedOrigin)).toEqual({})
  })

  it("should return { 'Access-Control-Allow-Origin': '*' } if allowed origin includes *", () => {
    const headers = {
      "Origin": "https://blog.example.com",
      "Pragma": "no-cache",
      "referer": "https://blog.example.com/"
    }
    const allowedOrigin = ["*"]
    expect(getAllowOriginHeaders(headers, allowedOrigin)).toEqual({
      "Access-Control-Allow-Origin": "*"
    })
  })
})

describe("Test guest id utility", () => {
  test("isGuestId should fail anything other than a uuid", () => {
    //TODO: make this more random
    expect(isGuestId("rendall")).toBe(false)
    const guestId = uuidv4()
    expect(isGuestId(guestId)).toBe(true)
  })
})

describe("Test validations", () => {
  test("good validateUserId", () => {
    expect(validateUserId("rendall-775-id")).toEqual(
      expect.objectContaining({ isValid: true })
    )
  })

  test("uuidv4 in validateUserId", () => {
    expect(validateUserId(uuidv4())).toEqual(
      expect.objectContaining({ isValid: true })
    )
  })

  test("incorrect characters in validateUserId", () => {
    expect(validateUserId("A-rendall-775-id")).toEqual(
      expect.objectContaining({ isValid: false })
    )
  })

  test("not enough characters in validateUserId", () => {
    expect(validateUserId("ad")).toEqual(
      expect.objectContaining({ isValid: false })
    )
  })

  test("too many  characters in validateUserId", () => {
    const tooMany = uuidv4() + "a"
    expect(tooMany.length).toBeGreaterThan(36)
    expect(validateUserId(tooMany)).toEqual(
      expect.objectContaining({ isValid: false })
    )
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

describe("isAllowedReferer()", () => {
  test.each(["https://example.com/blog", "https://example.com/blog/yes.html"])(
    "%s should match https://example.com/**/*",
    (url: string) => {
      expect(isAllowedReferer(url, ["https://example.com/**/*"])).toBe(true)
    }
  )

  test.each(["https://example.com", "https://other-example.com"])(
    "%s should match https://**",
    (url: string) => {
      expect(isAllowedReferer(url, ["https://**"])).toBe(true)
    }
  )

  test.each([
    "https://example.com",
    "https://example.com/about/no.html",
    "https://example.com/blog",
    "https://example.com/blog/yes.html",
    "https://other-example.com"
  ])("https://example.com/blog/no.html should not match %s", (url: string) => {
    expect(
      isAllowedReferer("https://example.com/blog/no.html", [url])
    ).not.toBe(true)
  })

  test.each(["https://example.com", "http://example.com"])(
    "%s should match http*(s)://example.com",
    (url: string) => {
      expect(isAllowedReferer(url, ["http*(s)://example.com"])).toBe(true)
    }
  )
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
