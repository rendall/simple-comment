<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import { fly } from "svelte/transition"
  import InputField from "../low-level/InputField.svelte"
  import PasswordInput from "../low-level/PasswordInput.svelte"
  import Avatar from "../low-level/Avatar.svelte"

  export let userId = ""
  export let userIdStatus: "error" | "success" | undefined = undefined
  export let loginUserIdHelperText = ""
  export let userPassword = ""
  export let userPasswordMessage = ""
  export let userPasswordStatus: "error" | "success" | undefined = undefined
  export let statusMessage = ""
  export let isError = false

  const dispatch = createEventDispatcher<{ submit: void }>()

  const onSubmit = (event: Event) => {
    event.preventDefault()
    dispatch("submit")
  }
</script>

<form
  class="user-login-form login-form"
  id="user-login-form"
  in:fly={{ y: 0, duration: 250 }}
  on:submit={onSubmit}
>
  {#if statusMessage && statusMessage.length}
    <p id="status-display" class="call-to-action" class:is-error={isError}>
      {statusMessage}
    </p>
  {:else}
    <p class="call-to-action">
      If you have an account, this is where you enter your user handle and
      password to log in.
    </p>
  {/if}
  <InputField
    id="login-user-id"
    labelText="User handle"
    helperText={loginUserIdHelperText}
    status={userIdStatus}
    bind:value={userId}
    required
  >
    <Avatar {userId} status={userIdStatus} slot="icon" />
  </InputField>

  <PasswordInput
    labelText="Password"
    helperText={userPasswordMessage}
    status={userPasswordStatus}
    id="login-password"
    bind:value={userPassword}
    required
  />
</form>
