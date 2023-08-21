<script lang="ts">
  import { View, ViewOff } from "carbon-icons-svelte"
  import InputField from "./InputField.svelte"

  export let value
  export let togglePassword = true
  let IconComponent = View
  let inputProps

  const onClick = e => {
    e.preventDefault()
    togglePassword = !togglePassword
  }

  $: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { value, type, ...rest } = $$props
    inputProps = rest
  }
  $: {
    IconComponent = togglePassword ? View : ViewOff
  }
</script>

<InputField
  bind:value
  type={togglePassword ? "password" : "text"}
  onIconClick={onClick}
  {...inputProps}
>
  <svelte:component this={IconComponent} slot="icon" size={32} />
</InputField>
