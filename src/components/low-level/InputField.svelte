<script lang="ts">
  export let labelText = ""
  export let helperText = ""
  export let labelFor = ""
  export let value = ""
  export let status = ""
  export let onInput = undefined
  export let onBlur = undefined
  export let onIconClick = undefined

  let inputProps = {}
  $: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { labelText, helperText, value, onInput, onBlur, status, ...rest } = $$props
    inputProps = rest
    const { name, id } = rest
    labelFor = labelFor !== "" ? labelFor : id ?? name
    console.log({rest})
  }
</script>

<div
  class="input-field"
  class:is-error={status === "error"}
  class:is-success={status === "success"}
  class:has-icon={$$slots.icon}
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
  {#if $$slots.icon}
    {#if onIconClick}
      <button on:click={onIconClick} class="icon" type="button"> <slot name="icon" /></button>
    {:else}
      <div class="icon"><slot name="icon" /></div>
    {/if}
  {/if}
  {#if helperText?.length > 0}
    <p class="helper-text">{helperText}</p>
  {/if}
</div>
