<script lang="ts">
  import type {
    Comment,
    CommentId,
    ServerResponse,
    User,
  } from "../lib/simple-comment-types"
  import InputField from "./low-level/InputField.svelte"
  import { commentPostMachine } from "../lib/commentPost.xstate"
  import { createEventDispatcher } from "svelte"
  import {
    isValidResult,
    joinValidations,
    validateDisplayName,
    validateEmail,
  } from "../lib/shared-utilities"
  import { debounceFunc, isResponseOk } from "../frontend-utilities"
  import { guestUserCreation } from "../lib/svelte-stores"
  import { postComment } from "../apiClient"
  import { useMachine } from "@xstate/svelte"
  import type { StateValue } from "xstate/lib/types"
  export let currentUser: User | undefined
  export let commentId: CommentId
  export let onCancel = null
  export let autofocus = false

  let commentText = ""
  let guestName = ""
  const GUEST_NAME_HELPER_TEXT =
    "This name will be displayed next to your comment."
  let guestNameHelperText = GUEST_NAME_HELPER_TEXT
  let guestNameStatus = ""
  let guestEmail = ""
  const GUEST_EMAIL_HELPER_TEXT = "Your email will never be shared or shown."
  let guestEmailHelperText = GUEST_EMAIL_HELPER_TEXT
  let guestEmailStatus = ""

  const { state, send } = useMachine(commentPostMachine)
  const dispatch = createEventDispatcher()

  const onSubmit = e => {
    e.preventDefault()
    const formValidationResult = checkGuestForm()
    if (isValidResult(formValidationResult)) send({ type: "SUBMIT" })
    else send({ type: "ERROR", error: formValidationResult.reason })
  }

  const checkGuestForm = () => {
    const checkEmail = validateEmail(guestEmail)
    if (!isValidResult(checkEmail)) {
      guestEmailHelperText = checkEmail.reason
      guestEmailStatus = "error"
    } else {
      guestEmailHelperText = GUEST_EMAIL_HELPER_TEXT
      guestEmailStatus = undefined
    }

    const checkName = validateDisplayName(guestName)
    if (!isValidResult(checkName)) {
      guestNameHelperText = checkName.reason
      guestNameStatus = "error"
    } else {
      guestNameHelperText = GUEST_NAME_HELPER_TEXT
      guestNameStatus = undefined
    }

    return joinValidations([checkEmail, checkName])
  }

  const validatingStateHandler = () => {
    if (currentUser) send({ type: "SUCCESS" })
    else send("CREATE_GUEST_USER")
  }

  const validatedStateHandler = () => {
    send({ type: "POST" })
  }

  const creatingGuestUserStateHandler = () => {
    const formValidationResult = checkGuestForm()

    // User creation and login is handled inside of Login.svelte
    if (isValidResult(formValidationResult))
      guestUserCreation.set({ name: guestName, email: guestEmail })
    else send({ type: "ERROR", error: formValidationResult.reason })
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

  const validateGuestName = () => {
    const result = validateDisplayName(guestName)
    if (isValidResult(result)) {
      guestNameHelperText = GUEST_NAME_HELPER_TEXT
      guestNameStatus = "success"
    } else {
      guestNameHelperText = result.reason
      guestNameStatus = "error"
    }
  }

  const validateGuestName_debounce = debounceFunc(
    validateGuestName,
    500,
    () => {
      guestNameHelperText = "..."
      guestNameStatus = ""
    }
  )

  const validateGuestEmail = () => {
    const result = validateEmail(guestEmail)
    if (isValidResult(result)) {
      guestEmailHelperText = GUEST_EMAIL_HELPER_TEXT
      guestEmailStatus = "success"
    } else {
      guestEmailHelperText = result.reason
      guestEmailStatus = "error"
    }
  }

  const validateGuestEmail_debounce = debounceFunc(
    validateGuestEmail,
    500,
    () => {
      guestEmailHelperText = "..."
      guestEmailStatus = ""
    }
  )

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

<form class="comment-form" on:submit={onSubmit}>
  <!-- svelte-ignore a11y-autofocus -->
  <textarea
    class="comment-field"
    placeholder="Your comment"
    required
    {autofocus}
    bind:value={commentText}
  />
  {#if !currentUser}
    <InputField
      bind:value={guestName}
      helperText={guestNameHelperText}
      id="guest-name"
      labelText="Display Name"
      onInput={validateGuestName_debounce}
      onBlur={validateGuestName}
      status={guestNameStatus}
      required
    />
    <InputField
      bind:value={guestEmail}
      helperText={guestEmailHelperText}
      id="guest-email"
      labelText="Email"
      onInput={validateGuestEmail_debounce}
      onBlur={validateGuestEmail}
      status={guestEmailStatus}
      required
    />
  {/if}
  <div class="button-row">
    {#if onCancel !== null}
      <button class="comment-cancel-button" on:click={onCancel}>Cancel</button>
    {/if}
    <button class="comment-submit-button" type="submit">Add comment</button>
  </div>
</form>
