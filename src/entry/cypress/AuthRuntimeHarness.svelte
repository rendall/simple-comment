<script lang="ts">
  import { onDestroy, onMount } from "svelte"
  import type { User } from "../../lib/simple-comment-types"
  import { currentUserStore } from "../../lib/auth/auth-stores"
  import {
    createAuthRuntime,
    provideAuthRuntime,
  } from "../../lib/auth/auth-runtime"
  import Login from "../../components/Login.svelte"
  import SelfDisplay from "../../components/SelfDisplay.svelte"

  let currentUser: User | undefined = undefined
  let showLogin = false

  const authRuntime = provideAuthRuntime(createAuthRuntime({ initialUser: currentUser }))

  const unsubscribeCurrentUserStore = currentUserStore.subscribe(value => {
    currentUser = value
  })

  const onShowLoginClick = () => {
    showLogin = true
  }

  onMount(() => {
    void authRuntime.start()
  })

  onDestroy(() => {
    unsubscribeCurrentUserStore()
    authRuntime.stop()
  })
</script>

<section class="simple-comment">
  <button id="show-login-button" type="button" on:click={onShowLoginClick}>
    Show login
  </button>

  <SelfDisplay {currentUser} />

  {#if showLogin}
    <Login {currentUser} />
  {/if}
</section>
