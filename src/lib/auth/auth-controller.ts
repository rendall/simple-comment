import { interpret } from "xstate"
import type { User } from "../simple-comment-types"
import {
  loginMachine,
  type LoginMachineContext,
  type LoginMachineState,
} from "../login.xstate"
import {
  readStoredLoginTab,
  type StoredLoginTab,
  writeStoredLoginTab,
  writeStoredSession,
} from "./auth-storage"
import { publishAuthSnapshot } from "./auth-stores"
import {
  guestLoginWorkflow,
  loginWorkflow,
  logoutWorkflow,
  signupWorkflow,
  toAuthWorkflowError,
  verifySessionWorkflow,
} from "./auth-workflows"
import type { GuestLoginInput, SignupPayload } from "./auth-types"

export type AuthControllerSnapshot = {
  state: LoginMachineState
  context: LoginMachineContext
  uiTab: StoredLoginTab
  nextEvents: string[]
  currentUser?: User
  authUiRequest?: AuthUiRequest
  message?: string
  error?: string
}

export type AuthUiRequest = {
  id: number
  preferredTab?: StoredLoginTab
  reason?: "comment-submit" | "reply-submit" | "manual"
}

/**
 * The non-visual auth boundary for a mounted Simple Comment widget.
 *
 * This controller owns the auth lifecycle: session verification, 
 * login, signup, guest login, logout, selected auth-tab persistence, and 
 * the small amount of cross-component auth UI coordination needed by
 * the comment flows.
 *
 * Internally it interprets `loginMachine`, runs the matching workflow for each
 * machine state transition, persists the relevant auth state, and publishes a
 * normalized snapshot for the current widget runtime.
 *
 * UI components are expected to consume it in two ways:
 * - subscribe to snapshots for read-side state such as the current user,
 *   selected tab, next events, and error state
 * - call its command methods to request auth work instead of talking directly
 *   to other components or to the underlying workflows
 */
export type AuthController = {
  subscribe(run: (snapshot: AuthControllerSnapshot) => void): () => void
  getSnapshot(): AuthControllerSnapshot
  init(): Promise<void>
  login(input: { username: string; password: string }): Promise<void>
  signup(input: SignupPayload): Promise<void>
  guestLogin(input: GuestLoginInput): Promise<void>
  logout(): Promise<void>
  setTab(tab: StoredLoginTab): void
  requestAuthUi(input?: Omit<AuthUiRequest, "id">): void
  clearAuthUiRequest(): void
  reset(): void
  destroy(): void
}

export type AuthControllerDeps = {
  initialUser?: User
}

