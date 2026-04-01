import {
  createGuestUser,
  createUser,
  deleteAuth,
  getGuestToken,
  postAuth,
  updateUser,
  verifySelf,
  verifyUser,
} from "../../apiClient"
import type { ServerResponseError, TokenClaim } from "../simple-comment-types"
import { readStoredSession } from "./auth-storage"
import type {
  AuthWorkflowError,
  AuthWorkflowResult,
  GuestLoginInput,
  LoginPayload,
  SignupPayload,
  UpdatedUser,
  UpdateUserPayload,
  VerifiedUser,
} from "./auth-types"

const UNKNOWN_WORKFLOW_ERROR =
  "Unknown error. Possibly the comment server is unreachable. Try reloading."

const FRIENDLY_SERVER_ERRORS: Array<
  [number | undefined, string | undefined, string]
> = [
  [
    401,
    "Policy violation: no authentication and canPublicCreateUser is false",
    "Sorry, new user registration is currently closed. Please contact the site administrator for assistance.",
  ],
  [
    401,
    "Bad credentials",
    "Oops! The password you entered is incorrect. Please try again. If you've forgotten your password, you can reset it.",
  ],
  [
    403,
    "Cannot modify root credentials",
    "Sorry, but the changes you're trying to make are not allowed. The administrator credentials you're attempting to modify are secured and can only be updated through the appropriate channels. If you need to make changes, please contact your system administrator or refer to your system documentation for the correct procedure.",
  ],
  [
    404,
    "Unknown user",
    "It seems we couldn't find an account associated with the provided user id. Please double-check your input for any typos. If you don't have an account yet, feel free to create one. We'd love to have you join our community!",
  ],
  [
    404,
    "Authenticating user is unknown",
    "It seems there's an issue with your current session. Please log out and log back in again. If the problem persists, contact the site administrator for assistance.",
  ],
  [undefined, undefined, UNKNOWN_WORKFLOW_ERROR],
]

const isServerResponseError = (
  error: unknown
): error is ServerResponseError => {
  if (!error || typeof error !== "object") return false

  return (
    "status" in error &&
    "statusText" in error &&
    "body" in error &&
    "ok" in error
  )
}

const ok = <T>(data: T): AuthWorkflowResult<T> => ({ ok: true, data })

const fail = ({
  error,
  code,
}: AuthWorkflowError): AuthWorkflowResult<never> => ({
  ok: false,
  error,
  code,
})

export const toAuthWorkflowError = (error: unknown): AuthWorkflowError => {
  if (typeof error === "string") return { error }

  if (isServerResponseError(error)) {
    const match = FRIENDLY_SERVER_ERRORS.find(
      ([_status, body]) => body === error.body
    )

    if (match) {
      const [expectedStatus, _body, friendlyMessage] = match

      if (expectedStatus !== undefined && expectedStatus !== error.status) {
        console.warn(
          `Error response code ${error.status} does not match error message code ${expectedStatus}`
        )
      }

      return { error: friendlyMessage, code: error.status }
    }

    return {
      error: `${error.status}:${error.statusText} ${error.body}`,
      code: error.status,
    }
  }

  if (error instanceof Error && error.message) {
    return { error: error.message }
  }

  return { error: UNKNOWN_WORKFLOW_ERROR }
}

export const verifySessionWorkflow = async (): Promise<
  AuthWorkflowResult<VerifiedUser>
> => {
  try {
    return ok(await verifySelf())
  } catch (error) {
    return fail(toAuthWorkflowError(error))
  }
}

export const loginWorkflow = async ({
  username,
  password,
}: {
  username: string
  password: string
}): Promise<AuthWorkflowResult<LoginPayload>> => {
  try {
    await postAuth(username, password)
    return ok({ authenticated: true })
  } catch (error) {
    return fail(toAuthWorkflowError(error))
  }
}

export const signupWorkflow = async (
  input: SignupPayload
): Promise<AuthWorkflowResult<SignupPayload>> => {
  try {
    await createUser(input)
    return ok(input)
  } catch (error) {
    return fail(toAuthWorkflowError(error))
  }
}

const createGuestSession = async ({
  name,
  email,
}: GuestLoginInput): Promise<AuthWorkflowResult<LoginPayload>> => {
  await getGuestToken()
  const verifiedResponse = await verifyUser()
  const id = (verifiedResponse.body as TokenClaim).user
  await createGuestUser({ id, name, email })
  return ok({ authenticated: true })
}

export const guestLoginWorkflow = async (
  input: GuestLoginInput
): Promise<AuthWorkflowResult<LoginPayload>> => {
  const storedUser = readStoredSession()?.user ?? {
    id: undefined,
    challenge: undefined,
  }

  const {
    id: storedId,
    challenge: storedChallenge,
    name: storedName,
    email: storedEmail,
  } = storedUser

  if (storedId && storedChallenge) {
    try {
      await postAuth(storedId, storedChallenge)
      await verifyUser()

      if (input.name !== storedName || input.email !== storedEmail) {
        const updateResult = await updateProfileWorkflow({
          id: storedId,
          name: input.name,
          email: input.email,
        })

        if (!updateResult.ok) return updateResult
      }

      return ok({ authenticated: true })
    } catch {
      // Fall through to the guest-token bootstrap flow below.
    }
  }

  try {
    return await createGuestSession(input)
  } catch (error) {
    return fail(toAuthWorkflowError(error))
  }
}

export const logoutWorkflow = async (): Promise<
  AuthWorkflowResult<{ loggedOut: true }>
> => {
  try {
    await deleteAuth()
    return ok({ loggedOut: true })
  } catch (error) {
    return fail(toAuthWorkflowError(error))
  }
}

export const updateProfileWorkflow = async (
  input: UpdateUserPayload
): Promise<AuthWorkflowResult<UpdatedUser>> => {
  try {
    const response = await updateUser(input)
    return ok(response.body as UpdatedUser)
  } catch (error) {
    return fail(toAuthWorkflowError(error))
  }
}
