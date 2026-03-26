<script lang="ts">
  import View from "carbon-icons-svelte/lib/View.svelte"
  import ViewOff from "carbon-icons-svelte/lib/ViewOff.svelte"
  import InputField from "./InputField.svelte"

  export let value
  export let togglePassword = true
  let IconComponent: typeof View
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
