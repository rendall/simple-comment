<script lang="ts">
  import { onDestroy, onMount } from "svelte"
  import { createAuthService, type AuthService } from "../lib/auth-service"
  import type { User } from "../lib/simple-comment-types"
  import DiscussionDisplay from "./DiscussionDisplay.svelte"
  import SelfDisplay from "./SelfDisplay.svelte"
  export let discussionId
  export let title
  export let currentUser: User | undefined = undefined

  const authService: AuthService = createAuthService({
    initialUser: currentUser,
  })
  let viewerRevision = 0
  const getViewerRevision = () => viewerRevision
  const unsubscribeAuthCurrentUser = authService.currentUser.subscribe(
    value => {
      if (
        currentUser?.id !== value?.id ||
        currentUser?.isModerator !== value?.isModerator ||
        currentUser?.isAdmin !== value?.isAdmin
      ) viewerRevision++
      currentUser = value
    }
  )

  onMount(() => {
    authService.init()
  })

  onDestroy(() => {
    unsubscribeAuthCurrentUser()
    authService.destroy()
  })
</script>

<section class="simple-comment">
  <SelfDisplay {authService} {currentUser} />
  <DiscussionDisplay {authService} {currentUser} {discussionId} {title} {viewerRevision} {getViewerRevision} />
</section>
