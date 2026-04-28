import type { Unsubscriber, Writable } from "svelte/store"
import type { StateValue } from "xstate"
import type { AuthService } from "./auth-service"
import {
  currentUserStore as defaultCurrentUserStore,
  loginStateStore as defaultLoginStateStore,
} from "./svelte-stores"
import type { LoginTab, User } from "./simple-comment-types"

type LegacyLoginState = {
  state?: StateValue
  nextEvents?: string[]
  select?: LoginTab
}

type AuthStoreBridgeStores = {
  currentUserStore?: Writable<User | undefined>
  loginStateStore?: Writable<LegacyLoginState>
}

export const createAuthStoreBridge = (
  authService: AuthService,
  stores: AuthStoreBridgeStores = {}
): Unsubscriber => {
  const currentUserStore = stores.currentUserStore ?? defaultCurrentUserStore
  const loginStateStore = stores.loginStateStore ?? defaultLoginStateStore

  const unsubscribeCurrentUser = authService.currentUser.subscribe(user => {
    currentUserStore.set(user)
  })
  const unsubscribeAuthRuntimeSnapshot =
    authService.authRuntimeSnapshot.subscribe(({ state, nextEvents }) => {
      loginStateStore.set({ state, nextEvents })
    })

  return () => {
    unsubscribeCurrentUser()
    unsubscribeAuthRuntimeSnapshot()
  }
}
