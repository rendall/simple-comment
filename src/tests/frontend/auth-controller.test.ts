import { createAuthController } from "../../lib/auth/auth-controller"
import type { AuthControllerSnapshot } from "../../lib/auth/auth-controller"
import type { GuestLoginInput, SignupPayload } from "../../lib/auth/auth-types"
import type { AdminSafeUser } from "../../lib/simple-comment-types"
import {
  guestLoginWorkflow,
  loginWorkflow,
  logoutWorkflow,
  signupWorkflow,
  verifySessionWorkflow,
} from "../../lib/auth/auth-workflows"
import {
  readStoredLoginTab,
  writeStoredLoginTab,
  writeStoredSession,
} from "../../lib/auth/auth-storage"
import { publishAuthSnapshot } from "../../lib/auth/auth-stores"

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

jest.mock("../../lib/auth/auth-stores", () => ({
  publishAuthSnapshot: jest.fn(),
}))

const mockVerifySessionWorkflow = jest.mocked(verifySessionWorkflow)
const mockLoginWorkflow = jest.mocked(loginWorkflow)
const mockSignupWorkflow = jest.mocked(signupWorkflow)
const mockGuestLoginWorkflow = jest.mocked(guestLoginWorkflow)
const mockLogoutWorkflow = jest.mocked(logoutWorkflow)
const mockReadStoredLoginTab = jest.mocked(readStoredLoginTab)
const mockWriteStoredLoginTab = jest.mocked(writeStoredLoginTab)
const mockWriteStoredSession = jest.mocked(writeStoredSession)
const mockPublishAuthSnapshot = jest.mocked(publishAuthSnapshot)

const existingUser: AdminSafeUser = {
  id: "test-user",
  name: "Test User",
  email: "test@example.com",
  isAdmin: false,
  isVerified: true,
  challenge: "secret",
}

const signupInput: SignupPayload = {
  id: "new-user",
  name: "New User",
  email: "new-user@example.com",
  password: "sup3r-secret",
}

const guestInput: GuestLoginInput = {
  name: "Guest User",
  email: "guest@example.com",
}

