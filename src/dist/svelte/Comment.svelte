<script lang="ts">
  import type { Comment } from "../../lib/simple-comment"
  export let comment: Comment
</script>

<article>
  {comment.text}
  {#if comment.replies}
    {#each comment.replies as reply}
      <svelte:self comment={reply} />
    {/each}
  {/if}
</article>
