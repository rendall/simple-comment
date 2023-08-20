<script lang="ts">
  import { onMount } from "svelte"
  import SkeletonText from "./SkeletonText.svelte"
  export let isHidden = false
  export let commentHeight = undefined
  let numLines = 2

  onMount(() => {
    if (commentHeight !== undefined) {
      numLines = Math.floor(commentHeight / 16)
    }
  })
</script>

<div class="skeleton-comment" class:is-hidden={isHidden}>
  <header class="comment-header">
    <div class="user-avatar"><SkeletonText avatar /></div>
    <div class="comment-info">
      <p class="user-name"><SkeletonText width="8rem" /></p>
      <p class="comment-date"><SkeletonText width="12rem" /></p>
    </div>
  </header>
  <article class="comment-body">
    <SkeletonText paragraph lines={numLines} />
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
