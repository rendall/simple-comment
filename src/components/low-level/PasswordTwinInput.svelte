<script lang="ts">
  import { debounceFunc } from "../../frontend-utilities"
  import InputField from "./InputField.svelte"
  import PasswordInput from "./PasswordInput.svelte"

  export let value
  export let errorMessage = ""

  let togglePassword = true
  let inputProps

  let confirmValue = ""
  let confirmStatus = ""
  let confirmId

  const onConfirmInput = () => {
    if (togglePassword && confirmValue.length > 0 && confirmValue !== value) {
      confirmStatus = "error"
      errorMessage = "Passwords do not match."
    } else {
      confirmStatus = ""
      errorMessage = ""
    }
  }

  const onConfirmInput_debounce = debounceFunc(onConfirmInput, 500)

  $: {
    const { value, ...rest } = $$props
    const { id } = rest
    confirmId = `${id}-confirm`
    inputProps = rest
  }
</script>

<fieldset
  class="password-twin"
  class:is-error={confirmStatus === "error"}
  class:view={togglePassword}
  class:view-off={!togglePassword}
>
  <PasswordInput bind:value bind:togglePassword {...inputProps} />

  {#if togglePassword}
    <InputField
      bind:value={confirmValue}
      labelText="Confirm password"
      type="password"
      id={confirmId}
      onInput={onConfirmInput_debounce}
      status={confirmStatus}
      helperText={confirmStatus === "error" ? errorMessage : ""}
    />
  {/if}
</fieldset>
