import {
  debounceFunc,
  getAllowOriginHeaders,
  isAllowedReferer,
  isGuestId,
  parseQuery,
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

  it("should return true for wildcard in allowed origin", () => {
    const allowedOrigin = ["https://*--simple-comment.netlify.app"]
    expect(
      isAllowedReferer(
        "https://637df4a33fea0315b6c82933--simple-comment.netlify.app",
        allowedOrigin
      )
    ).toBe(true)
  })

  it("should evaluate referer with trailing / as true", () => {
    const allowedOrigin = ["https://example.com"]
    expect(isAllowedReferer("https://example.com/", allowedOrigin)).toBe(true)
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

describe('debounce', () => {
  it('calls as expected', function (done) {
    const callingArgument = 'debounce it!'
    const debounceCallback = (value: string) => {
      expect(value).toBe(callingArgument)
      done()
    }
    const debounce = debounceFunc(debounceCallback)
    debounce(callingArgument)
  })

  it('does not call immediately', function (done) {
    const startTime = new Date()
    const debounceCallback = () => {
      const duration = new Date().valueOf() - startTime.valueOf()
      expect(duration).toBeGreaterThan(200)
      done()
    }

    const debounce = debounceFunc(debounceCallback)

    debounce('')
  })

  it('never calls callback if continuously called', function (done) {
    let numCalls = 0

    const debounceCallback = () => {
      numCalls++
    }
    const debounce = debounceFunc(debounceCallback)
    const testInterval = window.setInterval(() => debounce(''), 50)
    const endTest = (toclear: number) => () => {
      clearInterval(toclear)
      expect(numCalls).toBe(0)
      done()
    }
    setTimeout(endTest(testInterval), 500)
  })

  it('calls once only after debounce ends', function (done) {
    let numCalls = 0

    const debounceCallback = () => {
      numCalls++
    }
    const debounce = debounceFunc(debounceCallback)
    const testInterval = window.setInterval(() => debounce(''), 50)
    const endInterval = (toclear: number) => () => {
      clearInterval(toclear)
    }

    const endTest = () => {
      expect(numCalls).toBe(1)
      done()
    }
    setTimeout(endInterval(testInterval), 200)
    setTimeout(endTest, 500)
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
