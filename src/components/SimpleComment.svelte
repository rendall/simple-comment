<script lang="ts">
  import { onDestroy } from "svelte"
  import {
    createAuthService,
    type AuthService,
  } from "../lib/auth-service"
  import type { User } from "../lib/simple-comment-types"
  import DiscussionDisplay from "./DiscussionDisplay.svelte"
  import SelfDisplay from "./SelfDisplay.svelte"
  export let discussionId
  export let title
  export let currentUser: User | undefined = undefined

  const authService: AuthService = createAuthService({ initialUser: currentUser })
  const unsubscribeAuthCurrentUser = authService.currentUser.subscribe(
    value => (currentUser = value)
  )

  onDestroy(() => {
    unsubscribeAuthCurrentUser()
    authService.destroy()
  })
</script>

<section class="simple-comment">
  <SelfDisplay {authService} {currentUser} />
  <DiscussionDisplay {authService} {currentUser} {discussionId} {title} />
</section>
