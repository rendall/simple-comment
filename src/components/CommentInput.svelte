<script lang="ts">
  import Login from "./Login.svelte"
  import SkeletonCommentInput from "./low-level/SkeletonCommentInput.svelte"
  import type {
    AuthControllerSnapshot,
    AuthOutcome,
  } from "../lib/auth/auth-controller"
  import type {
    Comment,
    CommentId,
    ServerResponse,
    User,
  } from "../lib/simple-comment-types"
  import type { StateValue } from "xstate"
  import { commentPostMachine } from "../lib/commentPost.xstate"
  import { createEventDispatcher, onDestroy, onMount } from "svelte"
  import type { StoredLoginTab } from "../lib/auth/auth-storage"
  import { useAuthRuntime } from "../lib/auth/auth-runtime"
  import { isResponseOk } from "../frontend-utilities"
  import { postComment } from "../apiClient"
  import { useMachine } from "@xstate/svelte"
  import { LoginTab } from "../lib/simple-comment-types"
  export let currentUser: User | undefined
  export let commentId: CommentId
  export let onCancel = null
  export let autofocus = false
  export let placeholder = "Your comment"

  let commentText = ""
  let buttonCopy: string
  let loginStateValue
  let textareaRef
  let textAreaWidth = "100%"
  let textAreaHeight = "7rem"
  let loginTabSelect: LoginTab = LoginTab.guest
  let hasPendingAuthRequest = false
  let authOutcome: AuthOutcome = { kind: "idle" }
  let handledAuthOutcomeRequestId: number | undefined

  const { state, send } = useMachine(commentPostMachine)
  const dispatch = createEventDispatcher()
  const authController = useAuthRuntime().controller
  let authSnapshot: AuthControllerSnapshot = authController.getSnapshot()

  const loginTabToStoredLoginTab = (tab: LoginTab): StoredLoginTab =>
    ({
      [LoginTab.guest]: "guest",
      [LoginTab.login]: "login",
      [LoginTab.signup]: "signup",
    })[tab]

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
      authSnapshot.currentUser !== undefined || authSnapshot.state === "loggedIn"
    if (hasCurrentUser) send({ type: "SUCCESS" })
    else send("LOG_IN")
  }

  const validatedStateHandler = () => {
    const hasComment = commentText && commentText.length
    if (hasComment) send("POST")
    else send("RESET")
  }

  const loggingInStateHandler = () => {
    if (hasPendingAuthRequest) return

    authController.requestAuthUi({
      preferredTab: loginTabToStoredLoginTab(loginTabSelect),
      reason: "comment-submit",
    })
    hasPendingAuthRequest = true
  }

  const syncFromAuthSnapshot = (snapshot: AuthControllerSnapshot) => {
    authSnapshot = snapshot
    loginTabSelect = ({
      guest: LoginTab.guest,
      login: LoginTab.login,
      signup: LoginTab.signup,
    })[snapshot.uiTab]
    authOutcome = snapshot.authOutcome
    loginStateValue = snapshot.state

    const commentInputStateValue = $state.value

    //TODO: This state handling should be done via XState, probably by combining these state machines
    switch (commentInputStateValue) {
      case "loggingIn":
        switch (authOutcome.kind) {
          case "success":
            if (handledAuthOutcomeRequestId === authOutcome.requestId) break
            handledAuthOutcomeRequestId = authOutcome.requestId
            hasPendingAuthRequest = false
            setTimeout(() => {
              send("SUCCESS")
              authController.clearAuthOutcome()
            }, 1)
            break
          case "localValidationError":
          case "authError":
            if (handledAuthOutcomeRequestId === authOutcome.requestId) break
            handledAuthOutcomeRequestId = authOutcome.requestId
            hasPendingAuthRequest = false
            setTimeout(() => {
              send({ type: "ERROR", error: authOutcome.error })
              authController.clearAuthOutcome()
            }, 1)
            break

          default:
            break
        }
        break

      default:
        break
    }
  }

  const unsubscribeAuthController = authController.subscribe(syncFromAuthSnapshot)

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
      send({ type: "RESET" })
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
    unsubscribeAuthController()
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

  $: {
    if ($state.value !== "loggingIn") {
      hasPendingAuthRequest = false
      handledAuthOutcomeRequestId = undefined
    }
  }

  $: buttonCopy = getButtonCopy(loginTabSelect, commentText, loginStateValue)
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
  <Login {currentUser} />
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
