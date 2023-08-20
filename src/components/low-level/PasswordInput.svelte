<script lang="ts">
  import { View, ViewOff } from "carbon-icons-svelte"
  import InputField from "./InputField.svelte"
  import IconToggle from "./IconToggle.svelte"
  export let labelText = "Password"
  export let helperText = ""
  export let labelFor = ""
  export let value = ""
  export let status = ""
  export let onInput = undefined
  export let onBlur = undefined

  let isPassword = true
  let textType: "password" | "text" = "password"
  let inputProps = {}

  const onIconClick = e => {
    e.preventDefault()
    isPassword = !isPassword
    textType = isPassword ? "password" : "text"
    console.log({isPassword, textType})
  }

  $: inputProps = {
    labelText,
    helperText,
    labelFor,
    value,
    status,
    onInput,
    onBlur,
    ...$$props,
  }
</script>

<InputField type={textType} {...inputProps} {onIconClick}>
  <IconToggle slot="icon" isOn={isPassword}>
    <View size={32} slot="on" />
    <ViewOff size={32} slot="off" />
  </IconToggle>
</InputField>
