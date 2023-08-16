<script lang="ts">
  import { idIconDataUrl } from "../frontend-utilities"
  import type { User } from "../lib/simple-comment-types"
  import { dispatchableStore, loginStateStore } from "../lib/svelte-stores"

  export let currentUser: User | undefined
  let loginStateValue
  let loginStateNextEvents

  loginStateStore.subscribe(state => {
    const { value, nextEvents } = state
    loginStateValue = value
    loginStateNextEvents = nextEvents
  })

  const onLogoutClick = (e: Event) => {
    e.preventDefault()
    dispatchableStore.dispatch("logoutIntent")
  }
</script>

{#if loginStateValue === "verifying" || loginStateValue === "loggingIn" || loginStateValue === "loggingOut"}
  <section class="self-display">
    <div class="self-avatar skeleton" />
    <div class="self-info skeleton" />
  </section>
{:else if currentUser}
  <section class="self-display" id="self-display">
    <div class="self-avatar">
      <img src={idIconDataUrl(currentUser.id)} alt="" />
    </div>
    <div class="self-info">
      <h2 id="self-user-name">{currentUser.name}</h2>
      <p id="self-name">
        @{currentUser.id}
        {currentUser.isAdmin ? "(admin)" : ""}
      </p>
      <p id="self-email">{currentUser.email}</p>
    </div>
    {#if loginStateNextEvents.includes("LOGOUT")}
      <button id="log-out-button" on:click={onLogoutClick}>Log out</button>
    {/if}
  </section>
{/if}
