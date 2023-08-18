import type { StateValue } from "xstate"
import type { User } from "../lib/simple-comment-types"
import { writable } from "svelte/store"
import { LoginTab } from "../lib/simple-comment-types"

// the 'request' part of the store will contain the request details
// the 'response' part of the store will contain the response details
export const communicationStore = writable({ request: null, response: null })

type EventDispatch = { name: string }

const createDispatchableStore = () => {
  const { subscribe, set, update } = writable<EventDispatch>({ name: "init" })

  return {
    subscribe,
    set,
    update,
    dispatch: (eventName: string) => set({ name: eventName }),
  }
}

export const dispatchableStore = createDispatchableStore()

export const loginStateStore = writable<{
  state?: StateValue
  nextEvents?: string[]
  select?: LoginTab
}>({
  state: undefined,
  nextEvents: undefined,
  select: undefined,
})

export const currentUserStore = writable<User | undefined>(undefined)
