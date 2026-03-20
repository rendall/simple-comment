import { getAuthToken, getExpirationTime } from "../../../src/lib/crypt"
import type { TokenClaim, UserId } from "../../../src/lib/simple-comment-types"
import * as jwt from "jsonwebtoken"

describe("Test crypt", () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it("Get Expiration time", () => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:01.234Z"))
    expect(getExpirationTime(1)).toBe(1735689600)
    expect(getExpirationTime(11)).toBe(1735689610)
  })

  it("Test auth token", () => {
    const name = "Rendall"
    const expirationTime = 2_000_000_000
    const token = getAuthToken(name, expirationTime)
    const jwtSecret = process.env.JWT_SECRET
    if (jwtSecret === undefined)
      throw "JWT_SECRET is not set in the environment variables"

    const claim: TokenClaim = jwt.verify(token, jwtSecret) as unknown as {
      user: UserId
      exp: number
    }

    expect(claim.user).toBe(name)
    expect(claim.exp).toBe(expirationTime)
  })
})
