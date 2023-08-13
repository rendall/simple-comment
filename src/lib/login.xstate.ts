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
    /** @xstate-layout N4IgpgJg5mDOIC5QBsD2UCWA7AtAMzQHcA6DCZMAYgG0AGAXUVAAdVYMAXDVLJkAD0QAmIQA5iAFgDMQgKyiA7AEZaANiGrRQhQBoQAT0Q4pATgnETsq6Im0rCxVIC+TvWky4CqEgDcwAJww8fWwoSgBlAFUAYWiAUXDwukYkEFZ2Lh4+QQRVJSFiKVVaWgUHWSkFVTy9QwRjOQsFCrl1JVVZCVVnVxB3bHwiYj9A4NDKOIAlSYB5SeS+dM5uXlSc2QUTYlUTERlikzUJWqMNpWIlaSlLpSUtORMXN3QBr18AoJCsMIAxAElJuEACoAfQAan9wn8gQtUktMqtQDlirILgo5FVaF0tKpdAYjBJbMRtAoJEoqrIhEopBINE8+i9PEN2FAsKFIswIjF4olYSw2MssmtECoKsQFLRDg5RKJrg5VCdcrTiejyrIlJYpFZ6f0md5iCy2d8ORNpnM+WkBQjsiLaFTiFj8mY7nblIqqgoLiYDiZLpppAodYzBvrDZATRb4SsbQhLlriKJZFipKUJBL0VJFappAn8s1aTsqaUgx4QyR3DAIH8sJQADIzADiM0iMIYiyt0eFsdoMrRthlZyTDkVDVRJmaMjKUuUFRLryGFdCMwArhwubEEkk23CO0KkSLs7QHVjNBtx9mhMd8fU7p6zLjRGoZe0xLI53ry+gPFAV2vojMADl-kmABZSNd0RAQRQ9YkbEJUUNWkEdbwsLoHCfUQX0Td8y2IRdvl-ShogAQQA+Ja3AjJO33WMpEwwosV2dpqS6SlkMUVDcR2apaGuOQcLePCvyXVcIj+BsAMiAAFSjBUgnJLCPUl1SpTYbFxK86hwERxBTIQ7UOUxMLuASF2EgjRKmWZ5m3fkqL3KCECpDpJHUUkJUw0RswVa9jDtC4Olsa4ZFpDNTP1KBlzgDha3MqBq3XHktxSOy5Jjck1HFdFKRMLVNB7PE6iEUxxRKEQVCkLVOlUcKSEi6LYqgb8Eqs81bMtez5OEckthsakVEUHZZUVERzEw4p8ipRN8yEWqhKa0IEqiDdeXaqMHJyW5KvFIyexlQlZGqRVaXEBQZHJZyJCsXYJDm-D4prVqbJSjq0q7cl0VQ+QyTsfMzuOuxJBKFMOiKZRxzur9IEI+sGz+ADZOtd6TuIeQ6MuR8JQ0TNr0+zFJxKaRgdm3pdVwitodEqEJOkxHqMcxTxSu0pSi0NMJFEd0Cnx7RCZTXilEhprKbXBtIgSVsXvWrrY0UT1yTjK7dkwrV3SPTp8f7PJqTfUng0EimIEIp66Y24Q5DHHssVlHY6LUZDqTRZXgqEEwbG0OaAn8VB-DrRt4dNmWNFELYSmzDG0x2LFFTFTGBcwsRimKz3-G933qckmS1ogmM5F7C6RB7WkaQqGOpATFnrgTry7R6Z5S0Er2fb9psW0D3PZBMLZO8vDY1GuK7ZBHUxVEkSwrDEOwukvFxeiwVAIDgPgybedtOvS+1aGpWU0zMcdH00owOnEbNKqUDZbHRUQ5rICg17emj2lD7eaU2CR9+j3zKSPLyZEqO5LCXkDHrBuQwRifFCPfJGNFKqom0CoO0uJCZ2B8lpGQY4JyXlpLlLat0QHzlDBgVk7JmBQPpgpSk2wCwelMETIe14KjnG9LKCUKY5TJ3wR+A0RCsDhlITude71tCjwvJcTYbt1KHyVAUbQ2hEzqk1NqTh5MoZVkgtLGMg1UZ5EsErV2tghDD0aOOFohJXbXEuELb8v4yFm1oomNEpJKpYLKLiYeV0gZh06ImLexQarKMEvVWAMU4rVlsTLO4XlJDiL0gYtMnNrzFS2BKO0RZYHVTwfXAhn4FrfDCQIh+jlLhiEKMVZo8hvQVElIqSq6saSVV9GoHsuUrEi3CbnO05w8imDzNUDo58RwhwTOzckSZ1SEjOinNO7SuyXkOA6bMthvo3SkTgZQqNOgmMJO-Yss8gA */
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
          "*": "idle",
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
