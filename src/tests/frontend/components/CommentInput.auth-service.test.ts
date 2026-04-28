import { fireEvent, render, screen, waitFor } from "@testing-library/svelte"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import type { Writable } from "svelte/store"
import { readable, writable } from "svelte/store"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { getOneUser, postComment } from "../../../apiClient"
import CommentInput from "../../../components/CommentInput.svelte"
import type {
  AuthOutcomeState,
  AuthRequestState,
  AuthRuntimeSnapshot,
  AuthService,
  AuthSessionState,
} from "../../../lib/auth-service"
import type {
  Comment,
  ServerResponse,
  User,
} from "../../../lib/simple-comment-types"

vi.mock("../../../apiClient", () => ({
  getOneUser: vi.fn(),
  postComment: vi.fn(),
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

type AuthServiceStub = AuthService & {
  authOutcomeStore: Writable<AuthOutcomeState>
  authRequestStore: Writable<AuthRequestState>
}

const mockPostComment = vi.mocked(postComment)
const mockGetOneUser = vi.mocked(getOneUser)

const defaultUser: User = {
  id: "alice-user",
  name: "Alice Example",
  email: "alice@example.com",
}

const postedComment: Comment = {
  id: "comment-1",
  parentId: "topic-1",
  text: "Hello from the tests",
  userId: "alice-user",
  user: defaultUser,
  dateCreated: new Date("2026-01-01T00:00:00.000Z"),
}

const validPostCommentResponse: ServerResponse<Comment> = {
  status: 201,
  ok: true,
  statusText: "Created",
  body: postedComment,
}

const createAuthServiceStub = (): AuthServiceStub => {
  const authOutcomeStore = writable<AuthOutcomeState>({ status: "none" })
  const authRequestStore = writable<AuthRequestState>({ status: "idle" })

  return {
    sessionState: readable<AuthSessionState>("loggedOut"),
    currentUser: readable(undefined),
    authRequest: { subscribe: authRequestStore.subscribe },
    authOutcome: { subscribe: authOutcomeStore.subscribe },
    authRuntimeSnapshot: readable<AuthRuntimeSnapshot>({
      state: "loggedOut",
      nextEvents: ["LOGIN", "SIGNUP", "GUEST"],
    }),
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
    authOutcomeStore,
    authRequestStore,
  }
}

const renderCommentInput = ({
  authService = createAuthServiceStub(),
  currentUser,
}: {
  authService?: AuthServiceStub
  currentUser?: User
} = {}) => {
  render(
    CommentInput as never,
    {
      authService,
      commentId: "topic-1",
      currentUser,
    } as never
  )

  return { authService }
}

const submitComment = async (text = "Hello from the tests") => {
  await fireEvent.input(screen.getByPlaceholderText("Your comment"), {
    target: { value: text },
  })
  await fireEvent.click(screen.getByRole("button", { name: "Add comment" }))
}

describe("CommentInput auth-service delegation", () => {
  beforeEach(() => {
    globalThis.ResizeObserver = class ResizeObserver {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    } as never

    Element.prototype.animate =
      Element.prototype.animate ??
      vi.fn(() => ({ cancel: vi.fn(), finished: Promise.resolve() }) as never)
    mockGetOneUser.mockResolvedValue({ ok: true, body: defaultUser } as never)
    mockPostComment.mockResolvedValue(validPostCommentResponse)
  })

  test("requests auth through authService for unauthenticated comment submit", async () => {
    const { authService } = renderCommentInput()

    await submitComment()

    await waitFor(() => {
      expect(authService.requestAuth).toHaveBeenCalledWith("comment-submit")
    })
  })

  test("continues posting after matching auth success outcome", async () => {
    const { authService } = renderCommentInput()

    await submitComment()
    await waitFor(() => {
      expect(authService.requestAuth).toHaveBeenCalledWith("comment-submit")
    })

    authService.authOutcomeStore.set({
      status: "success",
      user: defaultUser,
      requestId: "request-1",
    })

    await waitFor(() => {
      expect(mockPostComment).toHaveBeenCalledWith(
        "topic-1",
        "Hello from the tests"
      )
    })
  })

  test("leaves processing state after matching auth failure outcome", async () => {
    const { authService } = renderCommentInput()

    await submitComment()
    await waitFor(() => {
      expect(authService.requestAuth).toHaveBeenCalledWith("comment-submit")
    })

    authService.authOutcomeStore.set({
      status: "remoteError",
      error: "Login error",
      requestId: "request-1",
    })

    await waitFor(() => {
      expect(document.querySelector("form.comment-form")).not.toHaveClass(
        "is-hidden"
      )
    })
  })

  test("preserves selected-tab dependent button copy", async () => {
    renderCommentInput()

    await fireEvent.click(await screen.findByRole("button", { name: "Login" }))

    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument()
  })

  test("posts immediately for already authenticated users", async () => {
    const { authService } = renderCommentInput({ currentUser: defaultUser })

    await submitComment()

    await waitFor(() => {
      expect(mockPostComment).toHaveBeenCalledWith(
        "topic-1",
        "Hello from the tests"
      )
    })
    expect(authService.requestAuth).not.toHaveBeenCalled()
  })

  test("does not import legacy login relay stores", () => {
    const commentInputSource = readFileSync(
      resolve(process.cwd(), "src/components/CommentInput.svelte"),
      "utf8"
    )

    expect(commentInputSource).not.toMatch(/\bdispatchableStore\b/)
    expect(commentInputSource).not.toMatch(/\bloginStateStore\b/)
  })
})
