<script lang="ts">
  import { onMount } from "svelte"
  import { isRtl } from "../lib/shared-utilities"
  import {
    formatDate,
    idIconDataUrl,
    toParagraphs,
  } from "../frontend-utilities"
  import type { Comment, User } from "../lib/simple-comment-types"
  import SkeletonCommentDelete from "./low-level/SkeletonCommentDelete.svelte"
  import CommentList from "./CommentList.svelte"
  import CommentInput from "./CommentInput.svelte"
  import CommentEdit from "./CommentEdit.svelte"

  export let comment: (Comment & { isNew?: true }) | undefined = undefined
  export let showReply: string
  export let currentUser: User | undefined
  export let onDeleteSuccess
  export let onDeleteCommentClick
  export let onOpenCommentInput
  export let onPostSuccess
  export let onUpdateSuccess
  export let depth
  export let handleReplyEvent

  const isRoot = depth === 0

  let commentDeleted
  let isEditing = false

  let commentBodyHeight = 74
  let commentBodyRef
  // Because these comments are in a list, Svelte seems to get
  // confused about local variables when one is deleted. This
  // "refs" object keeps them sorted by id.
  let refs = {}

  // Can edit for two hours
  const canEdit = (comment: Comment): boolean =>
    new Date().valueOf() - new Date(comment.dateCreated).valueOf() <= 7200000

  const onEditClick = (comment: Comment) => {
    const commentId = comment?.id
    onOpenCommentInput(commentId)()
    isEditing = true
  }

  const onCancelEditClick = () => {
    isEditing = false
    onCloseCommentInput()
  }

  const onCloseCommentInput = onOpenCommentInput("")

  const onCommentTextUpdated = text => {
    isEditing = false
    onUpdateSuccess({ ...comment, text })
  }

  const onDeleteClick = () => {
    commentDeleted = comment.id
    commentBodyHeight = refs[comment.id] ?? 74
    onDeleteCommentClick(comment.id)()
  }

  onMount(() => {
    const { offsetHeight, clientHeight } = commentBodyRef ?? {}
    commentBodyHeight = offsetHeight ?? clientHeight ?? 74
    refs = { ...refs, [comment.id]: commentBodyHeight }
  })
</script>

<li
  class="comment"
  id={comment.id}
  class:is-root={isRoot}
  class:is-deleted={comment.dateDeleted}
  class:has-replies={comment.replies?.length > 0}
  class:is-new={comment.isNew}
  class:is-open={showReply === comment.id}
>
  {#if commentDeleted === comment.id && !comment.dateDeleted}
    <SkeletonCommentDelete commentHeight={commentBodyHeight} />
  {:else if comment.dateDeleted}
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
          <button on:click={onDeleteClick}> Delete </button>
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
        <p class="user-name" dir="auto">
          {comment.user.name ?? "Anonymous"}
        </p>
        <p class="comment-date" dir="auto">{formatDate(comment.dateCreated)}</p>
      </div>
    </header>
    <article
      class="comment-body"
      bind:this={commentBodyRef}
      class:is-rtl={isRtl(comment.text)}
    >
      {#if isEditing}
        <CommentEdit
          placeholder="Your edit"
          autofocus={isRoot ? true : false}
          commentId={comment.id}
          commentText={comment.text}
          onCancel={onCancelEditClick}
          onTextUpdated={onCommentTextUpdated}
        />
      {:else}
        {#each toParagraphs(comment.text) as paragraph}
          <p dir="auto">{paragraph}</p>
        {/each}
      {/if}
      {#if showReply === comment.id && !isEditing}
        <CommentInput
          placeholder="Your reply"
          autofocus={isRoot ? true : false}
          commentId={comment.id}
          {currentUser}
          onCancel={onCloseCommentInput}
          on:posted={onPostSuccess}
        />
      {:else if !isEditing}
        <div class="button-row comment-footer">
          {#if currentUser && currentUser?.id === comment.user?.id && canEdit(comment)}
            <button
              on:click={() => onEditClick(comment)}
              class="comment-edit-button"
            >
              Edit
            </button>
          {/if}

          {#if currentUser?.isAdmin || (currentUser && currentUser?.id === comment.user?.id && !comment?.replies?.length)}
            <button on:click={onDeleteClick} class="comment-delete-button">
              Delete
            </button>
          {/if}

          <button
            on:click={onOpenCommentInput(comment.id)}
            class="comment-reply-button"
          >
            Reply
          </button>
        </div>
      {/if}
    </article>
  {/if}
  {#if comment.replies && comment.replies.length > 0}
    <CommentList
      depth={depth + 1}
      on:delete={onDeleteSuccess}
      on:posted={onPostSuccess}
      on:reply={handleReplyEvent}
      replies={comment.replies}
      {currentUser}
      {showReply}
    />
  {/if}
</li>
