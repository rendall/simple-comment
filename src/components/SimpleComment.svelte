<script lang="ts">
  import { onDestroy } from "svelte"
  import {
    createAuthService,
    type AuthService,
  } from "../lib/auth-service"
  import type { User } from "../lib/simple-comment-types"
  import { currentUserStore } from "../lib/svelte-stores"
  import DiscussionDisplay from "./DiscussionDisplay.svelte"
  import SelfDisplay from "./SelfDisplay.svelte"
  export let discussionId
  export let title
  export let currentUser: User | undefined = undefined

  const authService: AuthService = createAuthService({ initialUser: currentUser })

  currentUserStore.subscribe(value => (currentUser = value))

  onDestroy(() => authService.destroy())
</script>

<section class="simple-comment">
  <SelfDisplay {currentUser} />
  <DiscussionDisplay {authService} {currentUser} {discussionId} {title} />
</section>
