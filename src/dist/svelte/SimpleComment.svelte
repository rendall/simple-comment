<script lang="ts">
  import type { Discussion } from "src/lib/simple-comment"
  import { getOneDiscussion, threadDiscussionReplies } from "./../js/apiClient"
  import Comment from "./Comment.svelte"
  const discussionId = "http-localhost-8080"
  const downloadPromise = getOneDiscussion(discussionId).then(response => {
    if (typeof response === "string") throw new Error(response)
    const flatDiscussion: Discussion = response.body as Discussion
    const threadedDiscussion: Discussion =
      threadDiscussionReplies(flatDiscussion)
    return threadedDiscussion
  })
</script>

<!--
 @component
 Here's some documentation for this component. It will show up on hover for
 JavaScript/TypeScript projects using a LSP-compatible editor such as VSCode or
 Vim/Neovim with coc.nvim.

 - You can use markdown here.
 - You can use code blocks here.
 - JSDoc/TSDoc will be respected by LSP-compatible editors.
 - Indentation will be respected as much as possible.
-->

<!-- @component You can use a single line, too -->

<main>
  {#await downloadPromise}
    <!-- promise is pending -->
    <p>waiting for the promise to resolve...</p>
  {:then discussion}
    {#each discussion.replies as comment}
      <Comment {comment} />
    {/each}
  {:catch error}
    <!-- promise was rejected -->
    <p>Something went wrong: {error.message}</p>
  {/await}
</main>

<style lang="css">
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }
</style>
