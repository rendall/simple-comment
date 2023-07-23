<script lang="ts">
  import CommentDisplay from "./CommentDisplay.svelte"
  import type {
    Discussion,
    Comment,
    User,
    ServerResponse,
  } from "../lib/simple-comment-types"
  import { useMachine } from "@xstate/svelte"
  import { createNewTopic, getOneDiscussion } from "../apiClient"
  import { discussionMachine } from "../lib/discussion.xstate"
  import { isResponseOk, threadComments } from "../frontend-utilities"
  import CommentInput from "./CommentInput.svelte"

  export let discussionId: string
  export let title: string
  export let currentUser: User | undefined

  let discussion: Discussion

  const { state, send } = useMachine(discussionMachine)

  const updateStatusDisplay = (message = "", error = false) => {
    console.log({ statusMessage: message, isError: error })
  }

  const loadingStateHandler = () => {
    updateStatusDisplay("loading")
    getOneDiscussion(discussionId)
      .then(response => {
        if (isResponseOk(response)) {
          const topic = response.body as Discussion
          discussion = threadComments(
            topic,
            topic.replies,
            (a, b) =>
              new Date(b.dateCreated).valueOf() -
              new Date(a.dateCreated).valueOf()
          )
          send({ type: "SUCCESS" })
        } else {
          send({ type: "ERROR", error: response })
        }
      })
      .catch(error => {
        send({ type: "ERROR", error })
      })
  }

  const errorStateHandler = () => {
    const error = $state.context.error
    const { status, statusText, ok, body } = error as ServerResponse
    if (ok) console.warn("Error handler caught an OK response", error)

    if (
      status === 404 &&
      statusText === "Not Found" &&
      body.startsWith("Topic")
    ) {
      send("CREATE")
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

  const creatingStateHandler = () => {
    console.log("creatingStateHandler")
    createNewTopic(discussionId, title)
      .then(response => {
        if (isResponseOk(response)) send("SUCCESS")
        else send({ type: "ERROR", error: response })
      })
      .catch(error => send({ type: "ERROR", error }))
  }

  const loadedStateHandler = () => {
    updateStatusDisplay("loaded")
  }

  $: {
    const stateHandlers: [string, () => void][] = [
      ["loading", loadingStateHandler],
      ["loaded", loadedStateHandler],
      ["creating", creatingStateHandler],
      ["error", errorStateHandler],
    ]

    stateHandlers.forEach(([stateValue, stateHandler]) => {
      if ($state.value === stateValue) stateHandler()
    })
  }
</script>

<section class="simple-comment-discussion">
  <CommentInput {currentUser} commentId={discussionId} />
  {#if discussion?.replies}
    <CommentDisplay {currentUser} replies={discussion.replies} />
  {/if}
</section>
