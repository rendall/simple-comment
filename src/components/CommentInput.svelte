<script lang="ts">
  import type {
    Comment,
    CommentId,
    ServerResponse,
    User,
  } from "../lib/simple-comment-types"
  import { commentPostMachine } from "../lib/commentPost.xstate"
  import { createEventDispatcher, onDestroy } from "svelte"
  import { isResponseOk } from "../frontend-utilities"
  import { dispatchableStore, loginStateStore } from "../lib/svelte-stores"
  import { postComment } from "../apiClient"
  import { useMachine } from "@xstate/svelte"
  import Login from "./Login.svelte"
  export let currentUser: User | undefined
  export let commentId: CommentId
  export let onCancel = null
  export let autofocus = false

  let commentText = ""

  const { state, send } = useMachine(commentPostMachine)
  const dispatch = createEventDispatcher()

  const onSubmit = e => {
    e.preventDefault()
    send({ type: "SUBMIT" })
  }

  const validatingStateHandler = () => {
    if (currentUser) send({ type: "SUCCESS" })
    else send("LOG_IN")
  }

  const validatedStateHandler = () => {
    send({ type: "POST" })
  }

  const loggingInStateHandler = () => {
    dispatchableStore.dispatch("loginIntent")
  }

  const unsubscribeLoginState = loginStateStore.subscribe(loginState => {
    const { value: loginStateValue } = loginState
    const continueToPostComment =
      loginStateValue === "loggedIn" && $state.value === "loggingIn"
    if (continueToPostComment) setTimeout(() => send("SUCCESS"), 1)
  })

  const postingStateHandler = async () => {
    try {
      const response = await postComment(commentId, commentText)
      if (isResponseOk(response)) send({ type: "SUCCESS", response })
      else send("ERROR", response)
    } catch (error) {
      send("ERROR", error)
    }
  }

  const postedStateHandler = () => {
    const { response } = $state.context
    if (!response) {
      console.warn("'posted' state reached without corresponding response")
      return
    }
    const { body } = response as ServerResponse<Comment>
    dispatch("posted", { comment: body })
    send({ type: "RESET" })
    commentText = ""
  }

  const errorStateHandler = () => {
    const error = $state.context.error
    if (!error) {
      console.error("Unknown error")
      console.trace()
      return
    }

    if (typeof error === "string") {
      console.error(error)
      return
    }

    const { ok } = error as ServerResponse
    if (ok) console.warn("Error handler caught an OK response", error)

    // At this stage the error messages should already be present on the page

    send({ type: "RESET" })
  }

  onDestroy(() => {
    unsubscribeLoginState()
  })

  $: {
    const stateHandlers: [string, () => void][] = [
      ["validating", validatingStateHandler],
      ["validated", validatedStateHandler],
      ["loggingIn", loggingInStateHandler],
      ["posting", postingStateHandler],
      ["posted", postedStateHandler],
      ["error", errorStateHandler],
    ]

    stateHandlers.forEach(([stateValue, stateHandler]) => {
      if ($state.value === stateValue) stateHandler()
    })
  }
</script>

<form class="comment-form" on:submit={onSubmit}>
  <!-- svelte-ignore a11y-autofocus -->
  <textarea
    class="comment-field"
    placeholder="Your comment"
    required
    {autofocus}
    bind:value={commentText}
  />
  <!-- {#if !currentUser} -->
  <Login />
  <!-- {/if} -->
  <div class="button-row">
    {#if onCancel !== null}
      <button class="comment-cancel-button" on:click={onCancel}>Cancel</button>
    {/if}
    <button class="comment-submit-button" type="submit">Add comment</button>
  </div>
</form>
