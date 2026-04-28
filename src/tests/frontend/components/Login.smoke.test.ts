import { render, screen, waitFor } from "@testing-library/svelte"
import { readable, writable } from "svelte/store"
import { describe, expect, test, vi } from "vitest"
import Login from "../../../components/Login.svelte"
import type {
  AuthRuntimeSnapshot,
  AuthService,
  AuthSessionState,
} from "../../../lib/auth-service"

const createAuthServiceStub = (): AuthService => ({
  sessionState: readable<AuthSessionState>("loggedOut"),
  currentUser: readable(undefined),
  authRequest: readable({ status: "idle" }),
  authOutcome: readable({ status: "none" }),
  authRuntimeSnapshot: writable<AuthRuntimeSnapshot>({
    state: "loggedOut",
    nextEvents: ["LOGIN", "SIGNUP", "GUEST"],
  }),
  init: vi.fn().mockResolvedValue(undefined),
  requestAuth: vi.fn(() => ({ requestId: "auth-request-1" })),
  clearAuthOutcome: vi.fn(),
  cancelAuthRequest: vi.fn(),
  reportLocalValidationError: vi.fn(),
  login: vi.fn().mockResolvedValue(undefined),
  signup: vi.fn().mockResolvedValue(undefined),
  loginGuest: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn(),
})

describe("Login smoke", () => {
  test("renders the login, signup, and guest tabs", async () => {
    const authService = createAuthServiceStub()

    render(Login as never, { authService } as never)

    expect(
      await screen.findByRole("button", {
        name: "Login",
      })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Signup" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guest" })).toBeInTheDocument()

    await waitFor(() => {
      expect(authService.init).toHaveBeenCalledTimes(1)
      expect(
        document.querySelector("section.simple-comment-login")
      ).not.toHaveClass("is-loading")
    })
  })
})
