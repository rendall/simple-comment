import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { get } from "svelte/store"
import { createAuthService } from "../../lib/auth-service"
import type { AdminSafeUser, ServerResponse } from "../../lib/simple-comment-types"
import { createUser, postAuth, verifySelf } from "../../apiClient"

jest.mock("../../apiClient", () => ({
  createUser: jest.fn(),
  postAuth: jest.fn(),
  verifySelf: jest.fn(),
}))

const mockCreateUser = jest.mocked(createUser)
const mockPostAuth = jest.mocked(postAuth)
const mockVerifySelf = jest.mocked(verifySelf)

const signupPayload = {
  userId: "alice",
  password: "password123",
  displayName: "Alice Example",
  email: "alice@example.com",
}

const createdUser: AdminSafeUser = {
  id: "alice",
  name: "Alice Example",
  email: "alice@example.com",
  isAdmin: false,
  isVerified: true,
  challenge: "created-user-challenge",
}

const verifiedUser: AdminSafeUser = {
  id: "alice",
  name: "Alice Example",
  email: "alice@example.com",
  isAdmin: false,
  isVerified: true,
  challenge: "verified-user-challenge",
}

const validSignupResponse: ServerResponse<AdminSafeUser> = {
  status: 201,
  ok: true,
  statusText: "Created",
  body: createdUser,
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

describe("auth-service signup", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("owns createUser and publishes authenticated user after successful signup", async () => {
    const authService = await bootstrapLoggedOut()

    mockCreateUser.mockResolvedValue(validSignupResponse)
    mockPostAuth.mockResolvedValue(validLoginResponse)
    mockVerifySelf.mockResolvedValue(verifiedUser)

    await authService.signup(signupPayload)

    expect(mockCreateUser).toHaveBeenCalledTimes(1)
    expect(mockCreateUser).toHaveBeenCalledWith({
      id: "alice",
      name: "Alice Example",
      email: "alice@example.com",
      password: "password123",
    })
    expect(mockPostAuth).toHaveBeenCalledTimes(1)
    expect(mockPostAuth).toHaveBeenCalledWith("alice", "password123")
    expect(mockVerifySelf).toHaveBeenCalledTimes(1)
    expect(get(authService.sessionState)).toBe("loggedIn")
    expect(get(authService.currentUser)).toEqual(verifiedUser)
  })

  test("leaves currentUser undefined and transitions to error on failed signup", async () => {
    const authService = await bootstrapLoggedOut()

    mockCreateUser.mockRejectedValue({
      status: 409,
      ok: false,
      statusText: "Conflict",
      body: "User already exists",
    })

    await authService.signup(signupPayload)

    expect(mockCreateUser).toHaveBeenCalledTimes(1)
    expect(mockCreateUser).toHaveBeenCalledWith({
      id: "alice",
      name: "Alice Example",
      email: "alice@example.com",
      password: "password123",
    })
    expect(mockPostAuth).not.toHaveBeenCalled()
    expect(mockVerifySelf).not.toHaveBeenCalled()
    expect(get(authService.sessionState)).toBe("error")
    expect(get(authService.currentUser)).toBeUndefined()
  })
})
