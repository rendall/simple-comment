<script lang="ts">
  import { Comment, ServerResponse, User } from "../lib/simple-comment-types"
  import { createEventDispatcher } from "svelte"
  import CommentInput from "./CommentInput.svelte"
  import {
    formatDate,
    idIconDataUrl,
    isResponseOk,
    toParagraphs,
  } from "../frontend-utilities"
  import { useMachine } from "@xstate/svelte"
  import { commentDeleteMachine } from "../lib/commentDelete.xstate"
  import { deleteComment } from "../apiClient"

  export let currentUser: User | undefined
  export let replies: Comment[] = []
  export let depth: number = 0
  export let showReply = ""

  const { state, send } = useMachine(commentDeleteMachine)

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

  const onCloseCommentInput = onOpenCommentInput("")

  const closeReply = () => onCloseCommentInput()

  const onCommentPosted = commentPostedEvent => {
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
    <li
      class="comment"
      id={comment.id}
      class:is-root={isRoot}
      class:is-deleted={comment.dateDeleted}
      class:has-replies={comment.replies?.length > 0}
      class:is-new={comment.new}
      class:is-open={showReply === comment.id}
    >
      {#if comment.dateDeleted}
        <header class="comment-header">
          <div class="user-avatar">
            <div class="gray-block" />
          </div>
          <div class="comment-info">
            <div class="user-name">
              <div class="gray-block" />
              <div class="gray-block" />
            </div>
            <div class="comment-date">
              <div class="gray-block" />
            </div>
          </div>
        </header>
        <article class="comment-body">
          <p>This comment was deleted {formatDate(comment.dateDeleted)}</p>
          <div class="button-row">
            {#if currentUser?.isAdmin && !comment.replies?.length}
              <button on:click={onDeleteCommentClick(comment.id)}>
                Delete
              </button>
            {/if}
          </div>
        </article>
      {:else}
        <header class="comment-header">
          <div class="user-avatar">
            <img
              src={idIconDataUrl(comment.user.id)}
              alt={`${comment.user.name} avatar`}
            />
          </div>
          <div class="comment-info">
            <p class="user-name">
              {comment.user.name ?? "Anonymous"}
            </p>
            <p class="comment-date">{formatDate(comment.dateCreated)}</p>
          </div>
        </header>
        <article class="comment-body">
          {#each toParagraphs(comment.text) as paragraph}
            <p>{paragraph}</p>
          {/each}
          {#if showReply === comment.id}
            <CommentInput
              placeholder="Your reply"
              autofocus={isRoot ? true : false}
              commentId={comment.id}
              {currentUser}
              onCancel={onCloseCommentInput}
              on:posted={onCommentPosted}
            />
          {:else}
            <div class="button-row comment-footer">
              {#if currentUser?.isAdmin || (currentUser && currentUser?.id === comment.user?.id && !comment?.replies?.length)}
                <button
                  on:click={onDeleteCommentClick(comment.id)}
                  class="comment-delete-button">Delete</button
                >
              {/if}
              <button
                on:click={onOpenCommentInput(comment.id)}
                class="comment-reply-button">Reply</button
              >
            </div>
          {/if}
        </article>
      {/if}
      {#if comment.replies && comment.replies.length > 0}
        <svelte:self
          depth={depth + 1}
          on:delete={onDeleteSuccess}
          on:reply={handleReplyEvent}
          on:posted={onCommentPosted}
          replies={comment.replies}
          {currentUser}
          {showReply}
        />
      {/if}
    </li>
  {/each}
</ul>
