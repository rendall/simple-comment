import type { LoginMachineContext, LoginMachineState } from "../login.xstate"
import type { AdminSafeUser, LoginTab, NewUser } from "../simple-comment-types"

// Contract only. The controller implementation will be added separately.
export type LoginCredentials = {
  username: string
  password: string
}

export type SignupPayload = NewUser

export type GuestLoginInput = Pick<NewUser, "name" | "email">

/** Shared session state; passwords and local form fields do not belong here. */
export type AuthControllerSnapshot = {
  readonly state: LoginMachineState
  readonly context: Readonly<LoginMachineContext>
  readonly currentUser?: Readonly<AdminSafeUser>
  readonly nextEvents: readonly string[]
  readonly uiTab: LoginTab
  readonly message?: string
  readonly error?: string
}

/**
 * One controller per SimpleComment root, shared by its child components.
 * Creating the controller must not sign in or create a guest account.
 */
export type AuthController = {
  /** Immediately emit the current snapshot, then emit each update. */
  subscribe: (run: (snapshot: AuthControllerSnapshot) => void) => () => void
  getSnapshot: () => AuthControllerSnapshot

  /**
   * Restore an existing session, or remain signed out.
   * Repeated calls share one initialization; no new account is created.
   */
  init: (currentUser?: AdminSafeUser) => Promise<void>

  /**
   * Commands require explicit user intent and the initiating form's values.
   * Resolve after verification succeeds or an error is published in the snapshot.
   * Concurrent duplicate commands must not repeat server requests.
   */
  login: (input: LoginCredentials) => Promise<void>
  signup: (input: SignupPayload) => Promise<void>
  guestLogin: (input: GuestLoginInput) => Promise<void>

  /** Clear active identity after server logout; retain saved profile and tab. */
  logout: () => Promise<void>

  /** Persist the tab using the existing numeric LoginTab values. */
  setTab: (tab: LoginTab) => void

  /** Stop the controller and ignore late responses; safe to call repeatedly. */
  destroy: () => void
}
