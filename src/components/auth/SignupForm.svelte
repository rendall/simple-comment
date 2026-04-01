<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import { fly } from "svelte/transition"
  import InputField from "../low-level/InputField.svelte"
  import PasswordTwinInput from "../low-level/PasswordTwinInput.svelte"
  import Avatar from "../low-level/Avatar.svelte"

  export let displayName = ""
  export let displayNameHelperText = ""
  export let displayNameStatus: "error" | "success" | undefined = undefined
  export let userId = ""
  export let userIdStatus: "error" | "success" | undefined = undefined
  export let userIdHelperText = ""
  export let userEmail = ""
  export let userEmailHelperText = ""
  export let userEmailStatus = ""
  export let userPassword = ""
  export let userPasswordConfirm = ""
  export let isPasswordView = true
  export let userPasswordMessage = ""
  export let userPasswordStatus: "error" | "success" | undefined = undefined
  export let statusMessage = ""
  export let isError = false
  export let onSignupDisplayNameInput: () => void
  export let checkDisplayNameValid: () => void
  export let onUserIdBlur: () => void
  export let onUserIdInput: () => void
  export let onUserEmailInput: () => void
  export let handleSignupPasswordInput: () => void

  const dispatch = createEventDispatcher<{ submit: void }>()

  const onSubmit = (event: Event) => {
    event.preventDefault()
    dispatch("submit")
  }
</script>

<form
  class="signup-form login-form"
  id="signup-form"
  in:fly={{ y: 0, duration: 250 }}
  on:submit={onSubmit}
>
  {#if statusMessage && statusMessage.length}
    <p id="status-display" class="call-to-action" class:is-error={isError}>
      {statusMessage}
    </p>
  {:else}
    <p class="call-to-action">
      Unlock the full power of our platform with a quick sign-up. Secure your
      ability to edit and manage your posts from any device, anytime. Don't
      just join the conversation, own it. Sign up today!
    </p>
  {/if}
  <InputField
    bind:value={displayName}
    helperText={displayNameHelperText}
    status={displayNameStatus}
    id="signup-name"
    labelText="Display name"
    onInput={onSignupDisplayNameInput}
    onBlur={checkDisplayNameValid}
    required
  />
  <InputField
    bind:value={userId}
    status={userIdStatus}
    helperText={userIdHelperText}
    id="signup-user-id"
    labelText="User handle"
    onBlur={onUserIdBlur}
    onInput={onUserIdInput}
  >
    <Avatar {userId} status={userIdStatus} slot="icon" />
  </InputField>

  <InputField
    bind:value={userEmail}
    helperText={userEmailHelperText}
    status={userEmailStatus}
    id="signup-email"
    labelText="Email"
    required
    type="email"
    onInput={onUserEmailInput}
  />
  <PasswordTwinInput
    bind:value={userPassword}
    bind:confirmValue={userPasswordConfirm}
    bind:isPasswordView
    id="signup-password"
    labelText="Password"
    helperText={userPasswordMessage}
    status={userPasswordStatus}
    onInput={handleSignupPasswordInput}
    required
  />
</form>
