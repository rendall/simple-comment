<script lang="ts">
  export let labelText = ""
  export let helperText = ""
  export let labelFor = ""
  export let value = ""
  export let status = ""
  export let onInput = undefined
  export let onBlur = undefined

  let inputProps = {}
  $: {
    const { labelText, helperText, value, onInput, onBlur, status, ...rest } =
      $$props
    inputProps = rest
    const { name, id } = rest
    labelFor = labelFor !== "" ? labelFor : id ?? name
  }
</script>

<div
  class="input-field"
  class:is-error={status === "error"}
  class:is-success={status === "success"}
>
  {#if labelText}
    <label class="input-label" for={labelFor}>{labelText}</label>
  {/if}
  <input
    class="input-element"
    {...inputProps}
    bind:value
    on:input={onInput}
    on:blur={onBlur}
    autocomplete="off"
    autocapitalize="off"
  />
  {#if helperText?.length > 0}
    <p class="helper-text">{helperText}</p>
  {/if}
</div>
