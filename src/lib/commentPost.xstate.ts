/** Comment state machine handles user submitting a comment */

import { assign, createMachine, raise } from "xstate"
import type {
  Comment,
  ServerResponseError,
  ServerResponseSuccess,
} from "./simple-comment-types"

export type CommentMachineState =
  | "idle"
  | "validating"
  | "validated"
  | "loggingIn"
  | "loggedIn"
  | "posting"
  | "posted"
  | "deleting"
  | "deleted"
  | "error"

export type CommentTypestate = {
  value: CommentMachineState
  context: CommentMachineContext
}

export type CommentMachineContext = {
  error?: ServerResponseError | string
  response?: ServerResponseSuccess<Comment>
}
export type CommentMachineEvent =
  | { type: "SUBMIT" }
  | { type: "LOG_IN" }
  | { type: "POST" }
  | { type: "RESET" }
  | { type: "ERROR"; error: ServerResponseError | string }
  | { type: "SUCCESS"; response?: ServerResponseSuccess<Comment> }

export const commentPostMachine = createMachine<
  CommentMachineContext,
  CommentMachineEvent,
  CommentTypestate
>(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QGMD2BbdYB2AXAtAA6qwEBmANqgO4B0AlhBWAMQDKAqgEICyAkgBUA2gAYAuolDFY9XPVTZJIAB6J8AJgCsAFlo6RANgDsRgIwGDAZgAc1kdoA0IAJ5rT2y7XWmR1o9fNLEUsjAE5LAF8IpzRMHAJpcio6ADcAQwpGNLlsKBYAUQAlQoB5QtEJJBBpWXlFKtUEH11LC191A3VQ9WDTJ1cEDU1rWmsgrs1-Lo9NTSiYjCw8IhIkmlp0zIhs+lz2DgBhA-y2NgqlGrkFJUb8P1ptA1DtI20PA2tQ02sDfrUDPRvIwGbRfV6WZ4GWbzECxJYJVb4SjrTZZHJ5AAyJQA4gB9PgAOXOVUudRuiFMplCgI8zWeoU06n8f0GpnU6lolgh1g6fnM-gCMLh8RWpCRyVoVCgUF2UD42AKxTKxKkJFq1waiBBIlobO0WhMIhE-kcLjc2k0uohQSMQVCXzZBiFixFiXF6ylMty8v2RxOZ3EFzVV3qoEallBuvZ1m0tgM3yhRhZ+BstA+InUP1CATCIWdcWWbuRdE9kB9KuqwbJmqa31o-h0sdmRgzvhZlg5Rm8lO8wJe33U+fhorWqQyaMgLAACiU2MJAySqxqw2ou7r7J91CFNHrMyz2UY9N4PqF7MbJpmh67EcXaIlZYrSuUF6qZCHybWdVod1yuj4Qq87ZdLqVhbvYmjpj8V6FjeEr3nsnB+qcFaksuKhuJYphpvqUIZrGULPKaAwWjq3Txq8oLhHYRjQQiYq3okk6FCc+TzpUr7qqG6GDEYlqPDhtq8bu1gssYlpPNmzyYf+0LRLCLowfREpgAATipqAqSwzFsKxKFLlxjTdJaPJPH4YFPBaLKvACpgmnqOidJooRRHJ2CoBAcBKMKimjkGb7ViugyPJ4EGUjoW5AsmEYAnaHi2qYlg6GYtEju6dCMMwfmcR++DaKYlqhfl+oRi8ybuJ47I2PaoFFe4KVFhKqLbOiWXvjWuUArGLY9D2fh2L8ZqskEuqaCIEEQb4DIxvVsEeqg0qyvKrUBdxIQhX4jxQsMDKUmV7KcoyMZjNoxoMhmM1KXN0pllxqEGYg7IAt1hjGr4o2GJo7ZYT0eUxhatqzPGF2jhs47NZAy1obcYxpgYvj9T8nwJiyPg6pM9gvKE-gfF0Tpyd5dEg-BUCQ-dgww20tiGIjXw-O2EKjECUyPH44TA2ld6rBDi7+VDagU3DVMfCeyODU5OqgZMvFcvYVLs7eqnqSppMfn4lpdv9PIiN8EGWHtHKJZmjL5To3RdC5ERAA */
    id: "comment-post-flow",
    initial: "idle",
    context: {},
    states: {
      idle: {
        on: {
          SUBMIT: "validating",
        },
      },
      validating: {
        on: {
          ERROR: { target: "error", actions: "assignErrorMessage" },
          SUCCESS: "validated",
          LOG_IN: "loggingIn",
        },
      },
      loggingIn: {
        on: {
          ERROR: { target: "error", actions: "assignErrorMessage" },
          SUCCESS: "loggedIn",
        },
      },
      loggedIn: {
        always: "validating",
      },
      validated: {
        on: {
          POST: "posting",
          RESET: "idle",
        },
      },
      posting: {
        on: {
          ERROR: { target: "error", actions: "assignErrorMessage" },
          SUCCESS: { target: "posted", actions: "assignSuccessResponse" },
        },
      },
      posted: {
        on: { RESET: "idle" },
      },
      error: {
        on: {
          RESET: "idle",
          SUBMIT: {
            target: "idle",
            actions: raise("SUBMIT"),
          },
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
      assignSuccessResponse: assign({
        response: (_, event) => {
          if (event.type === "SUCCESS") {
            return event.response
          }
          return undefined
        },
      }),
    },
  }
)
