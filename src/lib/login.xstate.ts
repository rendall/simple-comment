import { assign, createMachine } from "xstate"
import type { ServerResponse } from "./simple-comment-types"

export type LoginMachineState =
  | "idle"
  | "verifying"
  | "loggingIn"
  | "signingUp"
  | "signedUp"
  | "loggedIn"
  | "loggingOut"
  | "loggedOut"
  | "error"

export type LoginTypestate = {
  value: LoginMachineState
  context: LoginMachineContext
}

export type LoginMachineContext = {
  error?: ServerResponse | string
  guest?: { name: string; email: string }
}

export type LoginMachineEvent =
  | { type: "CANCEL" }
  | { type: "CONFIRM" }
  | { type: "ERROR"; error: ServerResponse | string }
  | { type: "FIRST_VISIT" }
  | { type: "GUEST"; guest: { name: string; email: string } }
  | { type: "LOGIN" }
  | { type: "LOGOUT" }
  | { type: "SIGNUP" }
  | { type: "SUCCESS" }
export const loginMachine = createMachine<
  LoginMachineContext,
  LoginMachineEvent,
  LoginTypestate
>(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QBsD2UCWA7AtAMzQHcA6DCZMAYgG0AGAXUVAAdVYMAXDVLJkAD0QBGAGwBmYgE5p0oQHYArGIUKAHCIBMAGhABPRJI3FNC2svUjLQyWIC+tnWky4CqEgDcwAJwx5d2KEoAZQBVAGEwgFEgoLpGJBBWdi4ePkEEDSEJS1UxSQAWVVM5MWsdfQRrBWIxWnzCyUVlSTV7R3RsfCJiTx8-AMpIgCUhgHkhuL4kzm5eBPTRWmrVfIUhDVK1uQ1VcoMhYw182UkVsTlRBTaQJ07XD29ffyxAgDEASSGggBUAfQA1d5Bd7fSYJaYpOagdL5DSSYzbI7SWp1TRiPaVY7EBQbcQifKlSx5ETXW4ubrsKBYAIhZjBcJRGJglhsGapeYGVbEWhyVRLRRrESnIQYvISAryVTbXkiFYaUkdcluYiU6kvWmDEbjZmJVmQtLCUq0Yi82g7MSWERmkRyUUXYiZHE7fKiC4XfIK5xdZWqyAanUQ2YGjIaIxiAmKDFCJb5bklORyTSqPmJuwOG6K70kJwwCDvLCUAAyowA4qMQqCGFM9UGOQgcIoTRpLNaE2iRAoMfkbdi8tYNhdVBpaJZPXdujmAqMAK4cekRaKxKvgmvs6GIZvGuE27bJqWy5sYlbw6xm4dqDSJy9jpXZ9DOKAzudhUYAOQ+QwAsgHV1CBIgxGbYhk1oIQCREdZox5I9aHhIUjlyft6jAm8s2IScXifSgwgAQVfKJCx-ZJa3XBBNkOMDTAg9YCS7PlsW2MCpTkeozCEVD7nQ+8p1nYJ3hLV8QgABSItk-3STIjCUIcR3qcNpATDFJDNYCFCFdQsiWdYSXTMk0Iwx9eOGMYJmXFliLXf9KiWYhjhtfJeUKPlu0kJTu25IR1ivEDE3Y3TM04qBpzgDhC24l583nRkl3icyxODZsRFss5Iz0YRPIkBR428lNxA47ogpCsKoAfSLjO1MzdQs8SN0sZKI07NLKnkJKeXOHKeTy-yvU4gzItCBcmUqwNLPSMQVmMTTQ1A8QzFtJqjmNC0hHUGxGh2Il8uVPqC3K0zYqq+K6yUA5TDqNraFUSRNHyUVQwdDsRw2vJmw2La7xKyAsOLEt3lfUT9TrSw5BqMDruPV0VAxDRTG5GGVEyXlppad6uM+iAsOBAThIBkirJsVRiBWwxFBaU85FcprAKMZtikTWCHPEK5uvHbb7y+3iSxCaJKwOkaaoQY9sUyXJTlocX6jownzoUZDEz5Io5FRnMObnPbcdG4RExBsGWNAx1tlupr5CkhMSZh5pWhZ29iG8LxUC8ItSz+jWBaydz6kvWXVHWFZ5Gh-EaitFRxekByUOttC7YdvjsZE4bf2DTzJFOxYhDWQwbG0JqzeMOoWjNZTAOu1Ho8dn7y156tqqT8bjUzsRw1ll71ijEcJFDNSzBsC1lGZ9MsFQCA4D4PT7mro7SJwTIJBHHEhUbrLFGzipYxo2RZRTl1O+Z9oeu6MgKAnwHSNhJSDhu6QzFmjY1NR3ongCY+8bGuEpAvQwOz9rzz8OY4i5vsoD0kdOKqhpMwZ+mtmobCkMOQwUpoyIxFFTGwUgXS8mlOoM4qNfQQFpJAgWtAozp3hJ3K0Ype4qGVuzPMf5+bBgbNUFohIthXgtI1CocDbLNiusmUwV8CjUJKjxDgBCGGXG5B2ZsPcl44gxGoQmK1ox5AJMmEoaY96sxIIVWAoVwpQHzGIusRDjZwgkNsLuFCma7wzPvNmwiIp0MTsdeQUgLi1HIcOHkyDOGwzNCoa6LpCgXHxEI3MT4jGkRWNUUwxxkxb1lFKaG+QloQWTEE80spS5eHtl4SJVkVoqQptfNYBsjgYllCDCWsFQK8lqCnew9ggA */
    id: "login-flow",
    initial: "idle",
    context: {},
    states: {
      idle: {
        always: [
          {
            target: "verifying",
          },
        ],
      },

      verifying: {
        on: {
          SUCCESS: "loggedIn",
          ERROR: { target: "error", actions: "assignErrorMessage" },
          FIRST_VISIT: "loggedOut",
        },
      },

      signingUp: {
        on: {
          SUCCESS: "signedUp",
          ERROR: { target: "error", actions: "assignErrorMessage" },
        },
      },
      signedUp: {
        always: [
          {
            target: "loggingIn",
          },
        ],
      },

      loggedIn: {
        on: { LOGOUT: "loggingOut" },
      },

      loggingOut: {
        on: {
          SUCCESS: "loggedOut",
          CONFIRM: "loggedOut",
          CANCEL: "verifying",
          SIGNUP: "signingUp",
          ERROR: { target: "error", actions: "assignErrorMessage" },
        },
        description:
          'A "guest" account will permanently lose ability to edit its posts when logging out. For guests only, a confirm prompt gives the guest an opportunity to avoid this.',
      },

      guestLoggingIn: {
        on: {
          SUCCESS: "verifying",
          ERROR: { target: "error", actions: "assignErrorMessage" },
        },
      },

      loggingIn: {
        on: {
          SUCCESS: "verifying",
          ERROR: { target: "error", actions: "assignErrorMessage" },
        },
      },

      loggedOut: {
        on: {
          LOGIN: "loggingIn",
          SIGNUP: "signingUp",
          GUEST: { target: "guestLoggingIn", actions: "assignGuest" },
          ERROR: { target: "error", actions: "assignErrorMessage" },
        },
      },

      error: {
        on: {
          LOGIN: "loggingIn",
          SIGNUP: "signingUp",
          LOGOUT: "loggingOut",
        },
      },
    },
    predictableActionArguments: true,
  },
  {
    actions: {
      assignErrorMessage: assign({
        error: (_, event) => {
          if (event.type === "ERROR") {
            return event.error
          }
          return undefined
        },
      }),
      assignGuest: assign({
        guest: (_, event) => {
          if (event.type === "GUEST") return event.guest
          else return undefined
        },
      }),
    },
  }
)
