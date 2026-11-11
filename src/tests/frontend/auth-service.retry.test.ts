import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals"
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
import type { AuthService, AuthSessionState } from "../../lib/auth-service"
import type {
  AdminSafeUser,
  ServerResponseError,
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

const registeredUser: AdminSafeUser = {
  id: "alice",
  name: "Alice Example",
  email: "alice@example.com",
  isAdmin: false,
  isVerified: true,
  challenge: "registered-challenge",
}
const guestUser: AdminSafeUser = {
  ...registeredUser,
  id: "00000000-0000-4000-8000-000000000001",
  name: "Guest Example",
  email: "guest@example.com",
  challenge: "guest-challenge",
}

const firstError: ServerResponseError = {
  ok: false,
  status: 401,
  statusText: "Unauthorized",
  body: "First attempt failed",
}
const retryError: ServerResponseError = {
  ok: false,
  status: 503,
  statusText: "Service Unavailable",
  body: "Retry failed",
}

const signupPayload = {
  userId: registeredUser.id,
  password: "password123",
  displayName: registeredUser.name,
  email: registeredUser.email,
}
const guestPayload = { displayName: guestUser.name, email: guestUser.email }

const retryCases = [
  {
    command: "login",
    run: (service: AuthService) =>
      service.login({ userId: registeredUser.id, password: "password123" }),
    firstRequest: mockPostAuth,
    user: registeredUser,
  },
  {
    command: "signup",
    run: (service: AuthService) => service.signup(signupPayload),
    firstRequest: mockCreateUser,
    user: registeredUser,
  },
  {
    command: "loginGuest",
    run: (service: AuthService) => service.loginGuest(guestPayload),
    firstRequest: mockGetGuestToken,
    user: guestUser,
  },
] as const

const persistence = {
  loadStoredUser: jest.fn(() => undefined),
  saveStoredUser: jest.fn(),
  clearStoredUser: jest.fn(),
  loadStoredGuestIdentity: jest.fn(() => undefined),
}
let authService: AuthService

const startFailedAttempt = async (retryCase: (typeof retryCases)[number]) => {
  const firstRequest = authService.requestAuth("comment-submit")
  retryCase.firstRequest.mockRejectedValueOnce(firstError)
  await retryCase.run(authService)

  expect(get(authService.sessionState)).toBe("error")
  expect(get(authService.authRuntimeSnapshot).error).toEqual(firstError)
  expect(get(authService.currentUser)).toBeUndefined()
  expect(get(authService.authOutcome)).toEqual({
    status: "remoteError",
    error: firstError,
    requestId: firstRequest.requestId,
  })

  jest.clearAllMocks()
  mockVerifySelf.mockResolvedValue(retryCase.user)
  return authService.requestAuth("comment-submit")
}

const expectRetryFailure = (requestId: string) => {
  expect(get(authService.sessionState)).toBe("error")
  expect(get(authService.authRuntimeSnapshot).error).toEqual(retryError)
  expect(get(authService.currentUser)).toBeUndefined()
  expect(get(authService.authRequest)).toEqual({ status: "idle" })
  expect(get(authService.authOutcome)).toEqual({
    status: "remoteError",
    error: retryError,
    requestId,
  })
  expect(persistence.saveStoredUser).not.toHaveBeenCalled()
}

describe("auth-service retries after a remote error", () => {
  beforeEach(async () => {
    jest.resetAllMocks()
    authService = createAuthService({ persistence })
    mockVerifySelf.mockRejectedValueOnce({ status: 401 })
    await authService.init()
    expect(get(authService.sessionState)).toBe("loggedOut")

    mockPostAuth.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      body: "auth-token",
    })
    mockCreateUser.mockResolvedValue({
      ok: true,
      status: 201,
      statusText: "Created",
      body: registeredUser,
    })
    mockGetGuestToken.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      body: "guest-token",
    })
    mockVerifyUser.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      body: { user: guestUser.id, exp: 9999999999 },
    })
    mockCreateGuestUser.mockResolvedValue({
      ok: true,
      status: 201,
      statusText: "Created",
      body: guestUser,
    })
    jest.clearAllMocks()
  })

  afterEach(() => {
    authService.destroy()
  })

  describe.each(retryCases)("$command", retryCase => {
    test("stays verifying until the retry's user verification succeeds", async () => {
      const { requestId } = await startFailedAttempt(retryCase)
      let stateDuringVerification: AuthSessionState | undefined
      let outcomeDuringVerification: unknown
      let userDuringVerification: unknown
      mockVerifySelf.mockImplementationOnce(async () => {
        stateDuringVerification = get(authService.sessionState)
        outcomeDuringVerification = get(authService.authOutcome)
        userDuringVerification = get(authService.currentUser)
        return retryCase.user
      })

      await retryCase.run(authService)

      expect(mockVerifySelf).toHaveBeenCalledTimes(1)
      expect(stateDuringVerification).toBe("verifying")
      expect(outcomeDuringVerification).toEqual({ status: "none" })
      expect(userDuringVerification).toBeUndefined()
      expect(get(authService.sessionState)).toBe("loggedIn")
      expect(get(authService.currentUser)).toEqual(retryCase.user)
      expect(get(authService.authRequest)).toEqual({ status: "idle" })
      expect(get(authService.authOutcome)).toEqual({
        status: "success",
        user: retryCase.user,
        requestId,
      })
      expect(persistence.saveStoredUser).toHaveBeenCalledWith(retryCase.user)
    })

    test("preserves the retry error when final user verification fails", async () => {
      const { requestId } = await startFailedAttempt(retryCase)
      mockVerifySelf.mockRejectedValueOnce(retryError)

      await retryCase.run(authService)

      expect(mockVerifySelf).toHaveBeenCalledTimes(1)
      expectRetryFailure(requestId)
    })

    test.each(["error response", "rejected promise"] as const)(
      "handles a retry's first API failure (%s)",
      async failureMode => {
        const { requestId } = await startFailedAttempt(retryCase)
        if (failureMode === "error response") {
          retryCase.firstRequest.mockResolvedValueOnce(retryError)
        } else {
          retryCase.firstRequest.mockRejectedValueOnce(retryError)
        }

        await retryCase.run(authService)

        expect(mockVerifySelf).not.toHaveBeenCalled()
        expectRetryFailure(requestId)
      }
    )
  })

  test.each(["error response", "rejected promise"] as const)(
    "signup retry reports an authentication %s after account creation succeeds",
    async failureMode => {
      const signupCase = retryCases[1]
      const { requestId } = await startFailedAttempt(signupCase)
      if (failureMode === "error response") {
        mockPostAuth.mockResolvedValueOnce(retryError)
      } else {
        mockPostAuth.mockRejectedValueOnce(retryError)
      }

      await signupCase.run(authService)

      expect(mockCreateUser).toHaveBeenCalledTimes(1)
      expect(mockPostAuth).toHaveBeenCalledTimes(1)
      expect(mockVerifySelf).not.toHaveBeenCalled()
      expectRetryFailure(requestId)
    }
  )
})
