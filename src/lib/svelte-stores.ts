import type { StateValue } from "xstate"
import type { User } from "../lib/simple-comment-types"
import type { AuthOutcome } from "./auth/auth-controller"
import { writable } from "svelte/store"
import { LoginTab } from "../lib/simple-comment-types"

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
  authOutcome: AuthOutcome
}>({
  state: undefined,
  nextEvents: undefined,
  select: undefined,
  authOutcome: { kind: "idle" },
})

export const currentUserStore = writable<User | undefined>(undefined)
