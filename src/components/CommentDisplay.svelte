<script lang="ts">
  import { Comment, User } from "../lib/simple-comment-types"
  import { createEventDispatcher } from "svelte"
  import CommentInput from "./CommentInput.svelte"
  import { formatDate } from "../frontend-utilities"

  export let currentUser: User | undefined
  export let replies: Comment[] = []
  export let depth: number = 0
  export let showReply = ""

  const dispatch = createEventDispatcher()
  const isRoot = depth === 0

  const handleReplyEvent = event => {
    const { commentId } = event.detail
    if (isRoot) showReply = commentId
    else dispatch("reply", { commentId })
  }

  const onOpenCommentInput = commentId => () => {
    if (isRoot) showReply = commentId
    else dispatch("reply", { commentId })
  }

  const onDeleteCommentClick = commentId => () => {
     
  }

  const onCloseCommentInput = onOpenCommentInput("")

  const closeReply = () => onCloseCommentInput()

  const onCommentPosted = commentPostedEvent => {
    closeReply()
    const { comment } = commentPostedEvent.detail
    const parentComment = replies.find(reply => reply.id === comment.parentId)
    if (parentComment) {
      const hasSiblings = parentComment.replies?.length
      const siblingReplies = hasSiblings
        ? [comment, ...parentComment.replies]
        : [comment]
      const repliesWithInsertedComment = replies.map(reply =>
        reply.id === comment.parentId
          ? { ...parentComment, replies: siblingReplies }
          : reply
      )
      replies = repliesWithInsertedComment
    }
  }
</script>

<ul class="comment-replies" class:is-root={isRoot}>
  {#each replies as comment, index}
    <li class="comment" class:is-root={isRoot}>
      <header class="comment-header">
        <div class="user-avatar">
          <img
            src="https://source.unsplash.com/random/70x70"
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
        <p>{comment.text}</p>
        {#if showReply === comment.id}
          <CommentInput
            commentId={comment.id}
            {currentUser}
            onCancel={onCloseCommentInput}
            on:posted={onCommentPosted}
          />
        {:else}
          <div class="button-row">
            {#if currentUser?.isAdmin || (currentUser && currentUser?.id === comment.user?.id)}
              <button on:click={onDeleteCommentClick(comment.id)}>Delete</button
              >
            {/if}
            <button on:click={onOpenCommentInput(comment.id)}>Reply</button>
          </div>
        {/if}
      </article>
      {#if comment.replies && comment.replies.length > 0}
        <svelte:self
          replies={comment.replies}
          {currentUser}
          {showReply}
          depth={depth + 1}
          on:reply={handleReplyEvent}
        />
      {/if}
    </li>
  {/each}
</ul>
