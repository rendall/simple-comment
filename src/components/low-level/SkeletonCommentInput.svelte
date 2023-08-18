<script lang="ts">
  import SkeletonText from "./SkeletonText.svelte"
  export let isHidden = false
  export let width = "100%"
  export let height = "7rem"
</script>

<div class="skeleton-comment-input" class:is-hidden={isHidden}>
  <SkeletonText {width} {height} />
  <div class="button-row"><SkeletonText width="10rem" height="2rem" /></div>
</div>