const waitForSnapshot = async (
  controller: ReturnType<typeof createAuthController>,
  predicate: (snapshot: AuthControllerSnapshot) => boolean,
  iterations = 30
) => {
  for (let attempt = 0; attempt < iterations; attempt += 1) {
    const snapshot = controller.getSnapshot()
    if (predicate(snapshot)) return snapshot
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  throw new Error("Timed out waiting for auth controller state")
}

describe("auth-controller", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReadStoredLoginTab.mockReturnValue("guest")
  })

  test("verifies an existing session during init", async () => {
    mockVerifySessionWorkflow.mockResolvedValue({ ok: true, data: existingUser })

    const controller = createAuthController()

    await controller.init()
    const snapshot = await waitForSnapshot(
      controller,
      nextSnapshot => nextSnapshot.state === "loggedIn"
    )

    expect(snapshot.currentUser).toEqual(existingUser)
    expect(mockVerifySessionWorkflow).toHaveBeenCalledTimes(1)
    expect(mockWriteStoredSession).toHaveBeenCalledWith({ user: existingUser })
    expect(mockPublishAuthSnapshot).toHaveBeenCalled()

    controller.destroy()
  })

  test("treats a verify 401 as first visit and lands in loggedOut", async () => {
    mockVerifySessionWorkflow.mockResolvedValue({
      ok: false,
      error: "Unauthorized",
      code: 401,
    })

    const controller = createAuthController()

    await controller.init()
    const snapshot = await waitForSnapshot(
      controller,
      nextSnapshot => nextSnapshot.state === "loggedOut"
    )

    expect(snapshot.currentUser).toBeUndefined()
    expect(mockVerifySessionWorkflow).toHaveBeenCalledTimes(1)
    expect(mockWriteStoredSession).not.toHaveBeenCalled()

    controller.destroy()
  })

  test("maps verify failures into the controller error state", async () => {
    mockVerifySessionWorkflow.mockResolvedValue({
      ok: false,
      error: "Verify failed",
    })

    const controller = createAuthController()

    await controller.init()
    const snapshot = await waitForSnapshot(
      controller,
      nextSnapshot => nextSnapshot.state === "error"
    )

    expect(snapshot.error).toBe("Verify failed")
    expect(snapshot.state).toBe("error")

    controller.destroy()
  })

  test("runs login workflow and re-verifies the user", async () => {
    mockVerifySessionWorkflow
      .mockResolvedValueOnce({
        ok: false,
        error: "Unauthorized",
        code: 401,
      })
      .mockResolvedValueOnce({ ok: true, data: existingUser })
    mockLoginWorkflow.mockResolvedValue({
      ok: true,
      data: { authenticated: true },
    })

    const controller = createAuthController()

    await controller.init()
    await waitForSnapshot(controller, snapshot => snapshot.state === "loggedOut")
    await controller.login({ username: "test-user", password: "secret" })
    const snapshot = await waitForSnapshot(
      controller,
      nextSnapshot => nextSnapshot.state === "loggedIn"
    )

    expect(mockLoginWorkflow).toHaveBeenCalledWith({
      username: "test-user",
      password: "secret",
    })
    expect(snapshot.currentUser).toEqual(existingUser)

    controller.destroy()
  })

  test("runs signup workflow and logs in with the created credentials", async () => {
    mockVerifySessionWorkflow
      .mockResolvedValueOnce({
        ok: false,
        error: "Unauthorized",
        code: 401,
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { ...existingUser, id: signupInput.id, email: signupInput.email },
      })
    mockSignupWorkflow.mockResolvedValue({ ok: true, data: signupInput })
    mockLoginWorkflow.mockResolvedValue({
      ok: true,
      data: { authenticated: true },
    })

    const controller = createAuthController()

    await controller.init()
    await waitForSnapshot(controller, snapshot => snapshot.state === "loggedOut")
    await controller.signup(signupInput)
    const snapshot = await waitForSnapshot(
      controller,
      nextSnapshot => nextSnapshot.state === "loggedIn"
    )

    expect(mockSignupWorkflow).toHaveBeenCalledWith(signupInput)
    expect(mockLoginWorkflow).toHaveBeenCalledWith({
      username: signupInput.id,
      password: signupInput.password,
    })
    expect(snapshot.currentUser).toEqual({
      ...existingUser,
      id: signupInput.id,
      email: signupInput.email,
    })

    controller.destroy()
  })

  test("runs guest login workflow and re-verifies the user", async () => {
    mockVerifySessionWorkflow
      .mockResolvedValueOnce({
        ok: false,
        error: "Unauthorized",
        code: 401,
      })
      .mockResolvedValueOnce({ ok: true, data: existingUser })
    mockGuestLoginWorkflow.mockResolvedValue({
      ok: true,
      data: { authenticated: true },
    })

    const controller = createAuthController()

    await controller.init()
    await waitForSnapshot(controller, snapshot => snapshot.state === "loggedOut")
    await controller.guestLogin(guestInput)
    const snapshot = await waitForSnapshot(
      controller,
      nextSnapshot => nextSnapshot.state === "loggedIn"
    )

    expect(mockGuestLoginWorkflow).toHaveBeenCalledWith(guestInput)
    expect(snapshot.currentUser).toEqual(existingUser)

    controller.destroy()
  })

  test("runs logout workflow and clears the current user", async () => {
    mockLogoutWorkflow.mockResolvedValue({
      ok: true,
      data: { loggedOut: true },
    })

    const controller = createAuthController({ initialUser: existingUser })

    await controller.init()
    await waitForSnapshot(controller, snapshot => snapshot.state === "loggedIn")
    await controller.logout()
    const snapshot = await waitForSnapshot(
      controller,
      nextSnapshot => nextSnapshot.state === "loggedOut"
    )

    expect(mockLogoutWorkflow).toHaveBeenCalledTimes(1)
    expect(snapshot.currentUser).toBeUndefined()

    controller.destroy()
  })

  test("persists selected tab through the controller boundary", () => {
    const controller = createAuthController()

    controller.setTab("signup")

    expect(controller.getSnapshot().uiTab).toBe("signup")
    expect(mockWriteStoredLoginTab).toHaveBeenCalledWith("signup")
  })
})
