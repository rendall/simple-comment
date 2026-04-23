import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { get } from "svelte/store"
import { createAuthService } from "../../lib/auth-service"
import type { AdminSafeUser, ServerResponse } from "../../lib/simple-comment-types"
import { postAuth, verifySelf } from "../../apiClient"

jest.mock("../../apiClient", () => ({
  postAuth: jest.fn(),
  verifySelf: jest.fn(),
}))

const mockPostAuth = jest.mocked(postAuth)
const mockVerifySelf = jest.mocked(verifySelf)

const verifiedUser: AdminSafeUser = {
  id: "alice",
  name: "Alice Example",
  email: "alice@example.com",
  isAdmin: false,
  isVerified: true,
  challenge: "challenge-token",
}

const validLoginResponse: ServerResponse<string> = {
  status: 200,
  ok: true,
  statusText: "OK",
  body: "auth-token",
}

const bootstrapLoggedOut = async () => {
  const authService = createAuthService()

  mockVerifySelf.mockRejectedValue({ status: 401 })
  await authService.init()

  expect(get(authService.sessionState)).toBe("loggedOut")
  expect(get(authService.currentUser)).toBeUndefined()

  jest.clearAllMocks()

  return authService
}

describe("auth-service login", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("owns the postAuth side effect with exact credentials and publishes authenticated user on success", async () => {
    const authService = await bootstrapLoggedOut()

    mockPostAuth.mockResolvedValue(validLoginResponse)
    mockVerifySelf.mockResolvedValue(verifiedUser)

    await authService.login({ userId: "alice", password: "password123" })

    expect(mockPostAuth).toHaveBeenCalledTimes(1)
    expect(mockPostAuth).toHaveBeenCalledWith("alice", "password123")
    expect(mockVerifySelf).toHaveBeenCalledTimes(1)
    expect(get(authService.sessionState)).toBe("loggedIn")
    expect(get(authService.currentUser)).toEqual(verifiedUser)
  })

  test("leaves currentUser undefined and transitions to error on failed login", async () => {
    const authService = await bootstrapLoggedOut()

    mockPostAuth.mockRejectedValue({
      status: 401,
      ok: false,
      statusText: "Unauthorized",
      body: "Bad credentials",
    })

    await authService.login({ userId: "alice", password: "wrong-password" })

    expect(mockPostAuth).toHaveBeenCalledTimes(1)
    expect(mockPostAuth).toHaveBeenCalledWith("alice", "wrong-password")
    expect(get(authService.sessionState)).toBe("error")
    expect(get(authService.currentUser)).toBeUndefined()
  })
})
