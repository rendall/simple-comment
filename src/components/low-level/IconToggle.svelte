<script>
  export let isOn = true
</script>

{#if isOn}
  <slot name="on" />
{:else}
  <slot name="off" />
{/if}
