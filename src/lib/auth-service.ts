import type { Readable } from "svelte/store"
import { get, writable } from "svelte/store"
import type { StateValueFrom } from "xstate"
import { loginMachine } from "./login.xstate"
import type { Email, ServerResponse, User, UserId } from "./simple-comment-types"

type LoginMachineStateValue = StateValueFrom<typeof loginMachine>

export type AuthSessionState = LoginMachineStateValue

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

  const sessionStateStore = writable<AuthSessionState>(initialUser ? "loggedIn" : "idle")
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
  }
}
