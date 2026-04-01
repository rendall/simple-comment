<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import { fly } from "svelte/transition"
  import InputField from "../low-level/InputField.svelte"

  export let displayName = ""
  export let displayNameHelperText = ""
  export let displayNameStatus: "error" | "success" | undefined = undefined
  export let userEmail = ""
  export let userEmailHelperText = ""
  export let userEmailStatus = ""
  export let statusMessage = ""
  export let isError = false
  export let onGuestDisplayNameInput: () => void
  export let checkDisplayNameValid: () => void
  export let onUserEmailInput: () => void
  export let checkUserEmailValid: () => void

  const dispatch = createEventDispatcher<{ submit: void }>()

  const onSubmit = (event: Event) => {
    event.preventDefault()
    dispatch("submit")
  }
</script>

<form
  class="guest-login-form login-form"
  id="guest-login-form"
  in:fly={{ y: 0, duration: 250 }}
  on:submit={onSubmit}
>
  {#if statusMessage && statusMessage.length}
    <p id="status-display" class="call-to-action" class:is-error={isError}>
      {statusMessage}
    </p>
  {:else}
    <p class="call-to-action">
      To comment as a guest, enter a display name and email below.
    </p>
  {/if}

  <InputField
    bind:value={displayName}
    helperText={displayNameHelperText}
    id="guest-name"
    labelText="Display Name"
    onInput={onGuestDisplayNameInput}
    onBlur={checkDisplayNameValid}
    status={displayNameStatus}
    required
  />
  <InputField
    bind:value={userEmail}
    helperText={userEmailHelperText}
    id="guest-email"
    labelText="Email"
    onInput={onUserEmailInput}
    onBlur={checkUserEmailValid}
    status={userEmailStatus}
    required
  />
</form>
