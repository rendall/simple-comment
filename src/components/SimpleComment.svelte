<script lang="ts">
  import DiscussionDisplay from "./DiscussionDisplay.svelte"
  import Login from "./Login.svelte"
  import { OrderedList, ListItem, SkeletonPlaceholder, SkeletonText } from "carbon-components-svelte"

  export let discussionId
  export let title
</script>

<section class="simple-comment">
  <SkeletonText/>
  <SkeletonPlaceholder/>
  <Login />
  <DiscussionDisplay {discussionId} {title} />
  <OrderedList>
    <ListItem>Ordered list item</ListItem>
    <ListItem>Ordered list item</ListItem>
    <ListItem>Ordered list item</ListItem>
  </OrderedList>
</section>
