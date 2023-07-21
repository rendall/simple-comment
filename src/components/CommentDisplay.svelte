<script lang="ts">
  import { Comment, User } from "../lib/simple-comment"

  export let currentUser: User | undefined
  export let replies: Comment[] = []
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  let showReply = false

  const onReplyClick = (isOn: boolean) => () => (showReply = isOn)
</script>

<ul class="comment-replies">
  {#each replies as comment}
    <li class="comment">
      <header class="comment-header">
        <div class="user-avatar">
          <img
            src="https://source.unsplash.com/random/70x70"
            alt={`${comment.user.name} avatar`}
          />
        </div>
        <p class="user-name">
          {comment.user.name ?? "Anonymous"}
        </p>
        <p class="comment-date">{formatDate(comment.dateCreated)}</p>
      </header>
      <article class="comment-body">
        <p>{comment.text}</p>
        {#if showReply}
          <textarea />
          <div class="button-row">
            <button on:click={onReplyClick(false)}>Cancel</button>
            <button>Submit</button>
          </div>
        {:else}
          <div class="button-row">
            <button on:click={onReplyClick(true)}>Reply</button>
          </div>
        {/if}
        {#if comment.replies && comment.replies.length > 0}
          <svelte:self replies={comment.replies} {currentUser} />
        {/if}
      </article>
    </li>
  {/each}
</ul>
