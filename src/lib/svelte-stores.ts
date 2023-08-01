import { writable } from "svelte/store"
import type { User } from "../lib/simple-comment-types"

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

export const guestUserCreation = writable({ name: undefined, email: undefined })

export const loginState = writable({ value: undefined, nextEvents: undefined })

export const currentUserStore = writable<User | undefined>(undefined)
