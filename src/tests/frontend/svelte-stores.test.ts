import { get } from "svelte/store"
import { dispatchableStore } from "../../lib/svelte-stores"

describe("dispatchableStore", () => {
  it("should initialize with the correct default state", () => {
    expect(get(dispatchableStore)).toEqual({ name: "init" })
  })

  it("should dispatch and update the state correctly", () => {
    const testEventName = "testEvent"
    dispatchableStore.dispatch(testEventName)

    expect(get(dispatchableStore)).toEqual({ name: testEventName })
  })
})
