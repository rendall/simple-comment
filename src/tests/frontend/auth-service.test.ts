import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import { get } from "svelte/store"
import { loginMachine } from "../../lib/login.xstate"
import { createAuthService } from "../../lib/auth-service"

type TransitionState = { value: string }

const mockInterpret = jest.fn()

jest.mock("xstate", () => {
  const actual = jest.requireActual<typeof import("xstate")>("xstate")

  return {
    ...actual,
    interpret: (...args: unknown[]) => mockInterpret(...args),
  }
})

describe("auth-service", () => {
  let transitionListener: ((state: TransitionState) => void) | undefined
  let mockInterpreter: {
    onTransition: jest.Mock
    start: jest.Mock
    stop: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    transitionListener = undefined

    mockInterpreter = {
      onTransition: jest.fn(listener => {
        transitionListener = listener as (state: TransitionState) => void
        return mockInterpreter
      }),
      start: jest.fn(() => {
        transitionListener?.({ value: "verifying" })
        return mockInterpreter
      }),
      stop: jest.fn(),
    }

    mockInterpret.mockReturnValue(mockInterpreter)
  })

  test("creates and starts a live interpreted login runtime", () => {
    createAuthService()

    expect(mockInterpret).toHaveBeenCalledWith(loginMachine)
    expect(mockInterpreter.onTransition).toHaveBeenCalledTimes(1)
    expect(mockInterpreter.start).toHaveBeenCalledTimes(1)
  })

  test("publishes sessionState from runtime transitions", () => {
    const authService = createAuthService()

    expect(get(authService.sessionState)).toBe("verifying")

    expect(transitionListener).toBeDefined()
    transitionListener?.({ value: "loggedIn" })

    expect(get(authService.sessionState)).toBe("loggedIn")
  })

  test("disposes the runtime when destroy is called", () => {
    const authService = createAuthService()

    authService.destroy()

    expect(mockInterpreter.stop).toHaveBeenCalledTimes(1)
  })
})
