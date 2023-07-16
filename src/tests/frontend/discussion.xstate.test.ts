import { discussionMachine } from "../../lib/discussion.xstate"

const initialState = discussionMachine.initialState

describe("Discussion flow state machine", () => {
  test("init state should be 'idle'", () => {
    expect(initialState.value).toBe("loading")
  })

  test("loading state should allow only actions SUCCESS or ERROR", () => {
    const loadingActions = Object.keys(
      discussionMachine.definition.states.loading.on
    )
    expect(loadingActions).toEqual(["SUCCESS", "ERROR"])
  })

  test("creating state should allow only actions SUCCESS or ERROR", () => {
    const creatingActions = Object.keys(
      discussionMachine.definition.states.creating.on
    )
    expect(creatingActions).toEqual(["SUCCESS", "ERROR"])
  })

  test("'created' state should always transition to 'loading'", () => {
    const nextState = discussionMachine.transition("creating", "SUCCESS")
    expect(nextState.value).toBe("loading")
  })

  test("loaded state should allow only action LOAD", () => {
    const loadedActions = Object.keys(
      discussionMachine.definition.states.loaded.on
    )
    expect(loadedActions).toEqual(["LOAD"])
  })

  test("error state should allow only actions RETRY or CREATE", () => {
    const errorActions = Object.keys(
      discussionMachine.definition.states.error.on
    )
    expect(errorActions).toEqual(["RETRY", "CREATE"])
  })

  test("loading with SUCCESS should transition to state `loaded`", () => {
    const nextState = discussionMachine.transition("loading", "SUCCESS")
    expect(nextState.value).toBe("loaded")
  })

  test("loading with ERROR should transition to state `error`", () => {
    const nextState = discussionMachine.transition("loading", "ERROR")
    expect(nextState.value).toBe("error")
  })

  test("creating with SUCCESS should transition to state `created`", () => {
    const nextState = discussionMachine.transition("creating", "SUCCESS")
    expect(nextState.value).toBe("loading")
  })

  test("creating with ERROR should transition to state `error`", () => {
    const nextState = discussionMachine.transition("creating", "ERROR")
    expect(nextState.value).toBe("error")
  })

  test("loaded with LOAD should transition to state `loading`", () => {
    const nextState = discussionMachine.transition("loaded", "LOAD")
    expect(nextState.value).toBe("loading")
  })

  test("error with RETRY should transition to state `loading`", () => {
    const nextState = discussionMachine.transition("error", "RETRY")
    expect(nextState.value).toBe("loading")
  })

  test("error with CREATE should transition to state `creating`", () => {
    const nextState = discussionMachine.transition("error", "CREATE")
    expect(nextState.value).toBe("creating")
  })
})
