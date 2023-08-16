<script lang="ts">
  import type { User } from "../lib/simple-comment-types"
  import { currentUserStore } from "../lib/svelte-stores"
  import DiscussionDisplay from "./DiscussionDisplay.svelte"
  import SelfDisplay from "./SelfDisplay.svelte"
  export let discussionId
  export let title
  export let currentUser: User | undefined

  currentUserStore.subscribe(value => (currentUser = value))
</script>

<section class="simple-comment">
  <SelfDisplay {currentUser} />
  <DiscussionDisplay {currentUser} {discussionId} {title} />
</section>
