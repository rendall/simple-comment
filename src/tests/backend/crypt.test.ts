import { getAuthToken, getExpirationTime } from "../../../src/lib/crypt"
import type { TokenClaim, UserId } from "../../../src/lib/simple-comment-types"
import * as jwt from "jsonwebtoken"

describe("Test crypt", () => {
  it("Get Expiration time", () => {
    const nowSeconds = Math.floor(new Date().valueOf() / 1000)
    const newSeconds = getExpirationTime(1)
    const diff = Math.abs(newSeconds - nowSeconds)
    expect(diff).toBeLessThan(10)
  })

  it("Test auth token", async () => {
    const name = "Rendall"
    const token = getAuthToken(name)
  
    // Use a defined JWT_SECRET or a default for testing
    const jwtSecret = process.env.JWT_SECRET || "default_test_secret"
  
    const claim: TokenClaim = (await jwt.verify(
      token,
      jwtSecret
    )) as {
      user: UserId
      exp: number
    }

    expect(claim.user).toBe(name)

    const expirationDate = new Date(claim.exp * 1000)
    const nowDate = new Date()

    expect(expirationDate.getFullYear()).toBe(nowDate.getFullYear() + 1)
  })
})