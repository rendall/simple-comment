<script>
  export let size = 16

  export let title = undefined

  $: labelled = $$props["aria-label"] || $$props["aria-labelledby"] || title
  $: attributes = {
    "aria-hidden": labelled ? undefined : true,
    role: labelled ? "img" : undefined,
    focusable: Number($$props["tabindex"]) === 0 ? true : undefined,
  }
</script>

<!-- <svg
  fill="currentColor"
  height={size}
  preserveAspectRatio="xMidYMid meet"
  viewBox="0 0 32 32"
  width={size}
  xmlns="http://www.w3.org/2000/svg"
  {...$$restProps}
  {...attributes}
>
  {#if title}<title>{title}</title>{/if}
  <path
    d="M29.92,16.61l-3-7A1,1,0,0,0,26,9H23V7a1,1,0,0,0-1-1H3A1,1,0,0,0,2,7V24a1,1,0,0,0,1,1H5.14a4,4,0,0,0,7.72,0h6.28a4,4,0,0,0,7.72,0H29a1,1,0,0,0,1-1V17A1,1,0,0,0,29.92,16.61ZM23,11h2.34l2.14,5H23ZM9,26a2,2,0,1,1,2-2A2,2,0,0,1,9,26Zm10.14-3H12.86a4,4,0,0,0-7.72,0H4V8H21V20.56A4,4,0,0,0,19.14,23ZM23,26a2,2,0,1,1,2-2A2,2,0,0,1,23,26Zm5-3H26.86A4,4,0,0,0,23,20V18h5Z"
  />
</svg> -->
<svg
  fill="currentColor"
  height={size}
  id="delete-icon"
  viewBox="0 0 32 32"
  width={size}
  xmlns="http://www.w3.org/2000/svg"
  {...$$restProps}
  {...attributes}
>
  <defs>
    <style>
      .cls-1 {
        fill: none;
      }
    </style>
  </defs>
  <path
    d="m29,26H12c-.2651,0-.5195-.1053-.707-.2928L2.293,16.7072c-.3906-.3906-.3906-1.0237,0-1.4143L11.293,6.2928c.1875-.1875.4419-.2928.707-.2928h17c.5522,0,1,.4478,1,1v18c0,.5522-.4478,1-1,1Zm-16.5857-2h15.5857V8h-15.5857l-8,8,8,8Z"
  />
  <polygon
    points="20.4141 16 25 11.4141 23.5859 10 19 14.5859 14.4143 10 13 11.4141 17.5859 16 13 20.5859 14.4143 22 19 17.4141 23.5859 22 25 20.5859 20.4141 16"
  />
  <rect
    id="_Transparent_Rectangle_"
    data-name="&amp;lt;Transparent Rectangle&amp;gt;"
    class="cls-1"
    width="32"
    height="32"
  />
</svg>
