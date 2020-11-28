import {
  getAllowOriginHeaders,
  isGuestId,
  validateUserId
} from "../src/lib/utilities"
import { v4 as uuidv4 } from "uuid"

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
