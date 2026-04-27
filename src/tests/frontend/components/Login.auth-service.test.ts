import { fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import type { Writable } from "svelte/store"
import { readable, writable } from "svelte/store"
import { beforeEach, describe, expect, test, vi } from "vitest"
import {
  createGuestUser,
  createUser,
  deleteAuth,
  getGuestToken,
  postAuth,
  updateUser,
  verifySelf,
  verifyUser,
} from "../../../apiClient"
import Login from "../../../components/Login.svelte"
import type {
  AuthService,
  AuthSessionState,
} from "../../../lib/auth-service"
import type { User } from "../../../lib/simple-comment-types"

vi.mock("../../../apiClient", () => ({
  createGuestUser: vi.fn(),
  createUser: vi.fn(),
  deleteAuth: vi.fn(),
  getGuestToken: vi.fn(),
  getOneUser: vi.fn(),
  postAuth: vi.fn(),
  updateUser: vi.fn(),
  verifySelf: vi.fn(),
  verifyUser: vi.fn(),
}))

vi.mock("../../../frontend-utilities", async importOriginal => {
  const actual =
    await importOriginal<typeof import("../../../frontend-utilities")>()

  return {
    ...actual,
    idIconDataUrl: vi.fn(
      () =>
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    ),
  }
})

type AuthRuntimeSnapshot = {
  state: AuthSessionState
  nextEvents: string[]
  error?: unknown
}

type AuthServiceUnderTest = AuthService & {
  authRuntimeSnapshot: Writable<AuthRuntimeSnapshot>
}

const mockVerifySelf = vi.mocked(verifySelf)
const mockPostAuth = vi.mocked(postAuth)
const mockCreateUser = vi.mocked(createUser)
const mockDeleteAuth = vi.mocked(deleteAuth)
const mockGetGuestToken = vi.mocked(getGuestToken)
const mockCreateGuestUser = vi.mocked(createGuestUser)
const mockUpdateUser = vi.mocked(updateUser)
const mockVerifyUser = vi.mocked(verifyUser)

const defaultUser: User = {
  id: "alice-user",
  name: "Alice Example",
  email: "alice@example.com",
}

const createAuthServiceStub = ({
  currentUser,
  snapshot = { state: "loggedOut", nextEvents: ["LOGIN", "SIGNUP", "GUEST"] },
}: {
  currentUser?: User
  snapshot?: AuthRuntimeSnapshot
} = {}): AuthServiceUnderTest => ({
  sessionState: readable(snapshot.state),
  currentUser: readable(currentUser),
  authRequest: readable({ status: "idle" }),
  authOutcome: readable({ status: "none" }),
  authRuntimeSnapshot: writable(snapshot),
  init: vi.fn().mockResolvedValue(undefined),
  requestAuth: vi.fn(() => ({ requestId: "request-1" })),
  clearAuthOutcome: vi.fn(),
  cancelAuthRequest: vi.fn(),
  reportLocalValidationError: vi.fn(),
  login: vi.fn().mockResolvedValue(undefined),
  signup: vi.fn().mockResolvedValue(undefined),
  loginGuest: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn(),
})

const renderLogin = ({
  authService = createAuthServiceStub(),
  currentUser,
}: {
  authService?: AuthServiceUnderTest
  currentUser?: User
} = {}) => {
  render(Login as never, {
    props: {
      authService,
      currentUser,
    },
  })

  return { authService }
}

const submitForm = async (selector: string): Promise<void> => {
  const form = document.querySelector(selector)

  expect(form).toBeInTheDocument()
  await fireEvent.submit(form as HTMLFormElement)
}

describe("Login auth-service delegation", () => {
  beforeEach(() => {
    Element.prototype.animate =
      Element.prototype.animate ??
      vi.fn(() => ({ cancel: vi.fn(), finished: Promise.resolve() }) as never)
    mockVerifySelf.mockRejectedValue({ status: 401 })
    mockPostAuth.mockResolvedValue({ ok: true } as never)
    mockCreateUser.mockResolvedValue({ ok: true } as never)
    mockDeleteAuth.mockResolvedValue({ ok: true } as never)
    mockGetGuestToken.mockResolvedValue({ ok: true } as never)
    mockCreateGuestUser.mockResolvedValue({ ok: true } as never)
    mockUpdateUser.mockResolvedValue({ ok: true } as never)
    mockVerifyUser.mockResolvedValue({ ok: true } as never)
  })

  test("delegates mount initialization through authService.init", async () => {
    const { authService } = renderLogin()

    await waitFor(() => {
      expect(authService.init).toHaveBeenCalledTimes(1)
    })
    expect(mockVerifySelf).not.toHaveBeenCalled()
  })

  test("delegates valid login submissions to authService.login", async () => {
    const { authService } = renderLogin()

    await fireEvent.click(await screen.findByRole("button", { name: "Login" }))
    await fireEvent.input(screen.getByLabelText("User handle"), {
      target: { value: "alice-user" },
    })
    await fireEvent.input(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    })
    await submitForm("#user-login-form")

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        userId: "alice-user",
        password: "secret",
      })
    })
    expect(mockPostAuth).not.toHaveBeenCalled()
  })

  test("delegates valid signup submissions to authService.signup", async () => {
    const { authService } = renderLogin()

    await fireEvent.click(
      await screen.findByRole("button", { name: "Signup" })
    )
    await fireEvent.input(screen.getByLabelText("Display name"), {
      target: { value: "Alice Example" },
    })
    await fireEvent.input(screen.getByLabelText("User handle"), {
      target: { value: "alice-user" },
    })
    await fireEvent.input(screen.getByLabelText("Email"), {
      target: { value: "alice@example.com" },
    })
    await fireEvent.input(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    })
    await fireEvent.input(screen.getByLabelText("Confirm password"), {
      target: { value: "secret" },
    })
    await submitForm("#signup-form")

    await waitFor(() => {
      expect(authService.signup).toHaveBeenCalledWith({
        userId: "alice-user",
        password: "secret",
        displayName: "Alice Example",
        email: "alice@example.com",
      })
    })
    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  test("delegates new guest submissions to authService.loginGuest", async () => {
    const { authService } = renderLogin()

    await fireEvent.input(await screen.findByLabelText("Display Name"), {
      target: { value: "Guest Example" },
    })
    await fireEvent.input(screen.getByLabelText("Email"), {
      target: { value: "guest@example.com" },
    })
    await submitForm("#guest-login-form")

    await waitFor(() => {
      expect(authService.loginGuest).toHaveBeenCalledWith({
        displayName: "Guest Example",
        email: "guest@example.com",
      })
    })
    expect(mockGetGuestToken).not.toHaveBeenCalled()
    expect(mockCreateGuestUser).not.toHaveBeenCalled()
  })

  test("passes stored guest identity through guest submissions", async () => {
    const storedGuest = {
      id: "guest-ab123-abc12",
      challenge: "stored-challenge",
      name: "Stored Guest",
      email: "stored@example.com",
    }
    localStorage.setItem("simple_comment_user", JSON.stringify(storedGuest))
    const { authService } = renderLogin()

    await fireEvent.input(await screen.findByLabelText("Display Name"), {
      target: { value: "Updated Guest" },
    })
    await fireEvent.input(screen.getByLabelText("Email"), {
      target: { value: "updated@example.com" },
    })
    await submitForm("#guest-login-form")

    await waitFor(() => {
      expect(authService.loginGuest).toHaveBeenCalledWith({
        displayName: "Updated Guest",
        email: "updated@example.com",
        storedGuest,
      })
    })
    expect(mockGetGuestToken).not.toHaveBeenCalled()
    expect(mockCreateGuestUser).not.toHaveBeenCalled()
  })

  test("keeps login validation local before authService.login", async () => {
    const { authService } = renderLogin()

    await fireEvent.click(await screen.findByRole("button", { name: "Login" }))
    await submitForm("#user-login-form")

    expect(await screen.findByText("User handle is required.")).toBeVisible()
    expect(screen.getByText("Password is required.")).toBeVisible()
    expect(authService.login).not.toHaveBeenCalled()
  })

  test("keeps signup validation local before authService.signup", async () => {
    const { authService } = renderLogin()

    await fireEvent.click(
      await screen.findByRole("button", { name: "Signup" })
    )
    await submitForm("#signup-form")

    expect(await screen.findByText(/Display name is required/)).toBeVisible()
    expect(authService.signup).not.toHaveBeenCalled()
  })

  test("keeps guest validation local before authService.loginGuest", async () => {
    const { authService } = renderLogin()

    await submitForm("#guest-login-form")

    expect(await screen.findByText(/Display name is required/)).toBeVisible()
    expect(authService.loginGuest).not.toHaveBeenCalled()
  })
})
