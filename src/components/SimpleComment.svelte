<script lang="ts">
  import type { User } from "../lib/simple-comment-types"
  import DiscussionDisplay from "./DiscussionDisplay.svelte"
  import Login from "./Login.svelte"
  export let discussionId
  export let title
  export let currentUser: User | undefined

  const onLoginMessage = event => {
    currentUser = event.detail.currentUser
  }
</script>

<section class="simple-comment">
  <Login on:userChange={onLoginMessage} />
  <DiscussionDisplay {currentUser} {discussionId} {title} />
</section>
