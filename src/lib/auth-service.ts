/**
 * Widget-scoped auth service for Simple Comment.
 *
 * This module owns the live auth machine/runtime instance and the auth API
 * side effects for a single mounted widget. It exposes the auth session state,
 * current user, auth request state, and auth request outcome as a single
 * shared boundary for auth-aware components.
 *
 * `Login.svelte` uses this service to submit login, signup, guest-login, and
 * logout commands while retaining ownership of form-local field state and
 * field-level validation UI. `CommentInput.svelte` and reply flows use this
 * service to request authentication and observe request-scoped outcomes
 * without depending on `Login.svelte` mount timing or component-mediated side
 * effects. `SelfDisplay.svelte` uses this service to read the authenticated
 * user and trigger logout.
 *
 * The auth session lifecycle vocabulary comes from `login.xstate.ts`, which
 * remains the source of truth for auth machine states and transitions. This
 * service interprets that machine, publishes readable session state derived
 * from it, and keeps request bookkeeping separate from machine lifecycle
 * state so callers can distinguish auth session status from the outcome of a
 * specific auth request.
 */
import type { Readable } from "svelte/store"
import { get, writable } from "svelte/store"
import type { StateValueFrom } from "xstate"
import { loginMachine } from "./login.xstate"
import type { Email, ServerResponse, User, UserId } from "./simple-comment-types"

type LoginMachineState = StateValueFrom<typeof loginMachine>

export type AuthSessionState = LoginMachineState

export type AuthRequestReason =
  | "comment-submit"
  | "reply-submit"
  | "manual-login"

export type AuthRequestState =
  | { status: "idle" }
  | {
    status: "pending"
    reason: AuthRequestReason
    requestId: string
  }

export type AuthOutcomeState =
  | { status: "none" }
  | {
    status: "localValidationError"
    message: string
    requestId: string
  }
  | {
    status: "remoteError"
    error: ServerResponse | string
    requestId: string
  }
  | {
    status: "success"
    user: User
    requestId: string
  }
  | {
    status: "cancelled"
    requestId: string
  }

type PendingAuthRequest = Extract<AuthRequestState, { status: "pending" }>
type ActiveAuthOutcome = Exclude<AuthOutcomeState, { status: "none" }>

export type LoginPayload = {
  userId: UserId
  password: string
}

export type SignupPayload = {
  userId: UserId
  password: string
  displayName: string
  email: Email
}

export type GuestLoginPayload = {
  displayName: string
  email: Email
}

export type ReportLocalValidationErrorInput = {
  message: string
  requestId?: string
}

export type CreateAuthServiceOptions = {
  initialUser?: User
}

export type AuthService = {
  sessionState: Readable<AuthSessionState>
  currentUser: Readable<User | undefined>
  authRequest: Readable<AuthRequestState>
  authOutcome: Readable<AuthOutcomeState>
  init: () => Promise<void>
  requestAuth: (reason: AuthRequestReason) => { requestId: string }
  clearAuthOutcome: (requestId?: string) => void
  cancelAuthRequest: (requestId?: string) => void
  reportLocalValidationError: (
    input: ReportLocalValidationErrorInput
  ) => void
  login: (payload: LoginPayload) => Promise<void>
  signup: (payload: SignupPayload) => Promise<void>
  loginGuest: (payload: GuestLoginPayload) => Promise<void>
  logout: () => Promise<void>
  destroy: () => void
}

const notImplemented = async (methodName: string): Promise<never> => {
  throw new Error(
    `auth-service scaffold method '${methodName}' is not implemented`
  )
}

const matchesRequestId = (
  value: { requestId: string },
  requestId?: string
): boolean => requestId === undefined || value.requestId === requestId

export const createAuthService = (
  options: CreateAuthServiceOptions = {}
): AuthService => {
  const { initialUser } = options

  let requestSequence = 0

  const initialLoginState = loginMachine.initialState.value

  if (typeof initialLoginState !== "string") {
    throw new Error("Expected a flat login machine state")
  }

  const sessionStateStore = writable<AuthSessionState>(
    initialUser ? "loggedIn" : (initialLoginState as AuthSessionState)
  )
  const currentUserStore = writable<User | undefined>(initialUser)
  const authRequestStore = writable<AuthRequestState>({ status: "idle" })
  const authOutcomeStore = writable<AuthOutcomeState>({ status: "none" })

  const getPendingRequest = (): PendingAuthRequest | undefined => {
    const activeRequest = get(authRequestStore)

    if (activeRequest.status !== "pending") return undefined
    return activeRequest
  }

  const getActiveOutcome = (): ActiveAuthOutcome | undefined => {
    const activeOutcome = get(authOutcomeStore)

    if (activeOutcome.status === "none") return undefined
    return activeOutcome
  }

  const requestAuth = (reason: AuthRequestReason): { requestId: string } => {
    requestSequence += 1

    const requestId = `auth-request-${requestSequence}`

    authOutcomeStore.set({ status: "none" })
    authRequestStore.set({
      status: "pending",
      reason,
      requestId,
    })

    return { requestId }
  }

  const clearAuthOutcome = (requestId?: string): void => {
    const activeOutcome = getActiveOutcome()

    if (activeOutcome && !matchesRequestId(activeOutcome, requestId)) return
    authOutcomeStore.set({ status: "none" })
  }

  const cancelAuthRequest = (requestId?: string): void => {
    const activeRequest = getPendingRequest()

    if (!activeRequest || !matchesRequestId(activeRequest, requestId)) return

    authRequestStore.set({ status: "idle" })
    authOutcomeStore.set({
      status: "cancelled",
      requestId: activeRequest.requestId,
    })
  }

  const reportLocalValidationError = ({
    message,
    requestId,
  }: ReportLocalValidationErrorInput): void => {
    const activeRequest = getPendingRequest()

    if (!activeRequest || !matchesRequestId(activeRequest, requestId)) return

    authRequestStore.set({ status: "idle" })
    authOutcomeStore.set({
      status: "localValidationError",
      message,
      requestId: activeRequest.requestId,
    })
  }

  return {
    sessionState: {
      subscribe: sessionStateStore.subscribe,
    },
    currentUser: {
      subscribe: currentUserStore.subscribe,
    },
    authRequest: {
      subscribe: authRequestStore.subscribe,
    },
    authOutcome: {
      subscribe: authOutcomeStore.subscribe,
    },
    init: async () => {
      sessionStateStore.set("verifying")
      sessionStateStore.set(initialUser ? "loggedIn" : "loggedOut")
    },
    requestAuth,
    clearAuthOutcome,
    cancelAuthRequest,
    reportLocalValidationError,
    login: async payload => {
      void payload
      return notImplemented("login")
    },
    signup: async payload => {
      void payload
      return notImplemented("signup")
    },
    loginGuest: async payload => {
      void payload
      return notImplemented("loginGuest")
    },
    logout: async () => {
      return notImplemented("logout")
    },
    destroy: () => { },
  }
}
