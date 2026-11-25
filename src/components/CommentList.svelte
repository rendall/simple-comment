<script lang="ts">
  import type { Comment, User } from "../lib/simple-comment-types"
  import { createEventDispatcher } from "svelte"
  import { isResponseOk } from "../frontend-utilities"
  import { useMachine } from "@xstate/svelte"
  import { commentDeleteMachine } from "../lib/commentDelete.xstate"
  import { deleteComment } from "../apiClient"
  import CommentDisplay from "./CommentDisplay.svelte"
  import type { AuthService } from "../lib/auth-service"

  export let currentUser: User | undefined
  export let authService: AuthService
  export let replies: (Comment & { isNew?: true; isDelete?: true })[] = []
  export let depth: number = 0
  export let showReply = ""
  export let refreshDiscussion: () => void

  const { state, send } = useMachine(commentDeleteMachine)
  let deleteErrorId: string | undefined

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

  const onDeleteCommentClick = (commentId: string, reason?: string) => () => {
    deleteErrorId = undefined
    send({ type: "DELETE", commentId, reason })
  }

  const onDeleteSuccess = commentDeletedEvent => {
    const { commentId } = commentDeletedEvent.detail
    dispatch("delete", { commentId })
  }

  const deletingStateHandler = async () => {
    const { commentId, reason } = $state.context
    try {
      const response = await deleteComment(commentId, reason)
      if (isResponseOk(response)) {
        dispatch("delete", { commentId })
        send("SUCCESS")
      } else send({ type: "ERROR", error: response })
    } catch (error) {
      send({ type: "ERROR", error })
    }
  }

  const closeReply = onOpenCommentInput("")

  const onPostSuccess = commentPostedEvent => {
    closeReply()
    const { comment } = commentPostedEvent.detail
    dispatch("posted", { comment })
  }

  const onUpdateSuccess = comment => {
    closeReply()
    dispatch("updated", { comment })
  }

  const errorStateHandler = () => {
    const error = $state.context.error
    if (error) deleteErrorId = $state.context.commentId
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

<ul class="comment-replies" class:is-root={isRoot} class:is-deep={depth > 4}>
  {#each replies as comment (comment.id)}
    <CommentDisplay
      {authService}
      {comment}
      {currentUser}
      {depth}
      {handleReplyEvent}
      {onDeleteCommentClick}
      isDeleting={$state.matches("deleting") && $state.context.commentId === comment.id}
      deleteFailed={deleteErrorId === comment.id}
      {onDeleteSuccess}
      {onOpenCommentInput}
      {onPostSuccess}
      {onUpdateSuccess}
      {refreshDiscussion}
      {showReply}
    />
  {/each}
</ul>
