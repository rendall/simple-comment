/** Comment state machine handles user submitting a comment */

import { assign, createMachine } from "xstate"
import type {
  Comment,
  ServerResponseError,
  ServerResponseSuccess,
} from "./simple-comment-types"

export type CommentMachineState =
  | "idle"
  | "validating"
  | "validated"
  | "creatingGuestUser"
  | "createdGuestUser"
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

export const commentPostMachine = createMachine<
  CommentMachineContext,
  CommentMachineEvent,
  CommentTypestate
>(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QGMD2BbdYB2AXAtAA6qwEBmANqgO4B0AlhBWAMQDKAqgEICyAkgBUA2gAYAuolDFY9XPVTZJIAB6IAjAA4ATLQAsAZgBsAdg0BWLSONnDZuwBoQAT0T6NtM-oCcx-VZFqulpeamoAvmGOaJg4BNLkVHQAbgCGFIwpcthQLACiAEr5APL5ohJIINKy8ooVqgi6uiK0aiJeWsZeXt5qRoaOLgj4gV60AVpB+sYTNtYaEVEYWHhEJAk0tKnpEJn02ewcAMKHuWxsZUpVcgpK9X6GtPq6dmZeIrYinhr9zupa+rQOsZWl4NMYTLovAsQNFlnE1vhKBsthksjlDvlcgBBAS5AD6AHEOKcBHiOGwChcKlcardEGZ3mM3ho1O0LJ9dOCBogJh4wRoNM9pr1TIZobDYqtSIjErRkAAnMC7bIEgCucFwHFgYHleUKJSpUhI1RudXU7zUgLUWhtNieHU03IQ7g6+lCGh6n0MnyhkRhS0l8RlGwVSrRao1Wp1B2Op3O4kuxuutVA9W0Oi0tkhIhzQLUxidmgBPsFajM1jdunCfolKyDSLoocykAjpCjusNlSTtLNDW8TK0ApCnQtBd+CFZloMArMYJtNt033FAbrCIbmzSqMgLAACkU2MIE9Tu6bU64tJbgQEq9bDNpAronYPLZpApoqwLBfplzFV9L1-Eew5AUxSlEeRoyMmdIIHYAKDmYzwiPodiQoYWhOsh7jer0rIXqySG6D+cJSusdCAfsnCxmcnY0qeKg8mhLTTG4+haJ4g6GPoTrPA8oRvJCkKhIubFEYGa6yvE26YhSh7lBBJopvRE5grQ0w+J4XjljYLxOuW7iNJoxjTAYthdKJf6kbQOryqgurSbksmJpBPZnhO+hPICnSsSEoLetMTqGN6jw+JpIiCv8bRmBEfrYKgEBwEotbwv+iROQp0HDLoejuSIkLfGC4ysU6+D-A8gmzpp3qLt6Yo1iuyWWYwzBpVBvbuR4gWhThwRgmOgxuB4mbGG0-z-NaGheLViy-g1wbJJuOxoi1LlKchZiAiNhi9G0IgdI+44DRYJgjaxbqDr603EfWspNuG6pttq8rLXR9SmFl7SmPhnIaGFZhPll5bVW6SG7WohiEXVM0kXNcqKs2ECtpqj3PYp9TlsYYwdCynzuZp-njkWYy6HelitFtPgCuZs3riii2QCj0HAy0CFls+DJfD8gwXg8CHE70+UGGdVPQwBaxAQzbWtMzVYWCy7NuJzrgso8vWfdjrJTf6UPXRskkQBLrlM2WMtszj3y6eY2U+LtLN7d+kNXeJGzWbZBtKdaRm0AKb52udbjFb060WNMQ1upNgvRWEQA */
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
          CREATE_GUEST_USER: "creatingGuestUser",
        },
      },
      creatingGuestUser: {
        on: {
          ERROR: { target: "error", actions: "assignErrorMessage" },
          SUCCESS: "createdGuestUser",
        },
      },
      createdGuestUser: {
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
