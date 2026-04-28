import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { get } from "svelte/store"
import {
  createGuestUser,
  createUser,
  getGuestToken,
  postAuth,
  verifySelf,
  verifyUser,
} from "../../apiClient"
import { createAuthService } from "../../lib/auth-service"
import type {
  AdminSafeUser,
  AuthToken,
  ServerResponse,
  TokenClaim,
} from "../../lib/simple-comment-types"

jest.mock("../../apiClient", () => ({
  createGuestUser: jest.fn(),
  createUser: jest.fn(),
  getGuestToken: jest.fn(),
  postAuth: jest.fn(),
  verifySelf: jest.fn(),
  verifyUser: jest.fn(),
}))

const mockCreateGuestUser = jest.mocked(createGuestUser)
const mockCreateUser = jest.mocked(createUser)
const mockGetGuestToken = jest.mocked(getGuestToken)
const mockPostAuth = jest.mocked(postAuth)
const mockVerifySelf = jest.mocked(verifySelf)
const mockVerifyUser = jest.mocked(verifyUser)

const verifiedUser: AdminSafeUser = {
  id: "alice",
  name: "Alice Example",
  email: "alice@example.com",
  isAdmin: false,
  isVerified: true,
  challenge: "verified-user-challenge",
}

const guestUser: AdminSafeUser = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Guest Example",
  email: "guest@example.com",
  isAdmin: false,
  isVerified: true,
  challenge: "guest-challenge",
}

const validAuthResponse: ServerResponse<AuthToken> = {
  status: 200,
  ok: true,
  statusText: "OK",
  body: "auth-token",
}

const validSignupResponse: ServerResponse<AdminSafeUser> = {
  status: 201,
  ok: true,
  statusText: "Created",
  body: verifiedUser,
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

const remoteErrorResponse: ServerResponse<string> = {
  status: 401,
  ok: false,
  statusText: "Unauthorized",
  body: "Bad credentials",
}

const signupPayload = {
  userId: "alice",
  password: "password123",
  displayName: "Alice Example",
  email: "alice@example.com",
}

const guestLoginPayload = {
  displayName: "Guest Example",
  email: "guest@example.com",
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

const mockSuccessfulLogin = () => {
  mockPostAuth.mockResolvedValue(validAuthResponse)
  mockVerifySelf.mockResolvedValue(verifiedUser)
}

const mockSuccessfulSignup = () => {
  mockCreateUser.mockResolvedValue(validSignupResponse)
  mockPostAuth.mockResolvedValue(validAuthResponse)
  mockVerifySelf.mockResolvedValue(verifiedUser)
}

const mockSuccessfulGuestLogin = () => {
  mockGetGuestToken.mockResolvedValue(validGuestTokenResponse)
  mockVerifyUser.mockResolvedValue(validTokenClaimResponse)
  mockCreateGuestUser.mockResolvedValue(validGuestCreateResponse)
  mockVerifySelf.mockResolvedValue(guestUser)
}

describe("auth-service auth requests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("publishes matching success outcome for pending login request", async () => {
    const authService = await bootstrapLoggedOut()
    const { requestId } = authService.requestAuth("comment-submit")

    mockSuccessfulLogin()

    await authService.login({ userId: "alice", password: "password123" })

    expect(get(authService.authRequest)).toEqual({ status: "idle" })
    expect(get(authService.authOutcome)).toEqual({
      status: "success",
      user: verifiedUser,
      requestId,
    })
  })

  test("publishes matching remote error outcome for failed pending login request", async () => {
    const authService = await bootstrapLoggedOut()
    const { requestId } = authService.requestAuth("comment-submit")

    mockPostAuth.mockRejectedValue(remoteErrorResponse)

    await authService.login({ userId: "alice", password: "wrong-password" })

    expect(get(authService.authRequest)).toEqual({ status: "idle" })
    expect(get(authService.authOutcome)).toEqual({
      status: "remoteError",
      error: remoteErrorResponse,
      requestId,
    })
  })

  test("publishes matching request outcome for pending signup request", async () => {
    const authService = await bootstrapLoggedOut()
    const { requestId } = authService.requestAuth("comment-submit")

    mockSuccessfulSignup()

    await authService.signup(signupPayload)

    expect(get(authService.authRequest)).toEqual({ status: "idle" })
    expect(get(authService.authOutcome)).toEqual({
      status: "success",
      user: verifiedUser,
      requestId,
    })

    authService.requestAuth("comment-submit")
    mockCreateUser.mockRejectedValue(remoteErrorResponse)

    await authService.signup(signupPayload)

    expect(get(authService.authRequest)).toEqual({ status: "idle" })
    expect(get(authService.authOutcome)).toEqual({
      status: "remoteError",
      error: remoteErrorResponse,
      requestId: "auth-request-2",
    })
  })

  test("publishes matching request outcome for pending guest login request", async () => {
    const authService = await bootstrapLoggedOut()
    const { requestId } = authService.requestAuth("comment-submit")

    mockSuccessfulGuestLogin()

    await authService.loginGuest(guestLoginPayload)

    expect(get(authService.authRequest)).toEqual({ status: "idle" })
    expect(get(authService.authOutcome)).toEqual({
      status: "success",
      user: guestUser,
      requestId,
    })

    authService.requestAuth("comment-submit")
    mockGetGuestToken.mockRejectedValue(remoteErrorResponse)

    await authService.loginGuest(guestLoginPayload)

    expect(get(authService.authRequest)).toEqual({ status: "idle" })
    expect(get(authService.authOutcome)).toEqual({
      status: "remoteError",
      error: remoteErrorResponse,
      requestId: "auth-request-2",
    })
  })

  test("preserves command behavior when no auth request is pending", async () => {
    const authService = await bootstrapLoggedOut()

    mockSuccessfulLogin()

    await authService.login({ userId: "alice", password: "password123" })

    expect(get(authService.authRequest)).toEqual({ status: "idle" })
    expect(get(authService.authOutcome)).toEqual({ status: "none" })
    expect(get(authService.sessionState)).toBe("loggedIn")
    expect(get(authService.currentUser)).toEqual(verifiedUser)
  })
})
