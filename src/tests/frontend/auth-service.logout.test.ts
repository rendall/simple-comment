import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { get } from "svelte/store"
import { createAuthService } from "../../lib/auth-service"
import type { AdminSafeUser, ServerResponse } from "../../lib/simple-comment-types"
import { deleteAuth } from "../../apiClient"

jest.mock("../../apiClient", () => ({
  deleteAuth: jest.fn(),
  postAuth: jest.fn(),
  verifySelf: jest.fn(),
}))

const mockDeleteAuth = jest.mocked(deleteAuth)

const verifiedUser: AdminSafeUser = {
  id: "alice",
  name: "Alice Example",
  email: "alice@example.com",
  isAdmin: false,
  isVerified: true,
  challenge: "challenge-token",
}

const validLogoutResponse: ServerResponse<string> = {
  status: 200,
  ok: true,
  statusText: "OK",
  body: "logged out",
}

const bootstrapLoggedIn = async () => {
  const authService = createAuthService({ initialUser: verifiedUser })

  await authService.init()

  expect(get(authService.sessionState)).toBe("loggedIn")
  expect(get(authService.currentUser)).toEqual(verifiedUser)

  jest.clearAllMocks()

  return authService
}

describe("auth-service logout", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("owns the deleteAuth side effect and clears authenticated user on success", async () => {
    const authService = await bootstrapLoggedIn()

    mockDeleteAuth.mockResolvedValue(validLogoutResponse)

    await authService.logout()

    expect(mockDeleteAuth).toHaveBeenCalledTimes(1)
    expect(get(authService.sessionState)).toBe("loggedOut")
    expect(get(authService.currentUser)).toBeUndefined()
  })

  test("transitions to error and preserves currentUser on failed logout", async () => {
    const authService = await bootstrapLoggedIn()

    mockDeleteAuth.mockRejectedValue({
      status: 500,
      ok: false,
      statusText: "Internal Server Error",
      body: "Logout failed",
    })

    await authService.logout()

    expect(mockDeleteAuth).toHaveBeenCalledTimes(1)
    expect(get(authService.sessionState)).toBe("error")
    expect(get(authService.currentUser)).toEqual(verifiedUser)
  })
})
