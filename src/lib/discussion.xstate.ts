/** Discussion state machine deals with displaying a discussion: loading, creating and displaying */

import { assign, createMachine } from "xstate"
import type { Discussion, ServerResponse } from "./simple-comment-types"

export type DiscussionMachineState =
  | "idle"
  | "error"
  | "loading"
  | "loaded"
  | "creating"
  | "created"

export type DiscussionTypestate = {
  value: DiscussionMachineState
  context: DiscussionMachineContext
}

export type DiscussionMachineContext = {
  error?: ServerResponse
  discussion?: Discussion
}

export type DiscussionMachineEvent =
  | { type: "CREATE" }
  | { type: "RETRY" }
  | { type: "LOAD" }
  | { type: "ERROR"; error: ServerResponse }
  | { type: "SUCCESS" }

export const discussionMachine = createMachine<
  DiscussionMachineContext,
  DiscussionMachineEvent,
  DiscussionTypestate
>(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QQJawMYFdaxQewDsBaAMwBs8B3AOhQjLAGIBtABgF1FQAHPXAF3wEuIAB6IALAE4AHNQkB2AIwTWKpawUBWCToA0IAJ6IATKwDM1TUq0yAbOYkmtCu7IC+7g6gzZchUgoaCgBDVAIoRgBlAFUAYTiAUSiotk4kEF4BIRFxBGk5RRU1CQ1tXQkDYwQTaWoZVxMZEyVzOzclGXNPbzQsHCFAqmpQ8MjEgCUJgHkJtJEslEFCXMQFR3qW83N7CS67bSrEGwVqFy0Tc0uGuxUpOx6QH37-YnJh9AAnMBDBCOj4kkUvMMotlsIMnkTJdqCYpAopI4FHDdBolEcEOZ1vUpKw8dCruZWDIpI9nn5Bu8aF8fn9xlNZiCeHwljlIZItEpYV0SeYVBIsQiMbpTiTrIpbHZat0vE8+hSAlTqDTfpAWBwFizwat8rJ5MpVOpNDp9EZEOZOdQ7HjlBc7IoZKwpBIyfKBoqgiM8GE1QAZaYAQQAIkzMlq2aA8gV9cUjeVTdU4VIrTJUyoTMo1LdXb53W9PWBPp88J9GBNEgAVCYATVDYIjYkQMi0WmoUiUiKKOxMDkqZsxrBMbZaEntWjxTk0OZelILRZLjDi5YDFcSdfDK3ZCFxooUqjxWjsDQRWgx22o63tLWbUlvzqUnllBDwEDgInJeaGlE12U3kcQRB6koCItPcUrKPadgYkQWiWJK458k0Ap4lIWjTgq+bDHQDA-qyf6NpiyjyFIBLrGBNgmBiZhcsi7bIessGqA8sofq8X5emEKARLh2pble8hKAcZgZvaFpSFR8JnGojilDe9wPixbpsUqKp0jxDZ5DBrDUMBJEdu0GaCaOwpStQOx7g47Ydm07ToZ+KnfKqEDqfheRYnYxHXrYCJgQm5rjrCthNESFpqLeMq9LmymeqMkAuRC-6EVy0ikeY5GwRJNFHgc0gSHlzoyHZ0XDIWxafPFOrwh5uIkmYDQ6PlZ54rC2yocFpSsIej7uEAA */
    id: "discussion-flow",
    initial: "idle",
    context: {},
    states: {
      idle: {
        always: {
          target: "loading",
        },
      },

      loading: {
        on: {
          SUCCESS: { target: "loaded" },
          ERROR: { target: "error", actions: "assignErrorMessage" },
        },
      },

      creating: {
        on: {
          SUCCESS: { target: "created" },
          ERROR: { target: "error", actions: "assignErrorMessage" },
        },
      },

      created: {
        always: {
          target: "loading",
        },
      },

      loaded: {
        on: {
          LOAD: "loading",
        },
      },

      error: {
        on: {
          RETRY: "loading",
          CREATE: "creating",
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
    },
  }
)
