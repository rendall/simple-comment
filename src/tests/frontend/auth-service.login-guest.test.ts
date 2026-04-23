import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { get } from "svelte/store"
import { createAuthService } from "../../lib/auth-service"
import type {
  AdminSafeUser,
  AuthToken,
  ServerResponse,
  TokenClaim,
} from "../../lib/simple-comment-types"
import {
  createGuestUser,
  getGuestToken,
  postAuth,
  updateUser,
  verifySelf,
  verifyUser,
} from "../../apiClient"

jest.mock("../../apiClient", () => ({
  createGuestUser: jest.fn(),
  getGuestToken: jest.fn(),
  postAuth: jest.fn(),
  updateUser: jest.fn(),
  verifySelf: jest.fn(),
  verifyUser: jest.fn(),
}))

const mockCreateGuestUser = jest.mocked(createGuestUser)
const mockGetGuestToken = jest.mocked(getGuestToken)
const mockPostAuth = jest.mocked(postAuth)
const mockUpdateUser = jest.mocked(updateUser)
const mockVerifySelf = jest.mocked(verifySelf)
const mockVerifyUser = jest.mocked(verifyUser)

const guestUser: AdminSafeUser = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Guest Example",
  email: "guest@example.com",
  isAdmin: false,
  isVerified: true,
  challenge: "stored-guest-challenge",
}

const updatedGuestUser: AdminSafeUser = {
  ...guestUser,
  name: "Updated Guest",
  email: "updated@example.com",
}

const validAuthResponse: ServerResponse<AuthToken> = {
  status: 200,
  ok: true,
  statusText: "OK",
  body: "auth-token",
}

const validGuestTokenResponse: ServerResponse<AuthToken> = {
  status: 200,
  ok: true,
  statusText: "OK",
  body: "guest-token",
}

const validTokenClaimResponse: ServerResponse<TokenClaim> = {
  status: 200,
  ok: true,
  statusText: "OK",
  body: { user: guestUser.id, exp: 9999999999 },
}

const validGuestCreateResponse: ServerResponse<AdminSafeUser> = {
  status: 201,
  ok: true,
  statusText: "Created",
  body: guestUser,
}

const validGuestUpdateResponse: ServerResponse<AdminSafeUser> = {
  status: 200,
  ok: true,
  statusText: "OK",
  body: updatedGuestUser,
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

describe("auth-service guest login", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("reuses stored guest credentials and publishes authenticated user", async () => {
    const authService = await bootstrapLoggedOut()

    mockPostAuth.mockResolvedValue(validAuthResponse)
    mockVerifyUser.mockResolvedValue(validTokenClaimResponse)
    mockVerifySelf.mockResolvedValue(guestUser)

    await authService.loginGuest({
      displayName: "Guest Example",
      email: "guest@example.com",
      storedGuest: {
        id: guestUser.id,
        challenge: "stored-guest-challenge",
        name: "Guest Example",
        email: "guest@example.com",
      },
    })

    expect(mockPostAuth).toHaveBeenCalledTimes(1)
    expect(mockPostAuth).toHaveBeenCalledWith(
      guestUser.id,
      "stored-guest-challenge"
    )
    expect(mockVerifyUser).toHaveBeenCalledTimes(1)
    expect(mockGetGuestToken).not.toHaveBeenCalled()
    expect(mockCreateGuestUser).not.toHaveBeenCalled()
    expect(mockUpdateUser).not.toHaveBeenCalled()
    expect(mockVerifySelf).toHaveBeenCalledTimes(1)
    expect(get(authService.sessionState)).toBe("loggedIn")
    expect(get(authService.currentUser)).toEqual(guestUser)
  })

  test("updates reused guest profile when submitted identity changes", async () => {
    const authService = await bootstrapLoggedOut()

    mockPostAuth.mockResolvedValue(validAuthResponse)
    mockVerifyUser.mockResolvedValue(validTokenClaimResponse)
    mockUpdateUser.mockResolvedValue(validGuestUpdateResponse)
    mockVerifySelf.mockResolvedValue(updatedGuestUser)

    await authService.loginGuest({
      displayName: "Updated Guest",
      email: "updated@example.com",
      storedGuest: {
        id: guestUser.id,
        challenge: "stored-guest-challenge",
        name: "Guest Example",
        email: "guest@example.com",
      },
    })

    expect(mockUpdateUser).toHaveBeenCalledTimes(1)
    expect(mockUpdateUser).toHaveBeenCalledWith({
      id: guestUser.id,
      name: "Updated Guest",
      email: "updated@example.com",
    })
    expect(get(authService.sessionState)).toBe("loggedIn")
    expect(get(authService.currentUser)).toEqual(updatedGuestUser)
  })

  test("creates a new guest when stored guest credentials are missing", async () => {
    const authService = await bootstrapLoggedOut()

    mockGetGuestToken.mockResolvedValue(validGuestTokenResponse)
    mockVerifyUser.mockResolvedValue(validTokenClaimResponse)
    mockCreateGuestUser.mockResolvedValue(validGuestCreateResponse)
    mockVerifySelf.mockResolvedValue(guestUser)

    await authService.loginGuest({
      displayName: "Guest Example",
      email: "guest@example.com",
    })

    expect(mockPostAuth).not.toHaveBeenCalled()
    expect(mockGetGuestToken).toHaveBeenCalledTimes(1)
    expect(mockVerifyUser).toHaveBeenCalledTimes(1)
    expect(mockCreateGuestUser).toHaveBeenCalledTimes(1)
    expect(mockCreateGuestUser).toHaveBeenCalledWith({
      id: guestUser.id,
      name: "Guest Example",
      email: "guest@example.com",
    })
    expect(get(authService.sessionState)).toBe("loggedIn")
    expect(get(authService.currentUser)).toEqual(guestUser)
  })

  test("falls back to new guest creation when stored guest auth fails", async () => {
    const authService = await bootstrapLoggedOut()

    mockPostAuth.mockRejectedValue({
      status: 401,
      ok: false,
      statusText: "Unauthorized",
      body: "Bad credentials",
    })
    mockGetGuestToken.mockResolvedValue(validGuestTokenResponse)
    mockVerifyUser.mockResolvedValue(validTokenClaimResponse)
    mockCreateGuestUser.mockResolvedValue(validGuestCreateResponse)
    mockVerifySelf.mockResolvedValue(guestUser)

    await authService.loginGuest({
      displayName: "Guest Example",
      email: "guest@example.com",
      storedGuest: {
        id: guestUser.id,
        challenge: "stale-challenge",
      },
    })

    expect(mockPostAuth).toHaveBeenCalledTimes(1)
    expect(mockGetGuestToken).toHaveBeenCalledTimes(1)
    expect(mockCreateGuestUser).toHaveBeenCalledTimes(1)
    expect(get(authService.sessionState)).toBe("loggedIn")
    expect(get(authService.currentUser)).toEqual(guestUser)
  })

  test("leaves currentUser undefined and transitions to error on guest login failure", async () => {
    const authService = await bootstrapLoggedOut()

    mockGetGuestToken.mockRejectedValue({
      status: 403,
      ok: false,
      statusText: "Forbidden",
      body: "Guest login disabled",
    })

    await authService.loginGuest({
      displayName: "Guest Example",
      email: "guest@example.com",
    })

    expect(mockGetGuestToken).toHaveBeenCalledTimes(1)
    expect(mockCreateGuestUser).not.toHaveBeenCalled()
    expect(get(authService.sessionState)).toBe("error")
    expect(get(authService.currentUser)).toBeUndefined()
  })
})
