import { get } from "svelte/store"
import { currentUserStore, loginStateStore } from "../../lib/auth/auth-stores"
import type { AdminSafeUser } from "../../lib/simple-comment-types"
import { verifySessionWorkflow } from "../../lib/auth/auth-workflows"
import { readStoredLoginTab } from "../../lib/auth/auth-storage"

jest.mock("svelte", () => ({
  getContext: jest.fn(),
  setContext: jest.fn(),
}))

let createAuthRuntime: typeof import("../../lib/auth/auth-runtime").createAuthRuntime

jest.mock("../../lib/auth/auth-workflows", () => ({
  verifySessionWorkflow: jest.fn(),
  loginWorkflow: jest.fn(),
  signupWorkflow: jest.fn(),
  guestLoginWorkflow: jest.fn(),
  logoutWorkflow: jest.fn(),
  toAuthWorkflowError: jest.fn(error =>
    typeof error === "string"
      ? { error }
      : { error: error instanceof Error ? error.message : "Unknown workflow error" }
  ),
}))

jest.mock("../../lib/auth/auth-storage", () => ({
  readStoredLoginTab: jest.fn(),
  writeStoredLoginTab: jest.fn(),
  writeStoredSession: jest.fn(),
}))

const mockVerifySessionWorkflow = jest.mocked(verifySessionWorkflow)
const mockReadStoredLoginTab = jest.mocked(readStoredLoginTab)

const verifiedUser: AdminSafeUser = {
  id: "runtime-user",
  name: "Runtime User",
  email: "runtime@example.com",
  isAdmin: false,
  isVerified: true,
  challenge: "challenge",
}

const resetPublishedAuthStores = () => {
  currentUserStore.set(undefined)
  loginStateStore.set({
    state: undefined,
    nextEvents: undefined,
    select: undefined,
  })
}

const waitFor = async (
  predicate: () => boolean,
  iterations = 30
): Promise<void> => {
  for (let attempt = 0; attempt < iterations; attempt += 1) {
    if (predicate()) return
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  throw new Error("Timed out waiting for runtime state")
}

describe("auth-runtime", () => {
  beforeAll(async () => {
    ;({ createAuthRuntime } = await import("../../lib/auth/auth-runtime"))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockReadStoredLoginTab.mockReturnValue("guest")
    resetPublishedAuthStores()
  })

  afterEach(() => {
    resetPublishedAuthStores()
  })

  test("restores auth state when the runtime starts without Login.svelte mounted", async () => {
    mockVerifySessionWorkflow.mockResolvedValue({
      ok: true,
      data: verifiedUser,
    })

    const runtime = createAuthRuntime()

    await runtime.start()
    await waitFor(() => get(loginStateStore).state === "loggedIn")

    expect(get(currentUserStore)).toEqual(verifiedUser)
    expect(get(loginStateStore).state).toBe("loggedIn")
    expect(mockVerifySessionWorkflow).toHaveBeenCalledTimes(1)

    runtime.stop()
  })
})
