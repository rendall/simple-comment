import { assign, createMachine } from "xstate"
import type { CommentId, ServerResponseError } from "./simple-comment-types"

export type CommentDeleteMachineState =
  | "idle"
  | "deleting"
  | "deleted"
  | "error"

export type CommentDeleteTypestate = {
  value: CommentDeleteMachineState
  context: CommentDeleteMachineContext
}

export type CommentDeleteMachineContext = {
  error?: ServerResponseError | string
  commentId?: CommentId
}

export type CommentDeleteMachineEvent =
  | { type: "DELETE"; commentId: CommentId }
  | { type: "RESET" }
  | { type: "ERROR"; error: ServerResponseError | string }
  | { type: "SUCCESS" }

// TODO: This will expand to include editing and be called the commentEditMachine
export const commentDeleteMachine = createMachine<
  CommentDeleteMachineContext,
  CommentDeleteMachineEvent,
  CommentDeleteTypestate
>(
  {
    id: "comment-delete-flow",
    initial: "idle",
    context: {},
    states: {
      idle: {
        on: {
          DELETE: { target: "deleting", actions: "assignCommentId" },
        },
      },
      deleting: {
        on: {
          ERROR: { target: "error", actions: "assignErrorMessage" },
          SUCCESS: { target: "deleted" },
        },
      },
      deleted: {
        always: {
          target: "idle",
        },
      },
      error: {
        on: {
          RESET: "idle",
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
      assignCommentId: assign({
        commentId: (_, event) => {
          if (event.type === "DELETE") {
            return event.commentId
          }
          return undefined
        },
      }),
    },
  }
)
