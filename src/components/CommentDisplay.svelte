<script lang="ts">
  import { onMount } from "svelte"
  import { isRtl } from "../lib/shared-utilities"
  import {
    longFormatDate,
    idIconDataUrl,
    toParagraphs,
    shortFormatDate,
  } from "../frontend-utilities"
  import type { Comment, User } from "../lib/simple-comment-types"
  import SkeletonCommentDelete from "./low-level/SkeletonCommentDelete.svelte"
  import DeleteIcon from "./icons/DeleteIcon.svelte"
  import CommentList from "./CommentList.svelte"
  import CommentInput from "./CommentInput.svelte"
  import CommentEdit from "./CommentEdit.svelte"
  import {
    ClosedCaptionAlt as ReplyIcon,
    Edit as EditIcon,
    OverflowMenuHorizontal as OverflowMenuIcon,
    ChevronLeft as ChevronLeftIcon,
  } from "carbon-icons-svelte"
  import { open } from "../lib/svelte-transitions"

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
  let isOverflowToggled = false

  let commentBodyHeight = 74
  let commentBodyRef
  // Because these comments are in a list, Svelte seems to get
  // confused about local variables when one is deleted. This
  // "refs" object keeps them sorted by id.
  let refs = {}

  let canEdit = (_comment: Comment) => false
  let canDelete = (_comment: Comment) => false

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

  $: {
    // Can edit for two hours
    canEdit = (comment: Comment): boolean =>
      currentUser &&
      currentUser?.id === comment.user?.id &&
      new Date().valueOf() - new Date(comment.dateCreated).valueOf() <= 7200000
    canDelete = (comment: Comment): boolean =>
      currentUser?.isAdmin ||
      (currentUser &&
        currentUser?.id === comment.user?.id &&
        !comment?.replies?.length)

    if (showReply !== comment.id) isOverflowToggled = false
  }
</script>

<li
  class="comment"
  id={comment.id}
  class:is-root={isRoot}
  class:is-deleted={comment.dateDeleted}
  class:has-replies={comment.replies?.length > 0}
  class:is-new={comment.isNew}
  class:is-open={showReply === comment.id}
  class:is-rtl={isRtl(comment.text)}
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
      <p>This comment was deleted {longFormatDate(comment.dateDeleted)}</p>
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
        <p
          class="comment-date"
          dir="auto"
          title={longFormatDate(comment.dateCreated)}
        >
          {shortFormatDate(comment.dateCreated)}
        </p>
      </div>
    </header>
    <article class="comment-body" bind:this={commentBodyRef}>
      {#if isEditing}
        <CommentEdit
          placeholder="Your edit"
          autofocus
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
          autofocus
          commentId={comment.id}
          {currentUser}
          onCancel={onCloseCommentInput}
          on:posted={onPostSuccess}
        />
      {:else if !isEditing}
        <div
          class="button-row comment-footer"
          class:is-overflow={isOverflowToggled}
        >
          <button
            on:click={onOpenCommentInput(comment.id)}
            class="comment-reply-button"
            title="Click REPLY to reply to this comment"
          >
            <ReplyIcon size={20} /> Reply
          </button>
          {#if isOverflowToggled}
            <div class="overflow-menu" transition:open>
              {#if canEdit(comment)}
                <button
                  on:click={() => onEditClick(comment)}
                  class="comment-edit-button"
                  title="Click EDIT to edit this comment"
                >
                  <EditIcon size={20} /> Edit
                </button>
              {/if}

              {#if canDelete(comment)}
                <button
                  on:click={onDeleteClick}
                  class="comment-delete-button"
                  title="Click DELETE to delete this comment"
                >
                  <DeleteIcon size={20} /> Delete
                </button>
              {/if}

              <button on:click={() => (isOverflowToggled = false)}
                ><ChevronLeftIcon size={20} /></button
              >
            </div>
          {:else if canEdit(comment) || canDelete(comment)}
            <button
              on:click={() => (isOverflowToggled = true)}
              class="overflow-menu-button"
              title="Click '...' to see more options for this comment"
              ><OverflowMenuIcon size={20} /></button
            >
          {/if}
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
