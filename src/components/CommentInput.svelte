<script lang="ts">
  import Login from "./Login.svelte"
  import SkeletonCommentInput from "./low-level/SkeletonCommentInput.svelte"
  import type {
    Comment,
    CommentId,
    ServerResponse,
    User,
  } from "../lib/simple-comment-types"
  import type { StateValue } from "xstate"
  import { commentPostMachine } from "../lib/commentPost.xstate"
  import { createEventDispatcher, onDestroy, onMount } from "svelte"
  import { isResponseOk } from "../frontend-utilities"
  import { postComment } from "../apiClient"
  import { useMachine } from "@xstate/svelte"
  import { LoginTab } from "../lib/simple-comment-types"
  import type { AuthOutcomeState, AuthService } from "../lib/auth-service"
  export let currentUser: User | undefined
  export let commentId: CommentId
  export let authService: AuthService
  export let onCancel = null
  export let autofocus = false
  export let placeholder = "Your comment"

  let commentText = ""
  let buttonCopy: string
  let textareaRef
  let textAreaWidth = "100%"
  let textAreaHeight = "7rem"
  let loginTabSelect: LoginTab = LoginTab.guest
  let pendingAuthRequestId: string | undefined = undefined
  let authOutcomeUser: User | undefined = undefined

  const { state, send } = useMachine(commentPostMachine)
  const dispatch = createEventDispatcher()

  const onSubmit = e => {
    e.preventDefault()
    send({ type: "SUBMIT" })
  }

  const validatingStateHandler = () => {
    if (loginTabSelect === LoginTab.guest && !commentText.length) {
      send({ type: "ERROR", error: "Comment is required." })
      return
    }
    const hasCurrentUser =
      currentUser !== undefined || authOutcomeUser !== undefined
    if (hasCurrentUser) send({ type: "SUCCESS" })
    else send("LOG_IN")
  }

  const validatedStateHandler = () => {
    const hasComment = commentText && commentText.length
    if (hasComment) send("POST")
    else send("RESET")
  }

  const loggingInStateHandler = () => {
    if (pendingAuthRequestId) return

    const { requestId } = authService.requestAuth("comment-submit")

    pendingAuthRequestId = requestId
  }

  const handleAuthOutcome = (authOutcome: AuthOutcomeState) => {
    if (!pendingAuthRequestId || authOutcome.status === "none") return
    if (authOutcome.requestId !== pendingAuthRequestId) return

    pendingAuthRequestId = undefined

    switch (authOutcome.status) {
      case "success":
        authOutcomeUser = authOutcome.user
        authService.clearAuthOutcome(authOutcome.requestId)
        send("SUCCESS")
        break

      case "localValidationError":
        authService.clearAuthOutcome(authOutcome.requestId)
        send({ type: "ERROR", error: authOutcome.message })
        break

      case "remoteError":
        authService.clearAuthOutcome(authOutcome.requestId)
        send({ type: "ERROR", error: authOutcome.error })
        break

      case "cancelled":
        authService.clearAuthOutcome(authOutcome.requestId)
        send({ type: "ERROR", error: "Authentication cancelled" })
        break

      default:
        break
    }
  }

  const unsubscribeAuthOutcome = authService.authOutcome.subscribe(
    handleAuthOutcome
  )

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

  const getButtonCopy = (
    select: LoginTab,
    comment: string,
    loginStatus: string
  ) => {
    if (comment.length || loginStatus === "loggedIn") return "Add comment"
    else
      switch (select) {
        case LoginTab.signup:
          return "Sign up" // Try "Face add", "User follow", "Login" or "Add"
        case LoginTab.login:
          return "Log in" // "Login" icon
        case LoginTab.guest:
        default:
          return "Add comment" // "Add comment" icon
      }
  }

  const resizeObserver = new ResizeObserver(([textArea]) => {
    if (isProcessing) return
    const { inlineSize, blockSize } = textArea.borderBoxSize[0] ?? {
      inlineSize: "100%",
      blockSize: "7rem",
    }
    textAreaWidth = `${inlineSize}px`
    textAreaHeight = `${blockSize}px`
  })

  onMount(() => {
    resizeObserver.observe(textareaRef)
  })

  onDestroy(() => {
    unsubscribeAuthOutcome()
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

  $: isProcessing = (
    ["validating", "loggingIn", "posting", "deleting"] as StateValue[]
  ).includes($state.value)

  $: buttonCopy = getButtonCopy(
    loginTabSelect,
    commentText,
    currentUser ?? authOutcomeUser ? "loggedIn" : undefined
  )
</script>

<SkeletonCommentInput
  width={textAreaWidth}
  height={textAreaHeight}
  isHidden={!isProcessing}
/>
<form class="comment-form" class:is-hidden={isProcessing} on:submit={onSubmit}>
  <!-- svelte-ignore a11y-autofocus -->
  <textarea
    class="comment-field"
    bind:this={textareaRef}
    bind:value={commentText}
    required={loginTabSelect === LoginTab.guest}
    {autofocus}
    {placeholder}
    dir="auto"
  ></textarea>
  <Login {authService} {currentUser} bind:selectedTab={loginTabSelect} />
  {#if !currentUser || (commentText && commentText.length)}
    <div class="button-row">
      {#if onCancel !== null}
        <button class="comment-cancel-button" type="button" on:click={onCancel}
          >Cancel</button
        >
      {/if}
      <button class="comment-submit-button" type="submit">{buttonCopy}</button>
    </div>
  {/if}
</form>
