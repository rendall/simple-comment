import { beforeEach, describe, expect, test } from "@jest/globals"
import {
  clearStoredUser,
  loadStoredGuestIdentity,
  loadStoredUser,
  saveStoredUser,
} from "../../lib/auth-persistence"
import type { AdminSafeUser } from "../../lib/simple-comment-types"

const STORAGE_KEY = "simple_comment_user"

const storedUser: AdminSafeUser = {
  id: "alice",
  name: "Alice Example",
  email: "alice@example.com",
  isAdmin: false,
  isVerified: true,
  challenge: "challenge-token",
}

const installLocalStorage = () => {
  const values = new Map<string, string>()

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: jest.fn((key: string) => values.get(key) ?? null),
      setItem: jest.fn((key: string, value: string) => {
        values.set(key, value)
      }),
      removeItem: jest.fn((key: string) => {
        values.delete(key)
      }),
    },
  })
}

describe("auth persistence", () => {
  beforeEach(() => {
    installLocalStorage()
  })

  test("returns undefined when simple_comment_user is missing", () => {
    expect(loadStoredUser()).toBeUndefined()
  })

  test("returns undefined for malformed simple_comment_user without throwing", () => {
    localStorage.setItem(STORAGE_KEY, "{malformed-json")

    expect(() => loadStoredUser()).not.toThrow()
    expect(loadStoredUser()).toBeUndefined()
  })

  test("round-trips saved users through storage", () => {
    saveStoredUser(storedUser)

    expect(loadStoredUser()).toEqual(storedUser)
  })

  test("clears the stored user", () => {
    saveStoredUser(storedUser)
    clearStoredUser()

    expect(loadStoredUser()).toBeUndefined()
    expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY)
  })

  test("loads only reusable stored guest identity fields", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...storedUser,
        extraRuntimeOnlyField: "ignored",
      })
    )

    expect(loadStoredGuestIdentity()).toEqual({
      id: "alice",
      challenge: "challenge-token",
      name: "Alice Example",
      email: "alice@example.com",
    })
  })
})
