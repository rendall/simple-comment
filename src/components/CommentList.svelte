<script lang="ts">
  import type {
    Comment,
    ServerResponse,
    User,
  } from "../lib/simple-comment-types"
  import { createEventDispatcher } from "svelte"
  import { isResponseOk } from "../frontend-utilities"
  import { useMachine } from "@xstate/svelte"
  import { commentDeleteMachine } from "../lib/commentDelete.xstate"
  import { deleteComment } from "../apiClient"
  import CommentDisplay from "./CommentDisplay.svelte"

  export let currentUser: User | undefined
  export let replies: (Comment & { isNew?: true; isDelete?: true })[] = []
  export let depth: number = 0
  export let showReply = ""

  const { state, send } = useMachine(commentDeleteMachine)

  //TODO: Loosen tight coupling of CommentDisplay and CommentList
  // The refactor of splitting one component into CommentList and
  // CommentDisplay created a spaghetti of calls and pass-throughs.
  // For instance, follow what happens when a user presses "Cancel"
  // in CommentInput. Store may be more appropriate here.
  const dispatch = createEventDispatcher()
  const isRoot = depth === 0

  const handleReplyEvent = event => {
    const { commentId } = event.detail
    if (isRoot) showReply = commentId
    dispatch("reply", { commentId })
  }

  const onOpenCommentInput = commentId => () => {
    dispatch("reply", { commentId })
  }

  const onDeleteCommentClick = commentId => () => {
    send({ type: "DELETE", commentId })
  }

  const onDeleteSuccess = commentDeletedEvent => {
    const { commentId } = commentDeletedEvent.detail
    dispatch("delete", { commentId })
  }

  const deletingStateHandler = async () => {
    const commentId = $state.context.commentId
    try {
      const response = await deleteComment(commentId)
      if (isResponseOk(response)) {
        dispatch("delete", { commentId })
        send("SUCCESS")
      } else send({ type: "ERROR", error: response })
    } catch (error) {
      send({ type: "ERROR", error })
    }
  }

  const closeReply = onOpenCommentInput("")

  const onCommentPosted = commentPostedEvent => {
    //TODO: Add error handling for bad onCommentPosted
    closeReply()
    const { comment } = commentPostedEvent.detail
    dispatch("posted", { comment })
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

    send({ type: "RESET" })
  }

  $: {
    const stateHandlers: [string, () => void][] = [
      ["deleting", deletingStateHandler],
      ["error", errorStateHandler],
    ]

    stateHandlers.forEach(([stateValue, stateHandler]) => {
      if ($state.value === stateValue) stateHandler()
    })
  }
</script>

<ul class="comment-replies" class:is-root={isRoot}>
  {#each replies as comment}
    <CommentDisplay
      {comment}
      {currentUser}
      {depth}
      {handleReplyEvent}
      {onCommentPosted}
      {onDeleteCommentClick}
      {onDeleteSuccess}
      {onOpenCommentInput}
      {showReply}
    />
  {/each}
</ul>
