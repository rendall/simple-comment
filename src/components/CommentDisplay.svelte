<script lang="ts">
  import { Button } from "carbon-components-svelte"
  import { Comment, User } from "../lib/simple-comment"

  export let currentUser: User | undefined
  export let replies: Comment[] = []
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
</script>

{#each replies as comment}
  <div class="comment">
    <div class="comment-header">
      <p class="comment-name">
        {comment.user.name ?? "Anonymous"} said:
      </p>
      <p class="comment-date">{formatDate(comment.dateCreated)}</p>
    </div>
    <div class="comment-body">
      <p>{comment.text}</p>
      {#if comment.user.id === currentUser?.id || currentUser?.isAdmin}
        <Button>Delete</Button>
      {/if}
    </div>
    {#if comment.replies && comment.replies.length > 0}
      <div class="comment-replies">
        <svelte:self replies={comment.replies} {currentUser} />
      </div>
    {/if}
  </div>
{/each}
