import { loginMachine } from "../../lib/login.xstate"

const initialState = loginMachine.initialState

describe("Login flow state machine", () => {
  test("init state should be 'verifying'", () => {
    expect(initialState.value).toBe("verifying")
  })

  test("verifying with SUCCESS should transition to state `loggedIn`", () => {
    const nextState = loginMachine.transition("verifying", "SUCCESS")
    expect(nextState.value).toBe("loggedIn")
  })

  test("verifying with ERROR should transition to state `error`", () => {
    const nextState = loginMachine.transition("verifying", "ERROR")
    expect(nextState.value).toBe("error")
  })

  test("loggingIn with SUCCESS should transition to state `verifying`", () => {
    const nextState = loginMachine.transition("loggingIn", "SUCCESS")
    expect(nextState.value).toBe("verifying")
  })

  test("signingUp with SUCCESS should transition to state `loggingIn`", () => {
    const nextState = loginMachine.transition("signingUp", "SUCCESS")
    expect(nextState.value).toBe("loggingIn")
  })

  test("loggingIn with ERROR should transition to state `error`", () => {
    const nextState = loginMachine.transition("loggingIn", "ERROR")
    expect(nextState.value).toBe("error")
  })

  test("signingUp with ERROR should transition to state `error`", () => {
    const nextState = loginMachine.transition("signingUp", "ERROR")
    expect(nextState.value).toBe("error")
  })

  test("loggedIn with LOGOUT should transition to state `loggingOut`", () => {
    const nextState = loginMachine.transition("loggedIn", "LOGOUT")
    expect(nextState.value).toBe("loggingOut")
  })
})
