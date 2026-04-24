import { cleanup } from "@testing-library/svelte"
import "@testing-library/jest-dom/vitest"
import { afterEach, beforeEach } from "vitest"
import {
  currentUserStore,
  dispatchableStore,
  loginStateStore,
} from "../../../lib/svelte-stores"

const resetStores = (): void => {
  currentUserStore.set(undefined)
  loginStateStore.set({
    state: undefined,
    nextEvents: undefined,
    select: undefined,
  })
  dispatchableStore.dispatch("init")
}

beforeEach(() => {
  localStorage.clear()
  resetStores()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  resetStores()
})
