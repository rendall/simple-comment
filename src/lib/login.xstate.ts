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
    /** @xstate-layout N4IgpgJg5mDOIC5QBsD2UCWA7AtAMzQHcA6DCZMAYgG0AGAXUVAAdVYMAXDVLJkAD0QBGAGwBmYgE5p0oQHYArGIUKAHCIBMAGhABPRJI3FNC2svUjLQyWIC+tnWky4CqEgDcwAJwx5d2KEoAZQBVAGEwgFEgoLpGJBBWdi4ePkEEDSEJS1UxSQAWVVM5MWsdfQRrBWIxWnzCyUVlSTV7R3RsfCJiTx8-AMpIgCUhgHkhuL4kzm5eBPTRWmrVfIUhDVK1uQ1VcoMhYw182UkVsTlRBTaQJ07XD29ffyxAgDEASSGggBUAfQA1d5Bd7fSYJaYpOagdL5DSSYzbI7SWp1TRiPaVY7EBQbcQifKlSx5ETXW4ubrsKBYAIhZjBcJRGJglhsGapeYGVbEWhyVRLRRrESnIQYvISAryVTbXkiFYaUkdcluYiU6kvWmDEbjZmJVmQtLCAn5YhZDRyMwlBQieSii7ETI49bHDQiOSyuQK5xdZVOGAQd5YSgAGVGAHFRiFQQwpnrZgbMQcxOJDCVzkKVBjVqpsXlrBsLqoNLRLJ67t1fQFRgBXDj0iLRWLR8Gx9nQxAu2j2ySu7aqPtuwsiDEreHWWgaItqM2aD0OG6K70kCsvau1sKjAByHyGAFkdRC4xyEGIXcQ+7QhATrZlaDzh7R4UKjrk8-VL6WlUv0M4oKvKGEAEENyiIN9xbKEBEQTZDkvUxrSddE9EQQpOwUbZLylOR6jMIQP0XYhl1-GtgneUMNxCAAFMDkkPNsMnWHNC2LeoxGORo5AxSRxzPK1TmtWo1hdPD7gI79K2I4YxgmJsWRo1tIMqJZiGOV18l5Qo+XyIVOK07khHWN0dj5N1cLnMl8MIgM60ZRt4lktkIPSMQVmMLJxyLURanODEjk7JMhHUGxGh2IlhPLMSXisyTtRk3U5McxAlAOUw6h5WpVG7I5RQne0RDgkK8hdDYwp9b9ID-ENQ3eDdqIc+NLDkGpL27EdRAFHzTG5DQVEdXkJwfK4zIXETfXK4jgTIyjav1I8bGzAKUwUFoxzkSRsqMF1ijdB81PEQb2i9ETvC8VAvGDMNqum2iFLciRNlKF0hAULTZQxNDjWc971jNbtRBKkhjtOkjJqo2KD3khZrGSxYnrzGxtCQhA5FW4w6haccuJPbt-uIQGzsqiMozsuK6qPLI+SkOExFY57CvWDEhGLCQJytMwbCTZRBrnLBUAgOA+HM+4Y3i+McAJbk8pddm0MUTJMxNJEgv081xzsIbDu6MgKGF0m6NhTiDk0NizHEVWrRx3ongCHWZrorGpCnQw8pWfSzQNw5jY5s38hx1UaWYG3rshjZKYfHYLnHeQRURsUpHySVpXUM4cdG-0IPBhLMWzVFckKCc02UHzeWUl0Mr7UxpB2lOIqIjhA4h5CpFYkpi3xCc1KlN61BNVRGbyAl+2p6uoB-AN68zrYpAuWoRDMIseWjipus7ccVG7ePCgufFh79Vdx-jFZqlMY4+0kS9ZU7xHfJqa0+w3nYk1UHG8f3snVgOAocVKNKMu6jE3VHLPIovcsgEkyPYewQA */
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

      loggingIn: {
        on: { SUCCESS: "loggedIn", ERROR: { target: "error", actions: "assignErrorMessage" } }
      },

      loggedOut: {
        on: { LOGIN: "loggingIn", SIGNUP: "signingUp" }
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
