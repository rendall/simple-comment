<script>
  export let replies = []
</script>

{#each replies as comment (comment.id)}
  <div class="comment">
    <div class="comment-header">
      <p>{comment.user ? comment.user.name : "Anonymous"} said:</p>
      <p>{comment.dateCreated}</p>
    </div>
    <div class="comment-body">
      <p>{comment.text}</p>
    </div>
    {#if comment.replies && comment.replies.length > 0}
      <div class="comment-replies">
        <svelte:self replies="comment.replies" />
      </div>
    {/if}
  </div>
{/each}
