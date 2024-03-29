<script lang="ts">
  import SkeletonText from "./low-level/SkeletonText.svelte"
  import type { User } from "../lib/simple-comment-types"
  import { dispatchableStore, loginStateStore } from "../lib/svelte-stores"
  import { fade } from "svelte/transition"
  import { idIconDataUrl } from "../frontend-utilities"

  export let currentUser: User | undefined = undefined

  let loginStateValue
  let loginStateNextEvents
  let isProcessing = true

  loginStateStore.subscribe(state => {
    const { state: stateValue, nextEvents, select } = state
    if (select !== undefined) return
    loginStateValue = stateValue
    loginStateNextEvents = nextEvents
  })

  $: {
    isProcessing =
      loginStateValue === "verifying" ||
      loginStateValue === "loggingIn" ||
      loginStateValue === "loggingOut"
  }
  const onLogoutClick = (e: Event) => {
    e.preventDefault()
    dispatchableStore.dispatch("logoutIntent")
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
      {#if loginStateNextEvents?.includes("LOGOUT")}
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
