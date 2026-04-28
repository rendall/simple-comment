import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import type { Writable } from "svelte/store"
import { get, writable } from "svelte/store"
import type { StateValue } from "xstate"
import { createAuthStoreBridge } from "../../lib/auth-store-bridge"
import type {
  AuthRuntimeSnapshot,
  AuthService,
  AuthSessionState,
} from "../../lib/auth-service"
import type { User } from "../../lib/simple-comment-types"

type AuthServiceStub = AuthService & {
  currentUserStore: Writable<User | undefined>
  authRuntimeSnapshotStore: Writable<AuthRuntimeSnapshot>
}

type LegacyLoginState = {
  state?: StateValue
  nextEvents?: string[]
}

const defaultUser: User = {
  id: "alice-user",
  name: "Alice Example",
  email: "alice@example.com",
}

const defaultSnapshot: AuthRuntimeSnapshot = {
  state: "loggedOut",
  nextEvents: ["LOGIN", "SIGNUP", "GUEST"],
}

const createAuthServiceStub = ({
  currentUser,
  snapshot = defaultSnapshot,
}: {
  currentUser?: User
  snapshot?: AuthRuntimeSnapshot
} = {}): AuthServiceStub => {
  const currentUserStore = writable<User | undefined>(currentUser)
  const authRuntimeSnapshotStore = writable<AuthRuntimeSnapshot>(snapshot)

  return {
    sessionState: writable<AuthSessionState>(snapshot.state),
    currentUser: { subscribe: currentUserStore.subscribe },
    authRequest: writable({ status: "idle" }),
    authOutcome: writable({ status: "none" }),
    authRuntimeSnapshot: { subscribe: authRuntimeSnapshotStore.subscribe },
    init: jest.fn(async () => undefined),
    requestAuth: jest.fn(() => ({ requestId: "request-1" })),
    clearAuthOutcome: jest.fn(),
    cancelAuthRequest: jest.fn(),
    reportLocalValidationError: jest.fn(),
    login: jest.fn(async () => undefined),
    signup: jest.fn(async () => undefined),
    loginGuest: jest.fn(async () => undefined),
    logout: jest.fn(async () => undefined),
    destroy: jest.fn(),
    currentUserStore,
    authRuntimeSnapshotStore,
  }
}

const createLegacyStores = () => ({
  currentUserStore: writable<User | undefined>(undefined),
  loginStateStore: writable<LegacyLoginState>({
    state: undefined,
    nextEvents: undefined,
  }),
})

describe("auth store bridge", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("publishes authService.currentUser to currentUserStore", () => {
    const authService = createAuthServiceStub()
    const legacyStores = createLegacyStores()
    const cleanup = createAuthStoreBridge(authService, legacyStores)

    authService.currentUserStore.set(defaultUser)

    expect(get(legacyStores.currentUserStore)).toEqual(defaultUser)

    cleanup()
  })

  test("publishes auth runtime snapshots to loginStateStore", () => {
    const authService = createAuthServiceStub()
    const legacyStores = createLegacyStores()
    const cleanup = createAuthStoreBridge(authService, legacyStores)

    authService.authRuntimeSnapshotStore.set({
      state: "loggedIn",
      nextEvents: ["LOGOUT"],
    })

    expect(get(legacyStores.loginStateStore)).toEqual({
      state: "loggedIn",
      nextEvents: ["LOGOUT"],
    })

    cleanup()
  })

  test("stops publishing service updates after cleanup", () => {
    const authService = createAuthServiceStub()
    const legacyStores = createLegacyStores()
    const cleanup = createAuthStoreBridge(authService, legacyStores)

    cleanup()
    authService.currentUserStore.set(defaultUser)
    authService.authRuntimeSnapshotStore.set({
      state: "loggedIn",
      nextEvents: ["LOGOUT"],
    })

    expect(get(legacyStores.currentUserStore)).toBeUndefined()
    expect(get(legacyStores.loginStateStore)).toEqual({
      state: "loggedOut",
      nextEvents: ["LOGIN", "SIGNUP", "GUEST"],
    })
  })
})
