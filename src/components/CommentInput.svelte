<script lang="ts">
  import type {
    Comment,
    CommentId,
    ServerResponse,
    ServerResponseSuccess,
    TokenClaim,
    User,
  } from "../lib/simple-comment-types"
  import InputField from "./low-level/InputField.svelte"
  import { commentMachine } from "../lib/commentPost.xstate"
  import { createEventDispatcher } from "svelte"
  import { isResponseOk } from "../frontend-utilities"
  import { guestUserCreation } from "../lib/svelte-stores"
  import {
    createGuestUser,
    getGuestToken,
    postComment,
    verifySelf,
    verifyUser,
  } from "../apiClient"
  import { useMachine } from "@xstate/svelte"
  export let currentUser: User | undefined
  export let commentId: CommentId
  export let onCancel = null

  let commentText = ""
  let guestName = ""
  let guestEmail = ""

  const dispatch = createEventDispatcher()

  const onSubmit = e => {
    e.preventDefault()
    send({ type: "SUBMIT" })
  }

  const validatingStateHandler = () => {
    //TODO: validity checks
    if (currentUser) send({ type: "SUCCESS" })
    else send("CREATE_GUEST_USER")
  }
  const validatedStateHandler = () => {
    send({ type: "POST" })
  }
  const creatingGuestUserStateHandler = () => {
    guestUserCreation.set({ name: guestName, email: guestEmail })
  }

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
  }

  const errorStateHandler = () => {
    const error = $state.context.error
    const { status, statusText, ok, body } = error as ServerResponse
    if (ok) console.warn("Error handler caught an OK response", error)

    send({ type: "RESET" })
  }

  const { state, send } = useMachine(commentMachine)
  $: {
      if (
        currentUser &&
        $state.value === "creatingGuestUser" &&
        currentUser.name === guestName &&
        currentUser.email === guestEmail
      ) {
        send("SUCCESS")
      }
  }

  $: {
    const stateHandlers: [string, () => void][] = [
      ["validating", validatingStateHandler],
      ["validated", validatedStateHandler],
      ["creatingGuestUser", creatingGuestUserStateHandler],
      ["posting", postingStateHandler],
      ["posted", postedStateHandler],
      ["error", errorStateHandler],
    ]

    stateHandlers.forEach(([stateValue, stateHandler]) => {
      if ($state.value === stateValue) stateHandler()
    })
  }
</script>

<form on:submit={onSubmit}>
  <textarea
    class="discussion-reply-field"
    placeholder="Your comment"
    bind:value={commentText}
  />
  {#if !currentUser}
    <InputField labelText="Name" id="guest-name" bind:value={guestName} />
    <InputField
      bind:value={guestEmail}
      labelText="Email"
      id="guest-email"
      helperText="Your email helps with moderation, but will never be shared or shown."
    />
  {/if}
  <div class="button-row">
    {#if onCancel !== null}
      <button on:click={onCancel}>cancel</button>
    {/if}
    <button type="submit">submit</button>
  </div>
</form>
