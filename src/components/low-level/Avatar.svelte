<script lang="ts">
  import { idIconDataUrl } from "../../frontend-utilities"
  export let userId
  export let status

  $: isValid = userId && userId.length && status !== "error"
</script>

{#if isValid}
  <img src={idIconDataUrl(userId)} alt={`${userId} avatar`} class="avatar" />
{:else}
  <img alt={`empty avatar`} class="empty avatar" />
{/if}
