import { writable } from "svelte/store"
import type { User } from "../lib/simple-comment-types";

// the 'request' part of the store will contain the request details
// the 'response' part of the store will contain the response details
export const communicationStore = writable({ request: null, response: null })

type EventDispatch = {
  event?: { name: string }
}
const createDispatchableStore = () => {
  const { subscribe, set, update } = writable({} as EventDispatch)

  return {
    subscribe,
    set,
    update,
    dispatch: eventName => {
      update(state => {
        return { ...state, event: { name: eventName } }
      })
    },
  }
}

export const dispatchableStore = createDispatchableStore()

export const guestUserCreation = writable({ name: undefined, email: undefined })

export const loginState = writable({ value: undefined, nextEvents: undefined })

export const currentUserStore = writable<User | undefined>(undefined)