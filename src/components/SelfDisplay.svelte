<script lang="ts">
  import { onDestroy } from "svelte"
  import SkeletonText from "./low-level/SkeletonText.svelte"
  import type {
    AuthRuntimeSnapshot,
    AuthService,
  } from "../lib/auth-service"
  import type { User } from "../lib/simple-comment-types"
  import { fade } from "svelte/transition"
  import { idIconDataUrl } from "../frontend-utilities"

  export let authService: AuthService
  export let currentUser: User | undefined = undefined

  let authState: AuthRuntimeSnapshot["state"] | undefined
  let authNextEvents: AuthRuntimeSnapshot["nextEvents"] = []
  let isProcessing: boolean

  const unsubscribeAuthRuntimeSnapshot = authService.authRuntimeSnapshot.subscribe(
    ({ state, nextEvents }) => {
      authState = state
      authNextEvents = nextEvents
    }
  )

  onDestroy(() => {
    unsubscribeAuthRuntimeSnapshot()
  })

  $: {
    isProcessing =
      authState === undefined ||
      authState === "verifying" ||
      authState === "loggingIn" ||
      authState === "loggingOut"
  }
  const onLogoutClick = async (e: Event) => {
    e.preventDefault()
    await authService.logout()
  }
</script>

<div
  class="self-display-container"
  class:is-closed={!isProcessing && !currentUser}
>
  {#if isProcessing}
    <section class="skeleton self-display" transition:fade>
      <div class="self-avatar skeleton"><SkeletonText avatar /></div>
      <div class="self-info">
        <h2><SkeletonText width="30%" height="1.2rem" /></h2>
        <p><SkeletonText width="50%" /></p>
        <p><SkeletonText width="45%" /></p>
      </div>
      <div><SkeletonText width="7rem" height="2rem" /></div>
    </section>
  {/if}

  {#if currentUser}
    <section class="self-display" id="self-display">
      <div class="self-avatar">
        <img src={idIconDataUrl(currentUser.id)} alt="" />
      </div>
      <div class="self-info">
        <h2 id="self-user-name" dir="auto">{currentUser.name}</h2>
        <p id="self-user-id">
          @{currentUser.id}
          {currentUser.isAdmin ? "(admin)" : ""}
        </p>
        <p id="self-email">{currentUser.email}</p>
      </div>
      {#if authNextEvents.includes("LOGOUT")}
        <button id="log-out-button" on:click={onLogoutClick}>Log out</button>
      {/if}
    </section>
  {/if}
</div>

<style lang="scss">
  .self-display-container {
    display: block;
    height: 10rem;
    max-height: 10rem; /* Set the initial max-height */
    overflow: hidden; /* Hide content that exceeds the max-height */
    position: relative;
    transition: max-height 0.3s ease; /* Add a smooth transition effect */
    width: 100%;

    &.is-closed {
      max-height: 0;
    }

    .self-display.skeleton {
      position: absolute;
      width: 100%;
    }
  }
</style>
