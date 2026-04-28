import { fireEvent, render, screen } from "@testing-library/svelte"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { readable, writable } from "svelte/store"
import { describe, expect, test, vi } from "vitest"
import SelfDisplay from "../../../components/SelfDisplay.svelte"
import type {
  AuthRuntimeSnapshot,
  AuthService,
  AuthSessionState,
} from "../../../lib/auth-service"
import { dispatchableStore } from "../../../lib/svelte-stores"
import type { User } from "../../../lib/simple-comment-types"

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

const defaultUser: User = {
  id: "alice-user",
  name: "Alice Example",
  email: "alice@example.com",
}

const createAuthServiceStub = (
  snapshot: AuthRuntimeSnapshot = {
    state: "loggedIn",
    nextEvents: ["LOGOUT"],
  }
): AuthService => ({
  sessionState: readable<AuthSessionState>(snapshot.state),
  currentUser: readable(defaultUser),
  authRequest: readable({ status: "idle" }),
  authOutcome: readable({ status: "none" }),
  authRuntimeSnapshot: writable<AuthRuntimeSnapshot>(snapshot),
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

const renderSelfDisplay = ({
  authService = createAuthServiceStub(),
  currentUser = defaultUser,
}: {
  authService?: AuthService
  currentUser?: User
} = {}) => {
  render(
    SelfDisplay as never,
    {
      authService,
      currentUser,
    } as never
  )

  return { authService }
}

describe("SelfDisplay auth-service delegation", () => {
  test("shows logout when authService runtime allows logout", async () => {
    renderSelfDisplay()

    expect(
      await screen.findByRole("button", { name: "Log out" })
    ).toBeInTheDocument()
  })

  test("calls authService.logout directly from the logout button", async () => {
    const dispatchLogoutIntent = vi.spyOn(dispatchableStore, "dispatch")
    const { authService } = renderSelfDisplay()

    await fireEvent.click(
      await screen.findByRole("button", { name: "Log out" })
    )

    expect(authService.logout).toHaveBeenCalledTimes(1)
    expect(dispatchLogoutIntent).not.toHaveBeenCalledWith("logoutIntent")
  })

  test("keeps the skeleton visible while auth runtime is processing", () => {
    renderSelfDisplay({
      authService: createAuthServiceStub({
        state: "loggingOut",
        nextEvents: [],
      }),
    })

    expect(
      document.querySelector("section.skeleton.self-display")
    ).toBeVisible()
  })

  test("does not import legacy logout relay stores", () => {
    const selfDisplaySource = readFileSync(
      resolve(process.cwd(), "src/components/SelfDisplay.svelte"),
      "utf8"
    )

    expect(selfDisplaySource).not.toMatch(/\bdispatchableStore\b/)
    expect(selfDisplaySource).not.toMatch(/\bloginStateStore\b/)
  })
})
