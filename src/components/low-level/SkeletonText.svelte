<script lang="ts">
  /** Specify the number of lines to render */
  export let lines = 3

  /** Set to `true` to use the paragraph size variant */
  export let paragraph = false
  export let avatar = false

  /** Specify the width of the text (% or px) */
  export let width = "100%"
  export let height = "1rem"

  const RANDOM = [0.973, 0.153, 0.567]

  $: rows = []
  $: widthNum = parseInt(width, 10)
  $: widthPx = width.includes("px")
  $: if (paragraph) {
    for (let i = 0; i < lines; i++) {
      const min = widthPx ? widthNum - 75 : 0
      const max = widthPx ? widthNum : 75
      const rand = Math.floor(RANDOM[i % 3] * (max - min + 1)) + min + "px"
      rows = [...rows, { width: widthPx ? rand : `calc(${width} - ${rand})` }]
    }
  }
</script>

{#if paragraph}
  <div {...$$restProps}>
    {#each rows as { width }}
      <p class="skeleton line" style:width />
    {/each}
  </div>
{:else if avatar}
  <div class="skeleton avatar" />
{:else}
  <div class="skeleton line" style:width style:height />
{/if}

<style lang="scss">
  .line {
    width: 100%;
    height: 1rem;
    margin-bottom: 0.5rem;
  }
  .avatar {
    width: 2.5rem;
    height: 2.5rem;
    overflow: hidden;
  }
  .skeleton {
    position: relative;
    padding: 0;
    border: none;
    background: #e5e5e5;
    box-shadow: none;
    pointer-events: none;
    &::before {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      -webkit-animation: 3s ease-in-out skeleton infinite;
      animation: 3s ease-in-out skeleton infinite;
      background: #c6c6c6;
      content: "";
      will-change: transform-origin, transform, opacity;
    }
  }

  @keyframes skeleton {
    0% {
      opacity: 0.3;
      -webkit-transform: scaleX(0);
      transform: scaleX(0);
      -webkit-transform-origin: left;
      transform-origin: left;
    }
    20% {
      opacity: 1;
      -webkit-transform: scaleX(1);
      transform: scaleX(1);
      -webkit-transform-origin: left;
      transform-origin: left;
    }
    28% {
      -webkit-transform: scaleX(1);
      transform: scaleX(1);
      -webkit-transform-origin: right;
      transform-origin: right;
    }
    51% {
      -webkit-transform: scaleX(0);
      transform: scaleX(0);
      -webkit-transform-origin: right;
      transform-origin: right;
    }
    58% {
      -webkit-transform: scaleX(0);
      transform: scaleX(0);
      -webkit-transform-origin: right;
      transform-origin: right;
    }
    82% {
      -webkit-transform: scaleX(1);
      transform: scaleX(1);
      -webkit-transform-origin: right;
      transform-origin: right;
    }
    83% {
      -webkit-transform: scaleX(1);
      transform: scaleX(1);
      -webkit-transform-origin: left;
      transform-origin: left;
    }
    96% {
      -webkit-transform: scaleX(0);
      transform: scaleX(0);
      -webkit-transform-origin: left;
      transform-origin: left;
    }
    to {
      opacity: 0.3;
      -webkit-transform: scaleX(0);
      transform: scaleX(0);
      -webkit-transform-origin: left;
      transform-origin: left;
    }
  }
</style>
