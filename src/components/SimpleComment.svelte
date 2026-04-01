<script lang="ts">
  import { onDestroy, onMount } from "svelte"
  import type { User } from "../lib/simple-comment-types"
  import { currentUserStore } from "../lib/auth/auth-stores"
  import {
    createAuthRuntime,
    provideAuthRuntime,
  } from "../lib/auth/auth-runtime"
  import DiscussionDisplay from "./DiscussionDisplay.svelte"
  import SelfDisplay from "./SelfDisplay.svelte"
  export let discussionId
  export let title
  export let currentUser: User | undefined = undefined

  const authRuntime = provideAuthRuntime(
    createAuthRuntime({ initialUser: currentUser })
  )

  const unsubscribeCurrentUserStore = currentUserStore.subscribe(value => {
    currentUser = value
  })

  onMount(() => {
    void authRuntime.start()
  })

  onDestroy(() => {
    unsubscribeCurrentUserStore()
    authRuntime.stop()
  })
</script>

<section class="simple-comment">
  <SelfDisplay {currentUser} />
  <DiscussionDisplay {currentUser} {discussionId} {title} />
</section>
