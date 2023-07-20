import { loginMachine } from "../../lib/login.xstate"

const initialState = loginMachine.initialState

describe("Login flow state machine", () => {
  test("init state should be 'verifying'", () => {
    expect(initialState.value).toBe("verifying")
  })

  test("loggingIn state should allow only actions SUCCESS or ERROR", () => {
    const loggingInActions = Object.keys(
      loginMachine.definition.states.loggingIn.on
    )
    expect(loggingInActions).toEqual(["SUCCESS", "ERROR"])
  })

  test("signingUp state should allow only actions SUCCESS or ERROR", () => {
    const signingUpActions = Object.keys(
      loginMachine.definition.states.signingUp.on
    )
    expect(signingUpActions).toEqual(["SUCCESS", "ERROR"])
  })

  test("loggedIn state should allow only action LOGOUT", () => {
    const loggedInActions = Object.keys(
      loginMachine.definition.states.loggedIn.on
    )
    expect(loggedInActions).toEqual(["LOGOUT"])
  })

  test("loggingOut state should allow only actions SUCCESS, CONFIRM, CANCEL, SIGNUP or ERROR", () => {
    const loggingOutActions = Object.keys(
      loginMachine.definition.states.loggingOut.on
    )
    expect(loggingOutActions).toEqual([
      "SUCCESS",
      "CONFIRM",
      "CANCEL",
      "SIGNUP",
      "ERROR",
    ])
  })

  test("loggedOut state should allow only actions LOGIN or SIGNUP", () => {
    const loggedOutActions = Object.keys(
      loginMachine.definition.states.loggedOut.on
    )
    expect(loggedOutActions).toEqual(["LOGIN", "SIGNUP"])
  })

  test("error state should allow only actions LOGIN or SIGNUP", () => {
    const errorActions = Object.keys(loginMachine.definition.states.error.on)
    expect(errorActions).toEqual(["LOGIN", "SIGNUP", "LOGOUT"])
  })

  test("verifying state should allow only actions SUCCESS, ERROR or FIRST_VISIT", () => {
    const verifyingActions = Object.keys(
      loginMachine.definition.states.verifying.on
    )
    expect(verifyingActions).toEqual(["SUCCESS", "ERROR", "FIRST_VISIT"])
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
