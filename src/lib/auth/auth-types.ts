import type {
  AdminSafeUser,
  NewUser,
  ServerResponseError,
  User,
} from "../simple-comment-types"

export type VerifiedUser = AdminSafeUser

export type LoginPayload = { authenticated: true }

export type GuestLoginInput = {
  name: string
  email: string
}

export type SignupPayload = NewUser

export type UpdateUserPayload = User

export type UpdatedUser = AdminSafeUser

export type AuthWorkflowError = {
  error: string
  code?: number
}

export type AuthWorkflowResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: number }

export type AuthWorkflowTransportError = ServerResponseError
