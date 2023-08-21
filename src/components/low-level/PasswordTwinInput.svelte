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
    inputProps = rest
  }

  $: onConfirmInput_debounce()
</script>

<PasswordInput bind:value bind:togglePassword {...inputProps} />

{#if togglePassword}
  <InputField
    bind:value={confirmValue}
    labelText="Confirm password"
    type="password"
    onInput={onConfirmInput_debounce}
    status={confirmStatus}
    helperText={confirmStatus === "error" ? errorMessage : ""}
  />
{/if}
