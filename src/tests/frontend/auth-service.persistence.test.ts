import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { createAuthService } from "../../lib/auth-service"
import type { StoredGuestIdentity } from "../../lib/auth-service"
import type { AuthPersistence } from "../../lib/auth-persistence"
import type {
  AdminSafeUser,
  AuthToken,
  ServerResponse,
  TokenClaim,
} from "../../lib/simple-comment-types"
import {
  createGuestUser,
  createUser,
  deleteAuth,
  getGuestToken,
  postAuth,
  verifySelf,
  verifyUser,
} from "../../apiClient"

jest.mock("../../apiClient", () => ({
  createGuestUser: jest.fn(),
  createUser: jest.fn(),
  deleteAuth: jest.fn(),
  getGuestToken: jest.fn(),
  postAuth: jest.fn(),
  verifySelf: jest.fn(),
  verifyUser: jest.fn(),
}))

const mockCreateGuestUser = jest.mocked(createGuestUser)
const mockCreateUser = jest.mocked(createUser)
const mockDeleteAuth = jest.mocked(deleteAuth)
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
  challenge: "challenge-token",
}

const guestUser: AdminSafeUser = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Guest Example",
  email: "guest@example.com",
  isAdmin: false,
  isVerified: true,
  challenge: "stored-guest-challenge",
}

const persistedGuest: StoredGuestIdentity = {
  id: guestUser.id,
  challenge: "stored-guest-challenge",
  name: "Guest Example",
  email: "guest@example.com",
}

const explicitGuest: StoredGuestIdentity = {
  id: guestUser.id,
  challenge: "explicit-guest-challenge",
  name: "Explicit Guest",
  email: "explicit@example.com",
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

const validLogoutResponse: ServerResponse<string> = {
  status: 200,
  ok: true,
  statusText: "OK",
  body: "logged out",
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

const createPersistence = ({
  storedGuest,
}: {
  storedGuest?: StoredGuestIdentity
} = {}): jest.Mocked<AuthPersistence> => ({
  loadStoredUser: jest.fn(),
  saveStoredUser: jest.fn(),
  clearStoredUser: jest.fn(),
  loadStoredGuestIdentity: jest.fn(() => storedGuest),
})

const bootstrapLoggedOut = async (persistence: jest.Mocked<AuthPersistence>) => {
  const authService = createAuthService({ persistence })

  mockVerifySelf.mockRejectedValue({ status: 401 })
  await authService.init()

  jest.clearAllMocks()

  return authService
}

describe("auth-service persistence integration", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("saves verified users after successful init", async () => {
    const persistence = createPersistence()
    const authService = createAuthService({ persistence })

    mockVerifySelf.mockResolvedValue(verifiedUser)

    await authService.init()

    expect(persistence.saveStoredUser).toHaveBeenCalledWith(verifiedUser)
  })

  test("clears stored user data after unauthenticated initial verification", async () => {
    const persistence = createPersistence()
    const authService = createAuthService({ persistence })

    mockVerifySelf.mockRejectedValue({ status: 401 })

    await authService.init()

    expect(persistence.clearStoredUser).toHaveBeenCalledTimes(1)
    expect(persistence.saveStoredUser).not.toHaveBeenCalled()
  })

  test("saves verified users after successful login", async () => {
    const persistence = createPersistence()
    const authService = await bootstrapLoggedOut(persistence)

    mockPostAuth.mockResolvedValue(validAuthResponse)
    mockVerifySelf.mockResolvedValue(verifiedUser)

    await authService.login({ userId: "alice", password: "password123" })

    expect(persistence.saveStoredUser).toHaveBeenCalledWith(verifiedUser)
  })

  test("saves verified users after successful signup", async () => {
    const persistence = createPersistence()
    const authService = await bootstrapLoggedOut(persistence)

    mockCreateUser.mockResolvedValue(validSignupResponse)
    mockPostAuth.mockResolvedValue(validAuthResponse)
    mockVerifySelf.mockResolvedValue(verifiedUser)

    await authService.signup({
      userId: "alice",
      password: "password123",
      displayName: "Alice Example",
      email: "alice@example.com",
    })

    expect(persistence.saveStoredUser).toHaveBeenCalledWith(verifiedUser)
  })

  test("saves verified users after successful guest login", async () => {
    const persistence = createPersistence()
    const authService = await bootstrapLoggedOut(persistence)

    mockGetGuestToken.mockResolvedValue(validAuthResponse)
    mockVerifyUser.mockResolvedValue(validTokenClaimResponse)
    mockCreateGuestUser.mockResolvedValue(validGuestCreateResponse)
    mockVerifySelf.mockResolvedValue(guestUser)

    await authService.loginGuest({
      displayName: "Guest Example",
      email: "guest@example.com",
    })

    expect(persistence.saveStoredUser).toHaveBeenCalledWith(guestUser)
  })

  test("clears stored user data after successful logout", async () => {
    const persistence = createPersistence()
    const authService = createAuthService({
      initialUser: verifiedUser,
      persistence,
    })

    mockDeleteAuth.mockResolvedValue(validLogoutResponse)

    await authService.logout()

    expect(persistence.clearStoredUser).toHaveBeenCalledTimes(1)
  })

  test("does not save a new stored user after failed login", async () => {
    const persistence = createPersistence()
    const authService = await bootstrapLoggedOut(persistence)

    mockPostAuth.mockRejectedValue({
      status: 401,
      ok: false,
      statusText: "Unauthorized",
      body: "Bad credentials",
    })

    await authService.login({ userId: "alice", password: "wrong-password" })

    expect(persistence.saveStoredUser).not.toHaveBeenCalled()
  })

  test("uses persisted guest identity when guest command input omits storedGuest", async () => {
    const persistence = createPersistence({ storedGuest: persistedGuest })
    const authService = await bootstrapLoggedOut(persistence)

    mockPostAuth.mockResolvedValue(validAuthResponse)
    mockVerifyUser.mockResolvedValue(validTokenClaimResponse)
    mockVerifySelf.mockResolvedValue(guestUser)

    await authService.loginGuest({
      displayName: "Guest Example",
      email: "guest@example.com",
    })

    expect(persistence.loadStoredGuestIdentity).toHaveBeenCalledTimes(1)
    expect(mockPostAuth).toHaveBeenCalledWith(
      guestUser.id,
      "stored-guest-challenge"
    )
  })

  test("prefers explicit storedGuest input over persisted guest identity", async () => {
    const persistence = createPersistence({ storedGuest: persistedGuest })
    const authService = await bootstrapLoggedOut(persistence)

    mockPostAuth.mockResolvedValue(validAuthResponse)
    mockVerifyUser.mockResolvedValue(validTokenClaimResponse)
    mockVerifySelf.mockResolvedValue(guestUser)

    await authService.loginGuest({
      displayName: "Explicit Guest",
      email: "explicit@example.com",
      storedGuest: explicitGuest,
    })

    expect(persistence.loadStoredGuestIdentity).not.toHaveBeenCalled()
    expect(mockPostAuth).toHaveBeenCalledWith(
      guestUser.id,
      "explicit-guest-challenge"
    )
  })
})
