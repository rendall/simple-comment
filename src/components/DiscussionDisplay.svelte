<script lang="ts">
  import CommentDisplay from "./CommentDisplay.svelte"
  import type {
    BaseActionObject,
    Interpreter,
    ResolveTypegenMeta,
    ServiceMap,
    TypegenDisabled,
  } from "xstate"
  import type { Discussion, Comment, User } from "../lib/simple-comment"
  import type {
    DiscussionMachineContext,
    DiscussionMachineEvent,
    DiscussionMachineState,
    DiscussionTypestate,
    ServerResponse,
  } from "../lib/discussion.xstate"
  import { createNewTopic, getOneDiscussion } from "../apiClient"
  import { discussionMachine } from "../lib/discussion.xstate"
  import { interpret } from "xstate"
  import { onMount } from "svelte"
  import { threadComments } from "../frontend-utilities"

  type DiscussionService = Interpreter<
    DiscussionMachineContext,
    any,
    DiscussionMachineEvent,
    DiscussionTypestate,
    ResolveTypegenMeta<
      TypegenDisabled,
      DiscussionMachineEvent,
      BaseActionObject,
      ServiceMap
    >
  >

  export let discussionId: string
  export let title: string
  export let currentUser: User | undefined

  let discussion: Discussion
  let replies
  let statusMessage = ""
  let isError = false

  // let nextEvents = []

  const discussionService = interpret(discussionMachine).start()

  const updateStatusDisplay = (message = "", error = false) => {
    console.log({ statusMessage: message, isError: error })
    statusMessage = message
    isError = error
  }

  const loadingStateHandler = discussionService => {
    updateStatusDisplay("loading")
    getOneDiscussion(discussionId)
      .then(response => {
        if (response.ok) {
          const topic = response.body as Discussion
          discussion = threadComments(
            topic,
            topic.replies,
            (a, b) =>
              new Date(b.dateCreated).valueOf() -
              new Date(a.dateCreated).valueOf()
          )
          discussionService.send({ type: "SUCCESS" })
        } else {
          discussionService.send({ type: "ERROR", error: response })
        }
      })
      .catch(error => {
        discussionService.send({ type: "ERROR", error })
      })
  }

  const errorStateHandler = discussionService => {
    const error = discussionService.state.context.error
    const { status, statusText, ok, body } = error as ServerResponse
    if (ok) console.warn("Error handler caught an OK response", error)

    if (
      status === 404 &&
      statusText === "Not Found" &&
      body.startsWith("Topic")
    ) {
      discussionService.send("CREATE")
      return
    }

    const errorMessages = [
      [
        403,
        "User not authorized",
        "Oops! It looks like this discussion topic hasn't been created yet. The administrator needs to set it up. Please check back later or contact the site admin. Thanks for your patience!",
      ],
    ]

    const messageTuple = errorMessages.find(
      ([_code, text, _friendly]) => text === body
    )
    if (messageTuple) {
      const [code, _text, friendly] = messageTuple as [number, string, string]
      if (code !== status)
        console.warn(
          `Error response code ${status} does not match error message code ${code}`
        )
      updateStatusDisplay(friendly, true)
    } else updateStatusDisplay(`${status}:${statusText} ${body}`, true)
  }

  const creatingStateHandler = discussionService => {
    console.log("creatingStateHandler")
    createNewTopic(discussionId, title)
      .then(response => {
        if (response.ok) discussionService.send("SUCCESS")
        else discussionService.send({ type: "ERROR", error: response })
      })
      .catch(error => discussionService.send({ type: "ERROR", error }))
  }

  const loadedStateHandler = () => {
    updateStatusDisplay("loaded")
  }

  onMount(() => {
    const transitionHandler = state => {
      // nextEvents = state.nextEvents
      const stateHandlers: [
        DiscussionMachineState,
        (discussionService: DiscussionService) => void
      ][] = [
        ["loading", loadingStateHandler],
        ["loaded", loadedStateHandler],
        ["creating", creatingStateHandler],
        ["error", errorStateHandler],
      ]

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, handleState] =
        stateHandlers.find(([stateValue, _]) => state.matches(stateValue)) ?? []
      if (handleState) handleState(discussionService)
    }

    discussionService.onTransition(transitionHandler)
  })
</script>

<section class="discussion-display">
  <p id="status-display" class={isError ? "error" : ""}>{statusMessage}</p>
  {#if discussion?.replies}
    <CommentDisplay {currentUser} replies={discussion.replies} />
  {/if}
</section>

<style>
  .error {
    color: red;
  }
</style>
