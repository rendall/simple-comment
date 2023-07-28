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
    /** @xstate-layout N4IgpgJg5mDOIC5QGMD2BbdYB2AXAtAGYA2qA7gHQCWExYAxAMoCqAQgLICSAKgNoAMAXUSgADqlhVcVVNhEgAHogCcAZgBMFACzrlAdgAcANi1blJkwBoQAT0QBWI5uUBGZeqNO9j9R4C+ftZomDgEJOQUAG4AhsQ00dLYUPQAogBKaQDyaQLCSCDiktKy8koILur2yhTuLkYVqkZ6ygZaRtZ2CKr8-BQmGqr2-PbGvgb2AUEYWHhEpJQxcRAJVElMzADCGymMjLnyhVIycvllFcrV5gau+vZaVQYGHYjq-Ho1Lgaqyvw-yjq+SYgYIzMLzKKxeKJZIbNIpACC3BSAH0AOLMHbcZHMRjpfb5Q7FE6gMpqTQ6fTGUzmNpaZ4IV6adQuX6VLR1NRmIEg0JzCLIABOYBWSVRAFc4LhmLAwALUhlsvixBIjiVTg4RhR1NcXG4WS1mep6ezqqpBu5fBoPOpVNzprzwpRBcLoeLJdLZestjs9kIDiqiaUNQYtTq9b8DIb6VaajojBdGo8XHo7SFZo6KM6EpA3bApTK5UqCgHjkGEGTtLpDCYzBY6bZEBotNo2kZ+Dp2+3VN5U6C+QtIctcJB6AAFTKMPh+gkltUkxAuVQGd4srRmyrt5q+ekGFzaZouewuNpDezagy9h3gwrQ+VZHLT5VFUvq8r2ewURcGfiVbpOcztA2CCGHu9iqBUpj8MuPytJe6bXhIt4sN6uxFoSL7zm+H5fj+YH8P+nj0ncIbHu4ahfPYhiOHBYIRDeI5wriU55E+qrEoowahq44YGhURF6HuPRQUY3zqHoHhLjR-YULKAqoHKjEpMx-rPnOHHlIMqjaEYkaGMMni+Ho9I6VpRhHp2hlDG0ASBCA2CoBAcDyDy8HkCpbFlvggGdF5FBCT0ZJNOya5aFJGY0HQ7mBq+35ad2VSUSBZrgfxe5aMurRmOoALMmF4KLFCqxQFFGHqbq3g1K0QzuGeahNPSzLNpG-DdNqriDEeoW2S5tFOkKIpQLm+ayiVallI0H4RhcxgaGovz1p0Gi9GROktWZejeN2eX8v1w4QENHoCqN7FlHoZhah4NZQVovyONGNqVlca2JWBKbdfarkDks2YQMdZaHiyNT4aYWjiY8ehmvSPx+aDEP8LqE3ZRM71pr1FA3kVf2vjoRE6ZVhjUtlvi5SjfYZvRv0zqpJ2IOyvS6uMgxiUu+htKl2gZYTOW2qTV4RLJ8lY5hi6-BQhgtHo83iVZxo6J+lrmMyS46GBNl+EAA */
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
