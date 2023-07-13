import { assign, createMachine } from "xstate"
import type { AdminSafeUser, PublicSafeUser } from "./simple-comment"

export type LoginMachineState =
  | "idle"
  | "verifying"
  | "loggingIn"
  | "signingUp"
  | "loggedIn"
  | "loggingOut"
  | "loggedOut"
  | "error"

export type LoginTypestate = {
  value: LoginMachineState
  context: LoginMachineContext
}

export type LoginMachineContext = {
  error?: ServerResponse
}

export type ServerResponse = {
  status: number
  statusText: string
  ok: boolean
  body: string
}

export type LoginMachineEvent =
  | { type: "CANCEL" }
  | { type: "CONFIRM" }
  | { type: "ERROR"; error: ServerResponse }
  | { type: "FIRST_VISIT" }
  | { type: "LOGIN" }
  | { type: "LOGOUT" }
  | { type: "SIGNUP" }
  | { type: "SUCCESS"; user: PublicSafeUser | AdminSafeUser }
export const loginMachine = createMachine<
  LoginMachineContext,
  LoginMachineEvent,
  LoginTypestate
>(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QBsD2UCWA7AtAMzQHcA6DCZMAYgG0AGAXUVAAdVYMAXDVLJkAD0QBGAGwBmYgE5p0oQHYArGIUKAHCIBMAGhABPRJI3FNC2svUjLQyWIC+tnWky4CqEgDcwAJwx5d2KEoAZQBVAGEwgFEgoLpGJBBWdi4ePkEEDSEJS1UxSQAWVVM5MWsdfQRrBWIxWnzCyUVlSTV7R3RsfCJiTx8-AMpIgCUhgHkhuL4kzm5eBPTRWmrVfIUhDVK1uQ1VcoMhYw182UkVsTlRBTaQJ07XD29ffyxAgDEASSGggBUAfQA1d5Bd7fSYJaYpOagdL5DSSYzbI7SWp1TRiPaVY7EBQbcQifKlSx5ETXW4ubrsKBYAIhZjBcJRGJglhsGapeYGVbEWhyVRLRRrESnIQYvISAryVTbXkiFYaUkdcluYiU6kvWmDEbjZmJVmQtLCUq0Yi82g7MSWERmkRyUUXYiZHE7fKiC4XfIK5xdZVOGAQd5YSgAGVGAHFRiFQQwpnrZgbMQcLXkNCVzkKVBjVqpsXlrBsLqoNLRLJ67t1fQFRgBXDj0iLRWLR8Gx9nQxAaK0OyQ27aqPtyWUdjEreHWM1FtQpzRyUtKkgVl7V2thUYAOQ+QwAsjqIXGOQgxB3iH3aEICSJ1kJaDzh7R4UKjrk8-Uz7PvfP0M4oEvKGEAIKrlEQY7i2UICIgmyHGepgXusBKZny2LbGeUpyPUZhCG+9zEAu341sE7yhquIQAAogcke5thk6w5oWxb1GIxyNLaegGGax4KEK6hZEs6wkg4NyKu+OGfpW+HDGMExNiyFGtuBlRLMQxw2vkvKFHy+RChiBQiNyQjrAOOx8gOmECWSwm4QGdaMo28QyWyYHpGIKzGDxGhFqItTnBiRzGhaQjqDYjQ7ESWHlqJLxWRJ2rSbqsmOYgSgHKYdQ8rUqjdkcoruQ6IgwSFyZomFPqfpAP4hqG7yruRDnxpYcg1Ge3Yjq6GasRkpjchoKg4pK7l3lcZlCdhvplfhwJEaRNX6vuNjZgFhiKC0Y5yJI2VGB2xQDneqniIN7Reth3heKgXjBmGVXTZR8lNfCzlpao1iNOIGJrBI5iKPUnFCsWxUkMdp0EZNZGxbuckLNYyWLEIayGDY2jtXIq3GHULRmpIZhwvxB1lsqANnRVEZRnZcW1fuWSIXDYiMQoBKGOsGJXuIDrdVaYpJio9gCVgqAQHAfDmfcMbxfGOAEtyeUdjYyhI71mbEHB0gdgORSWAoM5DYd3RkBQwtk1RsLaQcmhMWY4hmso2OCVryq9E8AR6zNVGHvCLSFoYeUrPpKZG4cptJhbtN-SqGBUjSzCO9dEMbFIRaGFKV6ZBcoo2FILq8tK6hnMHo3+mBYMJZi2aorkhTuWmyg+bySkdhlfamNIO05xFeEcJH4OIPkUiMSUxb4u5qlSq9agK49ZgFM5UrU83UBfgG7eF1sUgXLUbNFjyIrtd1xpmio3YuoUFz4jPfpLgv8YrNUpjHH2khnrKQ9b-kfkXn2B-mrKwf4+f5OrAcBQ4iNCUDK3UMQDlHFaIoj0sgEkyFzWwQA */
    id: "login-flow",
    initial: "idle",
    context: {},
    states: {
      idle: {
        always: [
          {
            target: "verifying"
          }
        ]
      },

      verifying: {
        on: {
          SUCCESS: "loggedIn",
          ERROR: { target: "error", actions: "assignErrorMessage" },
          FIRST_VISIT: "loggedOut"
        }
      },

      signingUp: {
        on: {
          SUCCESS: "loggedIn",
          ERROR: { target: "error", actions: "assignErrorMessage" }
        }
      },

      loggedIn: {
        on: { LOGOUT: "loggingOut" }
      },

      loggingOut: {
        on: {
          SUCCESS: "loggedOut",
          CONFIRM: "loggedOut",
          CANCEL: "verifying",
          SIGNUP: "signingUp",
          ERROR: { target: "error", actions: "assignErrorMessage" }
        },
        description:
          'A "guest" account will permanently lose ability to edit its posts when logging out. For guests only, a confirm prompt gives the guest an opportunity to avoid this.'
      },

      loggingIn: {
        on: {
          SUCCESS: "loggedIn",
          ERROR: { target: "error", actions: "assignErrorMessage" }
        }
      },

      loggedOut: {
        on: { LOGIN: "loggingIn", SIGNUP: "signingUp" }
      },

      error: {
        on: {
          LOGIN: "loggingIn",
          SIGNUP: "signingUp",
          LOGOUT: "loggingOut"
        }
      }
    },
    predictableActionArguments: true
  },
  {
    actions: {
      assignErrorMessage: assign({
        error: (_, event) => {
          if (event.type === "ERROR") {
            return event.error
          }
          return undefined
        }
      })
    }
  }
)
