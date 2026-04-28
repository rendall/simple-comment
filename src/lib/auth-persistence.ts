import type { Email, User, UserId } from "./simple-comment-types"

const STORED_USER_KEY = "simple_comment_user"

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">

export type StoredGuestIdentity = {
  id?: UserId
  challenge?: string
  name?: string
  email?: Email
}

const getStorage = (): StorageLike | undefined => {
  if (typeof globalThis.localStorage === "undefined") return undefined
  return globalThis.localStorage
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined

const parseStoredUser = (): Record<string, unknown> | undefined => {
  const storage = getStorage()
  const storedValue = storage?.getItem(STORED_USER_KEY)

  if (!storedValue) return undefined

  try {
    const parsedValue = JSON.parse(storedValue) as unknown

    return isRecord(parsedValue) ? parsedValue : undefined
  } catch {
    return undefined
  }
}

export const loadStoredUser = (): User | undefined => {
  const storedUser = parseStoredUser()

  if (!storedUser) return undefined

  const id = asString(storedUser.id)
  const name = asString(storedUser.name)
  const email = asString(storedUser.email)

  if (!id || !name || !email) return undefined

  return {
    ...storedUser,
    id,
    name,
    email,
  } as User
}

export const saveStoredUser = (user: User): void => {
  const storage = getStorage()

  storage?.setItem(STORED_USER_KEY, JSON.stringify(user))
}

export const clearStoredUser = (): void => {
  const storage = getStorage()

  storage?.removeItem(STORED_USER_KEY)
}

export const loadStoredGuestIdentity = (): StoredGuestIdentity | undefined => {
  const storedUser = parseStoredUser()

  if (!storedUser) return undefined

  const storedGuestIdentity: StoredGuestIdentity = {
    id: asString(storedUser.id),
    challenge: asString(storedUser.challenge),
    name: asString(storedUser.name),
    email: asString(storedUser.email),
  }

  const hasReusableGuestIdentity = Object.values(storedGuestIdentity).some(
    value => value !== undefined
  )

  return hasReusableGuestIdentity ? storedGuestIdentity : undefined
}
