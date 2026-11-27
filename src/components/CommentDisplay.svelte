<script lang="ts">
  import { onMount } from "svelte"
  import { isRtl } from "../lib/shared-utilities"
  import {
    longFormatDate,
    idIconDataUrl,
    toParagraphs,
    shortFormatDate,
  } from "../frontend-utilities"
  import type { Comment, ServerResponseError, User } from "../lib/simple-comment-types"
  import { approveComment, holdComment } from "../apiClient"
  import SkeletonCommentDelete from "./low-level/SkeletonCommentDelete.svelte"
  import DeleteIcon from "./icons/DeleteIcon.svelte"
  import CommentList from "./CommentList.svelte"
  import CommentInput from "./CommentInput.svelte"
  import CommentEdit from "./CommentEdit.svelte"
  import ReplyIcon from "carbon-icons-svelte/lib/ClosedCaptionAlt.svelte"
  import EditIcon from "carbon-icons-svelte/lib/Edit.svelte"
  import OverflowMenuHorizontal from "carbon-icons-svelte/lib/OverflowMenuHorizontal.svelte"
  import ChevronLeft from "carbon-icons-svelte/lib/ChevronLeft.svelte"
  import { linear } from "svelte/easing"
  import type { AuthService } from "../lib/auth-service"
  import { useViewerRevision } from "../lib/discussion-viewer"

  export let comment: (Comment & { isNew?: true }) | undefined = undefined
  export let showReply: string
  export let currentUser: User | undefined
  export let authService: AuthService
  export let onDeleteSuccess
  export let onDeleteCommentClick
  export let onOpenCommentInput
  export let onPostSuccess
  export let onUpdateSuccess
  export let depth
  export let handleReplyEvent
  export let refreshDiscussion: () => void
  export let isDeleting = false
  export let deleteFailed = false
  export let viewerRevision = 0

  const isRoot = depth === 0

  let isEnteringRemovalReason = false
  let removalReason = ""
  let isEditing = false
  let isOverflowToggled = false
  let isApproving = false
  let approvalError = ""
  let isEnteringHoldReason = false
  let holdReason = ""
  let isHiding = false
  let holdError = ""
  const getViewerRevision = useViewerRevision()
  let visibleViewer = viewerRevision

  const closeHoldForm = () => {
    isEnteringHoldReason = false
    holdReason = ""
  }

  const changeViewer = (revision: number) => {
    if (revision === visibleViewer) return
    visibleViewer = revision
    approvalError = ""
    isApproving = false
    holdError = ""
    isHiding = false
    closeHoldForm()
    removalReason = ""
    isEnteringRemovalReason = false
    isEditing = false
    isOverflowToggled = false
  }
  $: changeViewer(viewerRevision)

  let commentBodyHeight = 74
  let commentBodyRef
  // Because these comments are in a list, Svelte seems to get
  // confused about local variables when one is deleted. This
  // "refs" object keeps them sorted by id.
  let refs = {}

  let canEdit: (comment: Comment) => boolean
  let canDelete: (comment: Comment) => boolean
  $: isHeld = comment?.isApproved === false
  $: canApprove = isHeld && comment?.text !== null && currentUser?.isModerator
  $: canHide = comment && !comment.dateDeleted && !isHeld && comment.text !== null && currentUser?.isModerator

  const openHoldForm = () => {
    holdError = ""
    isEnteringHoldReason = true
  }

  const onHide = async () => {
    const reason = holdReason.trim()
    if (!comment || !canHide || !reason || isHiding) return
    const viewer = getViewerRevision()
    isHiding = true
    holdError = ""
    try {
      await holdComment(comment.id, reason)
      if (viewer !== getViewerRevision()) return
      closeHoldForm()
      refreshDiscussion()
    } catch (error) {
      if (viewer !== getViewerRevision()) return
      if ((error as ServerResponseError)?.status === 409) {
        holdError = "This comment is already held. Review its current state."
        closeHoldForm()
        refreshDiscussion()
      } else {
        holdError = "The comment could not be hidden. Try again."
      }
    } finally {
      if (viewer === getViewerRevision()) isHiding = false
    }
  }

  const onApprove = async () => {
    if (!canApprove || !comment || comment.text === null || isApproving) return
    const viewer = getViewerRevision()
    isApproving = true
    approvalError = ""
    try {
      await approveComment(comment.id, comment.text)
      if (viewer !== getViewerRevision()) return
      holdError = ""
      refreshDiscussion()
    } catch (error) {
      if (viewer !== getViewerRevision()) return
      if ((error as ServerResponseError)?.status === 409) {
        approvalError = "This comment changed. Review the updated text before approving it."
        refreshDiscussion()
      } else {
        approvalError = "The comment could not be approved. Try again."
      }
    } finally {
      if (viewer === getViewerRevision()) isApproving = false
    }
  }

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

  const onCommentUpdated = (updated: Comment) => {
    isEditing = false
    onUpdateSuccess(updated)
  }

  const deleteCurrentComment = (reason?: string) => {
    commentBodyHeight = refs[comment.id] ?? 74
    onDeleteCommentClick(comment.id, reason)()
  }

  const onDeleteClick = () => {
    if (currentUser?.id === comment.user?.id) deleteCurrentComment()
    else isEnteringRemovalReason = true
  }

  const onRemove = () => {
    const reason = removalReason.trim()
    if (!reason) return
    isEnteringRemovalReason = false
    removalReason = ""
    deleteCurrentComment(reason)
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
      Boolean(currentUser && (currentUser.isModerator || currentUser.id === comment.user?.id))

    if (showReply !== comment.id) isOverflowToggled = false
  }

  const toggleExpand = (
    _overflowMenu: HTMLElement,
    params?: {
      delay: number
      duration: number
      easing: (t: number) => number
      direction: "in" | "out" | "both"
    }
  ) => {
    const { delay = 0, duration = 250, easing = linear } = params

    const css = (t: number, u: number) => {
      const maxWidth = (1 - u) * 100
      return `max-width: ${maxWidth}%`
    }

    return {
      delay,
      duration,
      easing,
      css,
    }
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
  {#if isDeleting && !comment.dateDeleted}
    <SkeletonCommentDelete commentHeight={commentBodyHeight} />
  {:else if comment.dateDeleted}
    <header class="comment-header">
      <div class="user-avatar">
        <div class="gray-block"></div>
      </div>
      <div class="comment-info">
        <div class="user-name">
          <div class="gray-block"></div>
          <div class="gray-block"></div>
        </div>
        <div class="comment-date">
          <div class="gray-block"></div>
        </div>
      </div>
    </header>
    <article class="comment-body">
      <p>This comment was deleted {longFormatDate(comment.dateDeleted)}</p>
      {#if comment.deletedReason}<p>{comment.deletedReason}</p>{/if}
    </article>
  {:else if isHeld && comment.text === null}
    <article class="comment-body">
      <p>{comment.isManuallyHeld ? "Hidden pending moderation." : "This comment is awaiting moderation."}</p>
    </article>
  {:else}
    <header class="comment-header">
      <div class="user-avatar">
        <img
          src={idIconDataUrl(comment.user?.id ?? comment.id)}
          alt={`${comment.user?.name ?? "Anonymous"} avatar`}
        />
      </div>
      <div class="comment-info">
        <p class="user-name" dir="auto">
          {comment.user?.name ?? "Anonymous"}
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
      {#if isHeld}
        <p role="status">{comment.isManuallyHeld ? "Hidden pending moderation." : "Awaiting moderation."} {comment.heldReason ?? ""}</p>
      {/if}
      {#if approvalError}
        <p role="alert">{approvalError}</p>
      {/if}
      {#if holdError}
        <p role="alert">{holdError}</p>
      {/if}
      {#if deleteFailed}
        <p role="alert">The comment could not be deleted. Try again.</p>
      {/if}
      {#if isEditing}
        <CommentEdit
          placeholder="Your edit"
          autofocus={isRoot ? true : false}
          commentId={comment.id}
          commentText={comment.text}
          onCancel={onCancelEditClick}
          {onCommentUpdated}
        />
      {:else}
        {#each toParagraphs(comment.text) as paragraph}
          <p dir="auto">{paragraph}</p>
        {/each}
      {/if}
      {#if isEnteringRemovalReason}
        <form on:submit|preventDefault={onRemove}>
          <label>
            Reason for removal
            <textarea bind:value={removalReason} required></textarea>
          </label>
          <button type="submit" disabled={!removalReason.trim()}>Remove comment</button>
          <button type="button" on:click={() => { isEnteringRemovalReason = false; removalReason = "" }}>Cancel</button>
        </form>
      {:else if isEnteringHoldReason && canHide}
        <form on:submit|preventDefault={onHide}>
          <label>
            Reason for hiding
            <textarea bind:value={holdReason} required disabled={isHiding}></textarea>
          </label>
          <button type="submit" disabled={isHiding || !holdReason.trim()}>Hide comment</button>
          <button type="button" disabled={isHiding} on:click={closeHoldForm}>Cancel</button>
        </form>
      {:else if showReply === comment.id && !isEditing && !isHeld}
        <CommentInput
          {authService}
          placeholder="Your reply"
          autofocus={isRoot ? true : false}
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
          {#if !isHeld}
            <button
              on:click={onOpenCommentInput(comment.id)}
              class="comment-reply-button"
              title="Click REPLY to reply to this comment"
            >
              <ReplyIcon size={20} /> Reply
            </button>
          {/if}
          {#if isOverflowToggled}
            <div class="overflow-menu" in:toggleExpand out:toggleExpand>
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

              {#if canApprove}
                <button on:click={onApprove} disabled={isApproving}>Approve</button>
              {/if}
              {#if canHide}
                <button on:click={openHoldForm}>Hide</button>
              {/if}

              <button on:click={() => (isOverflowToggled = false)}
                ><ChevronLeft size={20} /></button
              >
            </div>
          {:else if canEdit(comment) || canDelete(comment) || canApprove || canHide}
            <button
              on:click={() => (isOverflowToggled = true)}
              class="overflow-menu-button"
              title="Click '...' to see more options for this comment"
              ><OverflowMenuHorizontal size={20} /></button
            >
          {/if}
        </div>
      {/if}
    </article>
  {/if}
  {#if comment.replies && comment.replies.length > 0}
    <CommentList
      {authService}
      depth={depth + 1}
      on:delete={onDeleteSuccess}
      on:posted={onPostSuccess}
      on:updated={event => onUpdateSuccess(event.detail.comment)}
      on:reply={handleReplyEvent}
      replies={comment.replies}
      {currentUser}
      {showReply}
      {refreshDiscussion}
      {viewerRevision}
    />
  {/if}
</li>
