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
  error?: string
}

export type LoginMachineEvent =
  | { type: "CANCEL" }
  | { type: "CONFIRM" }
  | { type: "ERROR"; message: string }
  | { type: "FAILURE"; message: string }
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
    /** @xstate-layout N4IgpgJg5mDOIC5QBsD2UCWA7AtAMzQHcA6DCZMAYgG0AGAXUVAAdVYMAXDVLJkAD0QBGAGwAWYrSlSAnCIDsCmbQBMAZgA0IAJ6JxtYgA41JsSLVDaQiyoC+trWky4CqEgDcwAJwx5t2KEoAZQBVAGEwgFEgoLpGJBBWdi4ePkEEMVo1YnlDIRUAVhFzEVFDQwKtXQRxApyCqTFCtVy1FUN7R3RsfCJiTx8-AMpIgCVRgHlRuL4kzm5eBPT1Opl5GTEhMxaVMzEqxAKxCXkGqz21gpkhTpAnHtcSJ2coAEksYPComJmEuZTFqB0jIVEJiGZyqdCnkIQcEEI1uCZMi5MoVLRcgUOg47t0XH1ngF3iNxlNfiw2PNUktECCwRDDFCsVsRIY4XliGcpEcse0xGoRLd7vi3MR2FAsAEQsxPhForEGLNKQC0rTQeDWYyCtCWWydIgWtkxCiZIaWlljEK8b1ReLJVgoNKSZNpoq-sqFqqEHSNZDtczYfqECoZIZOdJdusrNq1FbnDanugYBBiQAZCYAcQmIQAKuTEh7qUC1TJOSIVKUEYZ+YYRDI4U0JNIpIp5G3MiICnGHgSkwEJgBXDiy74K+IU5KemkZLI5PKFYoCsoVOFCRSSYxqApCITbszyITYrrxx7EQkOwfDsITAByADFXqMALL5-5T4sz7K5fJFErLypBj+nKbjsGL8lk3YiomUAvJelBhAAgjeUSpq+haAgIwj5GCIhSJGmSmgKerVNupbHJ25Z8tWKh2DiwoJmefYXkOwSvBmN4hAACmhk5Fphn5zj+i6lJqAHVGos6FI0WSHi04iQQxzyQHB6YZq8N48VSGHpMUpbRp2tCGJG8gqKuFjECayJXFcGy7gpp5KRAcFBGxHHcW6E5aV6umSLuBlGWIbamYBRnhlI1hHFIEmhvZfTeF4qBeJQqnqZpKrThsIhGFcgXyE0chtvWgHmZZMjWcimxdnR1qnvFiWsexXFpe+-GmllWwYqyRQIjuwXVLsYbNpY1aVkc9g4lgqAQHAfD0Y8Sq8dpiA4CIcI4KspWlSZsWimQFALV505NHC5iliB8hboFu7IjtHjeL4-gOgd6UfhWEigoymw0eYtDbqtQanUYJiGkcB42bdjEwUSGFvnx6TrNktBrBdIaKIZ6xmSoYVWBsqhtPkYgQ3aUrMM9LXw+UFnVmIBRqMiAXHHCIZZVyxxXOICMQ457xk3DWG0O1SPGoUlgYtuJ1tMBJgHjRFi00euInr2UPMRwvNLcGRySKaig6+0P5whJWVSaov35LQxomFzSbKUO6tevL4KgtcW4ttumiAeuWLS0jBSFU08gQ3VXj29OO4C8QlgbCC25u0ITOMhZZzorhdabGu422EAA */
    id: "login-flow",
    initial: "idle",
    states: {
      idle: {
        always: [
          {
            target: "verifying"
          }
        ]
      },
      verifying: {
        on: { SUCCESS: "loggedIn", ERROR: "error", FIRST_VISIT: "loggedOut" }
      },
      loggingIn: {
        on: {
          SUCCESS: "loggedIn",
          ERROR: {
            target: "error",
            actions: "assignErrorMessage"
          }
        }
      },
      signingUp: {
        on: { SUCCESS: "loggedIn", ERROR: "error" }
      },
      loggedIn: {
        on: { LOGOUT: "loggingOut" }
      },
      loggingOut: {
        on: {
          SUCCESS: "loggedOut",
          CONFIRM: "loggedOut",
          CANCEL: "loggedIn",
          SIGNUP: "signingUp",
          ERROR: "error"
        },
        description:
          'A "guest" account will permanently lose ability to edit its posts when logging out. For guests only, a confirm prompt gives the guest an opportunity to avoid this.'
      },
      loggedOut: {
        on: { LOGIN: "loggingIn", SIGNUP: "signingUp" }
      },
      error: {
        on: { LOGIN: "loggingIn", SIGNUP: "signingUp" }
      }
    },
    predictableActionArguments: true
  },
  {
    actions: {
      assignErrorMessage: assign({
        error: (_, event) => {
          if (event.type === "ERROR") {
            return event.message
          }
          return undefined
        }
      })
    }
  }
)
