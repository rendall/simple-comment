<script lang="ts">
  import SkeletonCommentInput from "./low-level/SkeletonCommentInput.svelte"
  import type { CommentId } from "../lib/simple-comment-types"
  import { StateValue } from "xstate"
  import { commentEditMachine } from "../lib/commentEdit.xstate"
  import { onMount } from "svelte"
  import { isResponseOk } from "../frontend-utilities"
  import { putComment } from "../apiClient"
  import { useMachine } from "@xstate/svelte"
  export let commentId: CommentId
  export let onCancel = null
  export let autofocus = false
  export let placeholder = "Your comment"
  export let commentText = ""
  export let onTextUpdated

  let textareaRef
  let textAreaWidth = "100%"
  let textAreaHeight = "7rem"
  let originalText = ""
  let errorText

  const { state, send } = useMachine(commentEditMachine)

  const onSubmit = e => {
    e.preventDefault()
    send("SUBMIT")
  }

  const updatingStateHandler = async () => {
    if (commentText === originalText || commentText.trim() === "") {
      if (onCancel) onCancel()
      return
    }
    try {
      const response = await putComment(commentId, commentText)
      if (isResponseOk(response)) send({ type: "SUCCESS", commentText })
      else send({ type: "ERROR", error: response })
    } catch (error) {
      send({ type: "ERROR", error })
    }
  }

  const updatedStateHandler = () => {
    const { commentText } = $state.context
    onTextUpdated(commentText)
    send({ type: "RESET" })
  }

  const errorStateHandler = () => {
    const error = $state.context.error
    if (!error) {
      console.error("Unknown error")
      console.trace()
      errorText = "An unknown error has occured. Try reloading the page."
    } else if (typeof error === "string") {
      console.error(error)
      errorText = error
    } else if (error.ok) {
      console.warn("Error handler caught an OK response", error)
    } else {
      const { status, body } = error
      switch (status) {
        case 400:
          errorText =
            body === "Comment text is same"
              ? "The comment is identical. Edit the comment and push 'Update comment'"
              : "The comment was rejected."
          break
        default:
          errorText =
            "An unknown error has occurred. Possibly the server is unavailable. Try reloading the page."
          break
      }
    }

    // At this stage the error messages should already be present on the page

    send({ type: "RESET" })
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
    originalText = commentText
  })

  $: {
    const stateHandlers: [StateValue, () => void][] = [
      ["updating", updatingStateHandler],
      ["updated", updatedStateHandler],
      ["error", errorStateHandler],
    ]

    errorText = ""

    stateHandlers.forEach(([stateValue, stateHandler]) => {
      if ($state.value === stateValue) stateHandler()
    })
  }

  $: isProcessing = (["updating"] as StateValue[]).includes($state.value)
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
    {autofocus}
    {placeholder}
    dir="auto"
  />
  {#if errorText && errorText.length > 0}
    <p class="is-error">{errorText}</p>
  {/if}
  <div class="button-row">
    {#if onCancel !== null}
      <button class="comment-cancel-button" type="button" on:click={onCancel}>
        Cancel
      </button>
    {/if}
    <button class="comment-update-button" type="submit">Update comment</button>
  </div>
</form>
