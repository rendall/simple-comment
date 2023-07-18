<script lang="ts">
  import DiscussionDisplay from "./DiscussionDisplay.svelte"
  import Login from "./Login.svelte"

  export let discussionId
  export let title
</script>

<section class="simple-comment">
  <Login />
  <DiscussionDisplay {discussionId} {title} />
</section>
