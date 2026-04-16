import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { get } from "svelte/store"
import { createAuthService } from "../../lib/auth-service"
import type { AdminSafeUser } from "../../lib/simple-comment-types"
import { verifySelf } from "../../apiClient"

jest.mock("../../apiClient", () => ({
  verifySelf: jest.fn(),
}))

const mockVerifySelf = jest.mocked(verifySelf)

const verifiedUser: AdminSafeUser = {
  id: "alice",
  name: "Alice Example",
  email: "alice@example.com",
  isAdmin: false,
  isVerified: true,
  challenge: "challenge-token",
}

describe("auth-service init", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("calls verifySelf when no initialUser is provided", async () => {
    mockVerifySelf.mockResolvedValue(verifiedUser)
    const authService = createAuthService()

    await authService.init()

    expect(mockVerifySelf).toHaveBeenCalledTimes(1)
  })

  test("transitions to loggedIn and publishes currentUser on successful verification", async () => {
    mockVerifySelf.mockResolvedValue(verifiedUser)
    const authService = createAuthService()

    await authService.init()

    expect(get(authService.sessionState)).toBe("loggedIn")
    expect(get(authService.currentUser)).toEqual(verifiedUser)
  })

  test("leaves currentUser undefined and transitions to loggedOut on 401 verification failure", async () => {
    mockVerifySelf.mockRejectedValue({ status: 401 })
    const authService = createAuthService()

    await authService.init()

    expect(mockVerifySelf).toHaveBeenCalledTimes(1)
    expect(get(authService.sessionState)).toBe("loggedOut")
    expect(get(authService.currentUser)).toBeUndefined()
  })

  test("leaves currentUser undefined and transitions to error on non-401 verification failure", async () => {
    mockVerifySelf.mockRejectedValue({ status: 500 })
    const authService = createAuthService()

    await authService.init()

    expect(mockVerifySelf).toHaveBeenCalledTimes(1)
    expect(get(authService.sessionState)).toBe("error")
    expect(get(authService.currentUser)).toBeUndefined()
  })

  test("skips verifySelf and preserves initialUser when initialUser is supplied", async () => {
    const authService = createAuthService({ initialUser: verifiedUser })

    await authService.init()

    expect(mockVerifySelf).not.toHaveBeenCalled()
    expect(get(authService.sessionState)).toBe("loggedIn")
    expect(get(authService.currentUser)).toEqual(verifiedUser)
  })
})