export const createAuthController = (
  deps: AuthControllerDeps = {}
): AuthController => {
  const service = interpret(loginMachine)
  const listeners = new Set<(snapshot: AuthControllerSnapshot) => void>()

  let initialized = false
  let previousStateValue: LoginMachineState | undefined
  let pendingLoginInput: { username: string; password: string } | undefined
  let pendingSignupInput: SignupPayload | undefined
  let pendingGuestInput: GuestLoginInput | undefined
  let authUiRequestId = 0

  let snapshot: AuthControllerSnapshot = {
    state: loginMachine.initialState.value as LoginMachineState,
    context: loginMachine.initialState.context,
    uiTab: readStoredLoginTab(),
    nextEvents: loginMachine.initialState.nextEvents ?? [],
    currentUser: deps.initialUser,
    error: undefined,
  }

  const publish = () => {
    publishAuthSnapshot(snapshot)
    listeners.forEach(listener => listener(snapshot))
  }

  const updateSnapshot = (updates: Partial<AuthControllerSnapshot>) => {
    snapshot = { ...snapshot, ...updates }
    publish()
  }

  const syncSnapshotFromService = () => {
    const stateValue = service.state.value as LoginMachineState
    const context = service.state.context
    const error =
      stateValue === "error" && context.error
        ? typeof context.error === "string"
          ? context.error
          : toAuthWorkflowError(context.error).error
        : undefined

    updateSnapshot({
      state: stateValue,
      context,
      nextEvents: service.state.nextEvents ?? [],
      error,
    })
  }

  const runStateEffect = async (stateValue: LoginMachineState) => {
    switch (stateValue) {
      case "verifying": {
        if (snapshot.currentUser) {
          service.send("SUCCESS")
          return
        }

        const result = await verifySessionWorkflow()
        if (result.ok) {
          updateSnapshot({ currentUser: result.data })
          writeStoredSession({ user: result.data })
          service.send("SUCCESS")
        } else if (result.code === 401) service.send("FIRST_VISIT")
        else service.send({ type: "ERROR", error: result.error })
        break
      }

      case "loggingIn": {
        if (!pendingLoginInput) {
          service.send({
            type: "ERROR",
            error: "Login attempt missing credentials.",
          })
          return
        }

        const result = await loginWorkflow(pendingLoginInput)
        if (result.ok) service.send("SUCCESS")
        else service.send({ type: "ERROR", error: result.error })
        break
      }

      case "signingUp": {
        if (!pendingSignupInput) {
          service.send({
            type: "ERROR",
            error: "Signup attempt missing user information.",
          })
          return
        }

        const result = await signupWorkflow(pendingSignupInput)
        if (result.ok) service.send("SUCCESS")
        else service.send({ type: "ERROR", error: result.error })
        break
      }

      case "guestLoggingIn": {
        if (!pendingGuestInput) {
          service.send({
            type: "ERROR",
            error: "Guest login attempt missing user information.",
          })
          return
        }

        const result = await guestLoginWorkflow(pendingGuestInput)
        if (result.ok) service.send("SUCCESS")
        else service.send({ type: "ERROR", error: result.error })
        break
      }

      case "loggingOut": {
        const result = await logoutWorkflow()
        if (result.ok) service.send("SUCCESS")
        else service.send({ type: "ERROR", error: result.error })
        break
      }

      case "loggedOut":
        updateSnapshot({ currentUser: undefined })
        break

      default:
        break
    }
  }

  service.onTransition(state => {
    syncSnapshotFromService()

    const stateValue = state.value as LoginMachineState
    const isInitialTransition = previousStateValue === undefined
    const hasStateChanged = previousStateValue !== stateValue
    previousStateValue = stateValue

    if (isInitialTransition || hasStateChanged) {
      void runStateEffect(stateValue)
    }
  })

  const init = async () => {
    if (initialized) return

    initialized = true
    service.start()
  }

  const sendResetIfNeeded = () => {
    if (service.state.value === "error") {
      service.send("RESET")
      return true
    }

    return false
  }

  return {
    subscribe(run) {
      listeners.add(run)
      run(snapshot)

      return () => {
        listeners.delete(run)
      }
    },
    getSnapshot() {
      return snapshot
    },
    async init() {
      await init()
    },
    async login(input) {
      await init()
      pendingLoginInput = input
      if (sendResetIfNeeded()) return
      service.send("LOGIN")
    },
    async signup(input) {
      await init()
      pendingSignupInput = input
      pendingLoginInput = {
        username: input.id,
        password: input.password,
      }
      if (sendResetIfNeeded()) return
      service.send("SIGNUP")
    },
    async guestLogin(input) {
      await init()
      pendingGuestInput = input
      if (sendResetIfNeeded()) return
      service.send({ type: "GUEST", guest: input })
    },
    async logout() {
      await init()
      if (sendResetIfNeeded()) return
      service.send("LOGOUT")
    },
    setTab(tab) {
      writeStoredLoginTab(tab)
      updateSnapshot({ uiTab: tab })
    },
    requestAuthUi(input = {}) {
      authUiRequestId += 1

      const nextRequest: AuthUiRequest = {
        id: authUiRequestId,
        ...input,
      }

      const updates: Partial<AuthControllerSnapshot> = {
        authUiRequest: nextRequest,
      }

      if (input.preferredTab) {
        writeStoredLoginTab(input.preferredTab)
        updates.uiTab = input.preferredTab
      }

      updateSnapshot(updates)
    },
    clearAuthUiRequest() {
      if (snapshot.authUiRequest) {
        updateSnapshot({ authUiRequest: undefined })
      }
    },
    reset() {
      if (initialized) service.send("RESET")
    },
    destroy() {
      if (!initialized) return

      listeners.clear()
      service.stop()
      initialized = false
    },
  }
}
