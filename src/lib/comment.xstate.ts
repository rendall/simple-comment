/** Comment state machine handles user submitting a comment */

import { assign, createMachine } from "xstate"
import type { Comment, ServerResponse, ServerResponseError, ServerResponseSuccess } from "./simple-comment-types"

export type CommentMachineState =
  | "idle"
  | "validating"
  | "validated"
  | "creatingGuestUser"
  | "guestUserCreated"
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
  | { type: "CREATE_GUEST_USER" }
  | { type: "POST" }
  | { type: "RESET" }
  | { type: "ERROR"; error: ServerResponseError | string }
  | { type: "SUCCESS"; response?: ServerResponseSuccess<Comment> }

export const commentMachine = createMachine<
  CommentMachineContext,
  CommentMachineEvent,
  CommentTypestate
>(
  {
    id: "comment-flow",
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
          CREATE_GUEST_USER: "creatingGuestUser",
        },
      },
      creatingGuestUser: {
        on: {
          ERROR: { target: "error", actions: "assignErrorMessage" },
          SUCCESS: "guestUserCreated",
        },
      },
      guestUserCreated: {
        always: "validating",
      },
      validated: {
        on: {
          POST: "posting",
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
          RESET: "idle"
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
      })
    },
  }
)
