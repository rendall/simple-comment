import { assign, createMachine } from "xstate"
import type { CommentId, ServerResponseError } from "./simple-comment-types"

type CommentEditMachineState = "idle" | "updating" | "updated" | "error"

type CommentEditTypestate = {
  value: CommentEditMachineState
  context: CommentEditMachineContext
}

type CommentEditMachineContext = {
  error?: ServerResponseError | string
  commentId?: CommentId
  commentText?: string
}

type CommentEditMachineEvent =
  | { type: "SUBMIT"; commentId: CommentId }
  | { type: "RESET" }
  | { type: "ERROR"; error: ServerResponseError | string }
  | { type: "SUCCESS"; commentText?: string }

export const commentEditMachine = createMachine<
  CommentEditMachineContext,
  CommentEditMachineEvent,
  CommentEditTypestate
>(
  {
    id: "comment-edit-flow",
    initial: "idle",
    context: {},
    states: {
      idle: {
        on: {
          //TODO: Add delete functionality i.e. DELETE if comment is blank
          RESET: "idle",
          SUBMIT: { target: "updating", actions: "assignCommentId" },
        },
      },
      updating: {
        on: {
          ERROR: { target: "error", actions: "assignErrorMessage" },
          SUCCESS: { target: "updated", actions: "assignCommentText" },
        },
      },
      updated: {
        on: {
          RESET: "idle",
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
          if (event.type === "SUBMIT") {
            return event.commentId
          }
          return undefined
        },
      }),
      assignCommentText: assign({
        commentText: (_, event) => {
          if (event.type === "SUCCESS") {
            return event.commentText
          }
          return undefined
        },
      }),
    },
  }
)
