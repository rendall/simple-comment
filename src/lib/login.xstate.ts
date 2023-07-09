import { assign, createMachine } from "xstate"
import { AdminSafeUser, PublicSafeUser } from "./simple-comment"

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
  status: number,
  statusText: string,
  ok: boolean,
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
    /** @xstate-layout N4IgpgJg5mDOIC5QBsD2UCWA7AtAMzQHcA6DCZMAYgG0AGAXUVAAdVYMAXDVLJkAD0QBGAGwBmYgE5p0oQHYArGIUKAHCIBMAGhABPRJI3FNC2svUjLQyWIC+tnWky4CqEgDcwAJwx5d2KEoAZQBVAGEwgFEgoLpGJBBWdi4ePkEEDSEJS1UxSQAWVVM5MWsdfQRrBWIxWnzCyUVlSTV7R3RsfCJiTx8-AMpIgCUhgHkhuL4kzm5eBPTRWmrVfIUhDVK1uQ1VcoMhYw182UkVsTlRBTaQJ07XD29ffyxAgDEASSGggBUAfQA1d5Bd7fSYJaYpOagdIiWiSYj5RZHMyqUS7PTCJQ1VSSOF5fEiFTXW4ubrsKBYAIhZjBcJRGJglhsGapeYGVbEWhyVRLRRrESnIR7BD4qSI7nbbkiFYaYkdUluYjkykvamDEbjRmJZmQtLCfJifLELIaORmEoKETyYXnA6ZBSZI6GERyaVyOXOLqKpwwCDvLCUAAyowA4qMQqCGFMdbM9ZUDjYslzVNtUbz0RVViJjLQRPlxFa5JIBZIPXduj6AqMAK4cWkRaKxKPgmOs6GIDSw4gaYtyVOqFPSzvClbw6y0DQaJaqU2ad0OG7yr0kSsvGt1sKjAByHyGAFktRDY2yRZ3iAPaEIDVbMrQuSO4cZDIVSs-EfkywqV+hnFB15QwgAQS3KJA0PVsoQERAxFKTlch2XN8inY4hAUYVCloYgFG2K8UzkeozCET9l2IVc-1rYJ3hDLcQgABXA5Jj3bDJ1iwsQZ0Qg1jkaORhVxIwigFdQkzWTtiPuUifyrCjhjGCZmyZRi2ygyolgRXt8m5QoeXzSQ+PzTkhHWV0dh5V0iIXEkSJ9SB-2DEN3i3BiWUghY6kwmDRHkU5CnwkRhVQiR2MkIz6kEmdznEisf1sijgWoujnN1E8bFUY0cVNBQWnHIsbUnbtCS5V04U08QrkspcJO8LxUC8INQ0cpKmJUpMgsC9YrQUfNpWFbCjXYvr1lNYtRCixVqtqyiEvohTtSU1zhGsA5+UvNZDBsbQMQQPt4VhY5TB7MwexEMaSAmur7PDSN4kUly4yyHkpB7GDVgNQx1gC3MJEnS0zBsMQyvKhcsFQCA4D4Kz7mjea4xwA1OUJTt-uwxRMnQ40NFMO8ClhK0WlLCrPQksgKGhu6TyQviDk0bizHECdlBOwny0VXongCMnkuYsQeykNQe07NREWMqnDlpgHag2LrTqVDAKSpZhOeahZ1gkQw4R2C4J3kIUttFAp5BTU11DOGWbL9SCj2UhZCk5fNckKSdzjK4VjYRTscQHUxpBKs2pLXWsletxAjRsTTaksJCjglXq1HSoQ-oNAcSjsZmv0kqBfXXIOFoQIpqjRGnLSLIoM0xIKcTxGwbEJB0ZfOnP7tWBNVg2BOSgytCttdMdYVLozDR5iz7CAA */
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
        on: { SUCCESS: "loggedIn", ERROR: { target: "error", actions: "assignErrorMessage" } }
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

      loggedOut: {
        on: { LOGIN: "verifying", SIGNUP: "signingUp" }
      },

      error: {
        on: {
          LOGIN: "verifying",
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
