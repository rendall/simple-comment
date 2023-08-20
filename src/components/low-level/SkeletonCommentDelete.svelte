<script lang="ts">
  import { onMount } from "svelte"
  import SkeletonText from "./SkeletonText.svelte"
  export let commentHeight = undefined
  let numLines = 1

  onMount(() => {
    if (commentHeight !== undefined) {
      /** This is all intended to make the SkeleteonCommentDelete
       * have the same height and general appearance as the comment
       * it is replacing. It is highly dependent on the styling
       * and layout of the comments. If that changes, this should change. */
      // TODO: make this size change by reference to the comment itself.
      const paragraphLines = Math.floor((commentHeight - 42) / 25)
      numLines = Math.max(paragraphLines, 1)
    } else {
      commentHeight = 92
      numLines = 1
    }
  })
</script>

<div class="skeleton-comment-delete">
  <header class="comment-header">
    <div class="user-avatar"><SkeletonText avatar /></div>
    <div class="comment-info">
      <p class="user-name"><SkeletonText width="8rem" /></p>
      <p class="comment-date"><SkeletonText width="12rem" /></p>
    </div>
  </header>
  <article
    class="comment-body"
    style={`height: ${commentHeight}px; max-height: ${commentHeight}px;`}
  >
    <SkeletonText paragraph lines={numLines} height="1.25rem" />
    <div class="button-row comment-footer">
      <SkeletonText width="7rem" height="2.5rem" />
      <SkeletonText width="7rem" height="2.5rem" />
    </div>
  </article>
</div>

<style lang="scss">
  .comment-header {
    align-items: center;
    display: flex;
    flex-direction: row;
    margin-bottom: 0.25rem;
    min-height: unset;

    p {
      margin: 0;
      padding: 0;
    }

    .user-avatar {
      flex: 0 0 3rem;
      margin-right: 0.9rem;
      display: inline-flex;
      max-width: 2.5rem;
      border-radius: 50%;
      overflow: hidden;
    }

    .comment-info {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      width: calc(100% - 3rem - 1.3rem);

      .user-name {
        margin-right: 1rem;
      }
    }
  }

  .comment-body {
    margin-left: 0.5rem;
    padding-left: 2rem;
  }
</style>
