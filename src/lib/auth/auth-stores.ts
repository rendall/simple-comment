import { LoginTab } from "../simple-comment-types"
import {
  currentUserStore,
  dispatchableStore,
  loginStateStore,
} from "../svelte-stores"
import type { StoredLoginTab } from "./auth-storage"
import type { AuthControllerSnapshot } from "./auth-controller"

const storedLoginTabToLoginTab = (storedLoginTab: StoredLoginTab): LoginTab =>
  ({
    guest: LoginTab.guest,
    login: LoginTab.login,
    signup: LoginTab.signup,
  })[storedLoginTab]

export { currentUserStore, dispatchableStore, loginStateStore }

export const publishAuthSnapshot = (snapshot: AuthControllerSnapshot): void => {
  currentUserStore.set(snapshot.currentUser)
  loginStateStore.set({
    state: snapshot.state,
    nextEvents: snapshot.nextEvents,
    select: storedLoginTabToLoginTab(snapshot.uiTab),
  })
}
