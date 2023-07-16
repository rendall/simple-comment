import { assign, createMachine } from "xstate"
import type { Discussion } from "./simple-comment"

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

export type ServerResponse = {
  status: number
  statusText: string
  ok: boolean
  body: string
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
    /** @xstate-layout N4IgpgJg5mDOIC5QQJawMYFdaxQewDsBaAMwBs8B3AOhQjLAGIBtABgF1FQAHPXAF3wEuIAB6IiAFgCcADmrSA7AFZFrSZNbTWi6coA0IAJ6IAjK1PVTANknKZagEzKlpgMwBfD4dQZsuQlIKGgoAQ1QCKEYAZQBVAGF4gFFo6LZOJBBeASERcQQiN1N5a0dbFxtpW2s3QxMER0US61ZZc2trPWLZRS8fNCwcISCqajCIqKSAJSmAeSn0kWyUQUI8iTdG6kVHWWULN1kepVrjREli6kk3SV1lTpt3U2U+kF9BgOJyUfQAJzBQoJIjEEslUotMstVsJMvlpJpqI5WG5WEjlLJHG4OpI6mZJI4FNIiXoUS5JEdrK93v5ht8aH8AUDJjN5hCeHwVrlYYh4axEcjUax0ZjsbiGrJpNR7o4ZG45Bcdo4qQMaYE6dQGYDICwOEsOdD1gVHGUpbdNJ09tcyWLTETqBLbmpZJ19sbZMq-EM1cExnhwtr4lMkgBBAAqSTZWX1XNA+Q0fJ02hRdnschlYqKBJ66k2jmKlVMHo+tJ9YF+vzwv0YQdDUwAmpGoTGxGZTIpEYpnnJpOZzLJWmL4dRrDY9hjTM9bPii6qvqXy5XGIGQ+HG9G1tyEOYdMOepo3PYdodTvVMZLWKUZLINLID4peq8CHgIHARNSvXOqHqchvYxJ7m41BuFieiKCOMhaDiZwFKUUoWLaeyND2SKUt4bwqh+Iw0HQDDfpyv4tgUyjPEBIFYmByJtKYYoyoSRysOoxqtA4M6Yeq4woJEeEGpuRDEcopEumBpgQfCNrSIBqLoioEEKqh-Sep8WEav8gKcVA3HNvkbRZtc1iqNojg9sBGYWAo1h7hKyL8SorFKeqmr8JAmkEfkE4XIiV63kUF6KIcNotMOSg9DKrTKAe8J2SWozjM5kLrjCf4FBo2wouo5pCsUEkGNBKKWFUllJjZUXeqMZYVr8LmJYRImAX2HQ6BZejSGKdgEneNSPK0VmeF4HhAA */
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
