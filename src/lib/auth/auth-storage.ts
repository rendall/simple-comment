import type { User } from "../simple-comment-types"

export const AUTH_STORAGE_KEYS = {
  session: "simple_comment_user",
  loginTab: "simple_comment_login_tab",
} as const

export type SimpleCommentUser = Partial<
  Pick<User, "id" | "name" | "email" | "challenge" | "isAdmin" | "isVerified">
>

export type StoredAuthSession = { user: SimpleCommentUser | null }

export type StoredLoginTab = "login" | "signup" | "guest"

const readStorageItem = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const removeStorageItem = (key: string) => {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore storage write failures and preserve current runtime behavior.
  }
}

const writeStorageItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore storage write failures and preserve current runtime behavior.
  }
}

const isStoredLoginTab = (value: string): value is StoredLoginTab =>
  ["login", "signup", "guest"].includes(value)

const legacyLoginTabMap: Record<string, StoredLoginTab> = {
  "0": "guest",
  "1": "login",
  "2": "signup",
}

const storageLoginTabMap: Record<StoredLoginTab, string> = {
  guest: "0",
  login: "1",
  signup: "2",
}

export const readStoredSession = (): StoredAuthSession | null => {
  const storedItem = readStorageItem(AUTH_STORAGE_KEYS.session)
  if (!storedItem) return null

  try {
    const parsed = JSON.parse(storedItem) as
      | StoredAuthSession
      | SimpleCommentUser
      | null

    if (!parsed) return null

    if (typeof parsed === "object" && "user" in parsed) {
      return { user: parsed.user ?? null }
    }

    return { user: parsed }
  } catch {
    return null
  }
}

export const writeStoredSession = (session: StoredAuthSession | null): void => {
  if (!session || session.user === null) {
    removeStorageItem(AUTH_STORAGE_KEYS.session)
    return
  }

  writeStorageItem(AUTH_STORAGE_KEYS.session, JSON.stringify(session.user))
}

export const readStoredLoginTab = (): StoredLoginTab => {
  const storedItem = readStorageItem(AUTH_STORAGE_KEYS.loginTab)
  if (!storedItem) return "guest"
  if (isStoredLoginTab(storedItem)) return storedItem
  return legacyLoginTabMap[storedItem] ?? "guest"
}

export const writeStoredLoginTab = (tab: StoredLoginTab): void => {
  writeStorageItem(AUTH_STORAGE_KEYS.loginTab, storageLoginTabMap[tab])
}

export const clearStoredAuthState = (): void => {
  removeStorageItem(AUTH_STORAGE_KEYS.session)
  removeStorageItem(AUTH_STORAGE_KEYS.loginTab)
}
