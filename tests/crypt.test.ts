import { getAuthToken, getExpirationTime } from "../src/lib/crypt"
import type { TokenClaim, UserId } from "../src/lib/simple-comment"
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

    const claim: TokenClaim = (await jwt.verify(
      token,
      process.env.JWT_SECRET
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
