<script lang="ts">
  import type { User } from "../lib/simple-comment"
  import DiscussionDisplay from "./DiscussionDisplay.svelte"
  import Login from "./Login.svelte"
  import {
    Header,
    HeaderUtilities,
    HeaderAction,
    HeaderPanelLinks,
    HeaderPanelLink,
    SkipToContent,
    Content,
    Grid,
    Row,
    Column,
    Toggle,
  } from "carbon-components-svelte"
  export let discussionId
  export let title
  export let currentUser: User | undefined
  let isSideNavOpen = false
  let isOpen = false

  let isShowLogin = false

  const onLoginMessage = event => {
    console.log("loginEvent", { event })
    currentUser = event.detail.currentUser
  }

  const onToggleLoginPanel = toggleEvent =>
    (isShowLogin = toggleEvent.detail.toggled)
</script>

<section class="simple-comment" class:hide-login={!isShowLogin}>
  <!-- <Login /> -->
  <Header company="Simple Comment" bind:isSideNavOpen>
    <svelte:fragment slot="skip-to-content">
      <SkipToContent />
    </svelte:fragment>
    <HeaderUtilities>
      <HeaderAction bind:isOpen>
        <HeaderPanelLinks>
          <Toggle labelText="Login Panel" on:toggle={onToggleLoginPanel} />
        </HeaderPanelLinks>
      </HeaderAction>
    </HeaderUtilities>
  </Header>

  <Content>
    <Grid>
      <Row class="login-container"
        ><Column><Login on:userChange={onLoginMessage} /></Column></Row
      >
      <Row
        ><Column
          ><DiscussionDisplay {currentUser} {discussionId} {title} /></Column
        ></Row
      >
    </Grid>
  </Content>
</section>
