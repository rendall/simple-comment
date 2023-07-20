<script lang="ts">
  import type {
    LoginMachineState,
    ServerResponse,
    LoginMachineContext,
    LoginMachineEvent,
    LoginTypestate,
  } from "../lib/login.xstate"
  import type {
    BaseActionObject,
    Interpreter,
    ResolveTypegenMeta,
    ServiceMap,
    StateSchema,
    TypegenDisabled,
  } from "xstate"
  import type { AdminSafeUser } from "../lib/simple-comment"
  import { interpret } from "xstate"
  import { loginMachine } from "../lib/login.xstate"
  import { createEventDispatcher, onMount } from "svelte"
  import {
    createUser,
    deleteAuth,
    getOneUser,
    postAuth,
    verifySelf,
  } from "../apiClient"
  import { debounceFunc } from "../apiClient"
  import {
    Button,
    ContentSwitcher,
    Form,
    PasswordInput,
    SkeletonPlaceholder,
    SkeletonText,
    Switch,
    TextInput,
  } from "carbon-components-svelte"
  type LoginService = Interpreter<
    LoginMachineContext,
    StateSchema<Record<string, never>>,
    LoginMachineEvent,
    LoginTypestate,
    ResolveTypegenMeta<
      TypegenDisabled,
      LoginMachineEvent,
      BaseActionObject,
      ServiceMap
    >
  >

  let nextEvents = []
  let self: AdminSafeUser
  let isError = false
  let loginPassword = ""
  let loginUserName = ""
  let signupEmail = ""
  let signupDisplayName = ""
  let signupPassword = ""
  let signupUserName = ""
  let statusMessage = ""
  let userDisplay = ""
  let userName = ""
  let userNameManuallyChanged = false
  let userNameMessage = ""
  let userNameMessageStatus = ""
  let state: LoginMachineState
  let selectedIndex = 0

  const loginService = interpret(loginMachine).start()

  const updateStatusDisplay = (message = "", error = false) => {
    statusMessage = message
    isError = error
  }

  const onLoginClick = async (e: Event) => {
    e.preventDefault()
    loginService.send({ type: "LOGIN" })
  }

  const onSignupClick = async (e: Event) => {
    e.preventDefault()
    loginService.send({ type: "SIGNUP" })
  }

  const onLogoutClick = async () => {
    loginService.send({ type: "LOGOUT" })
  }

  /** Handler for XState "verifying" state */
  const verifyingStateHandler = loginService => {
    updateStatusDisplay("verifying")

    verifySelf()
      .then((user: AdminSafeUser) => {
        self = user
        loginService.send({ type: "SUCCESS" })
      })
      .catch(error => {
        const { body } = error
        if (body === "No Cookie header 'simple-comment-token' value")
          loginService.send({ type: "FIRST_VISIT" })
        else loginService.send({ type: "ERROR", error })
      })
  }

  const loggingInStateHandler = (loginService: LoginService) => {
    updateStatusDisplay("logging in")

    postAuth(loginUserName, loginPassword)
      .then(() => loginService.send("SUCCESS"))
      .catch(error => {
        loginService.send({ type: "ERROR", error })
      })
  }

  const signingUpStateHandler = loginService => {
    updateStatusDisplay("signing up")
    const userInfo = {
      id: signupUserName,
      name: signupDisplayName,
      email: signupEmail,
      password: signupPassword,
    }
    createUser(userInfo)
      .then(() => loginService.send("SUCCESS"))
      .catch(error => loginService.send({ type: "ERROR", error }))
  }

  const loggedInStateHandler = _loginService => {
    updateStatusDisplay("logged in")
  }

  const loggingOutStateHandler = loginService => {
    updateStatusDisplay("logging out")
    deleteAuth()
      .then(() => loginService.send("SUCCESS"))
      .catch(error => loginService.send({ type: "ERROR", error }))
  }

  const loggedOutStateHandler = _loginService => {
    updateStatusDisplay("logged out")
    self = undefined
  }

  const errorStateHandler = loginService => {
    const error = loginService.state.context.error
    const { status, statusText, ok, body } = error as ServerResponse
    if (ok) console.warn("Error handler caught an OK response", error)

    const errorMessages = [
      [
        401,
        "Policy violation: no authentication and canPublicCreateUser is false",
        "Sorry, new user registration is currently closed. Please contact the site administrator for assistance.",
      ],
      [
        401,
        "Bad credentials",
        "Oops! The password you entered is incorrect. Please try again. If you've forgotten your password, you can reset it.",
      ],
      [
        403,
        "Cannot modify root credentials",
        "Sorry, but the changes you're trying to make are not allowed. The administrator credentials you're attempting to modify are secured and can only be updated through the appropriate channels. If you need to make changes, please contact your system administrator or refer to your system documentation for the correct procedure.",
      ],
      [
        404,
        "Unknown user",
        "It seems we couldn't find an account associated with the provided username or email. Please double-check your input for any typos. If you don't have an account yet, feel free to create one. We'd love to have you join our community!",
      ],
      [
        404,
        "Authenticating user is unknown",
        "It seems there's an issue with your current session. Please log out and log back in again. If the problem persists, contact the site administrator for assistance.",
      ],
    ]

    const messageTuple = errorMessages.find(
      ([_code, text, _friendly]) => text === body
    )
    if (messageTuple) {
      const [code, _text, friendly] = messageTuple as [number, string, string]
      if (code !== status)
        console.warn(
          `Error response code ${status} does not match error message code ${code}`
        )
      updateStatusDisplay(friendly, true)
    } else updateStatusDisplay(`${status}:${statusText} ${body}`, true)
  }

  const formatUserName = displayName => {
    return displayName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "-")
  }

  const onInput = debounceFunc(async username => {
    const isValid = /^[a-z0-9-]*$/.test(username)
    document
      .getElementById("helper-signup-user-name")
      ?.removeAttribute("data-valid")
    const svg = document
      .getElementById("signup-user-name")
      ?.parentElement.querySelector(".bx--text-input__valid-icon")
    if (svg) {
      svg.remove()
    }
    if (userNameMessageStatus === "valid") {
    } else {
    }

    if (username.length === 0) {
      userNameMessage = ""
      userNameMessageStatus = ""
      return
    }

    if (!isValid) {
      userNameMessage = `Username '${username}' is not valid. Please use only lowercase letters (a-z), numbers (0-9), and hyphens (-).`
      userNameMessageStatus = "invalid"
      return
    }
    const isTooShort = username.length < 4

    if (isTooShort) {
      userNameMessage = `Username '${username}' is too short. The username must be at least 4 characters.`
      userNameMessageStatus = "invalid"
      return
    }

    const isTooLong = username.length > 30
    if (isTooLong) {
      userNameMessage = `Username '${username}' is too long.`
      userNameMessageStatus = "invalid"
      return
    }

    try {
      await getOneUser(username)
      userNameMessage = `The username '${username}' is already taken. Please try another one.`
      userNameMessageStatus = "invalid"
    } catch (error) {
      document
        .getElementById("helper-signup-user-name")
        ?.setAttribute("data-valid", "true")
      userNameMessage = "This username is available."
      userNameMessageStatus = "valid"
      let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
      svg.setAttribute("viewBox", "0 0 32 32")
      svg.setAttribute("fill", "currentColor")
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet")
      svg.setAttribute("width", "16")
      svg.setAttribute("height", "16")
      svg.setAttribute("aria-hidden", "true")
      svg.setAttribute("class", "bx--text-input__valid-icon")
      svg.innerHTML = `<defs><style> .cls-1 { fill: none; } </style> </defs> <path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2ZM14,21.5908l-5-5L10.5906,15,14,18.4092,21.41,11l1.5957,1.5859Z"/> <polygon id="inner-path" class="cls-1" points="14 21.591 9 16.591 10.591 15 14 18.409 21.41 11 23.005 12.585 14 21.591"/> <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/> ` // This is a simple checkmark path
      let inputField = document.getElementById("signup-user-name")
      inputField.parentElement.insertBefore(svg, inputField)
    }
  }, 300)

  const handleDisplayNameInput = () => {
    if (!userNameManuallyChanged) {
      userName = formatUserName(signupDisplayName)
      onInput(userName)
    }
  }

  const handleUserNameInput = () => {
    userNameManuallyChanged = true
    onInput(userName)
  }

  const handleUserNameBlur = () => {
    onInput(userName)
  }

  onMount(() => {
    const transitionHandler = _state => {
      state = _state.value
      nextEvents = _state.nextEvents
      const stateHandlers: [
        LoginMachineState,
        (loginService: LoginService) => void
      ][] = [
        ["verifying", verifyingStateHandler],
        ["loggingIn", loggingInStateHandler],
        ["signingUp", signingUpStateHandler],
        ["loggedIn", loggedInStateHandler],
        ["loggingOut", loggingOutStateHandler],
        ["loggedOut", loggedOutStateHandler],
        ["error", errorStateHandler],
      ]
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, handleState] =
        stateHandlers.find(([stateValue, _]) => _state.matches(stateValue)) ??
        []
      if (handleState) {
        handleState(loginService)
      }
    }

    loginService.onTransition(transitionHandler)
  })

  const dispatch = createEventDispatcher()

  $: {
    console.log("userChange")
    dispatch("userChange", { currentUser: self })
  }
</script>

<section class="simple-comment-login outline">
  <p id="status-display" class={isError ? "error" : ""}>{statusMessage}</p>
  {#if state === "verifying" || state === "loggingIn" || state === "loggingOut"}
    <section class="self-display">
      <div class="self-avatar">
        <SkeletonPlaceholder />
      </div>
      <div class="self-info">
        <SkeletonText heading />
        <SkeletonText paragraph lines={2} />
      </div>
      <SkeletonPlaceholder class="button-placeholder" />
    </section>
  {:else if self}
    <section class="self-display" id="self-display">
      <div class="self-avatar">
        <img src="https://source.unsplash.com/random/70x70" alt="" />
      </div>
      <div class="self-info">
        <h2 id="self-user-name">{self.name}</h2>
        <p id="self-name">@{self.id} {self.isAdmin ? "(admin)" : ""}</p>
        <p id="self-email">{self.email}</p>
      </div>
      {#if nextEvents.includes("LOGOUT")}
        <Button id="log-out-button" on:click={onLogoutClick}>Log out</Button>
      {/if}
    </section>
  {/if}
  {#if !self && nextEvents.includes("LOGOUT")}
    <Button id="log-out-button" on:click={onLogoutClick}>Log out</Button>
  {/if}

  {#if nextEvents.includes("LOGIN") || nextEvents.includes("SIGNUP")}
    <ContentSwitcher class="context-switcher" bind:selectedIndex>
      <Switch text="Log in" />
      <Switch text="Sign up" />
    </ContentSwitcher>

    {#if selectedIndex === 0}
      <Form class="login-form" id="login-form" on:submit={onLoginClick}>
        <TextInput
          id="login-user-name"
          labelText="User name"
          bind:value={loginUserName}
          required
        />
        <PasswordInput
          type="password"
          id="login-password"
          labelText="Password"
          bind:value={loginPassword}
          required
        />
        <Button type="submit">Log in</Button>
      </Form>
    {/if}

    {#if selectedIndex === 1}
      <Form class="signup-form" id="signup-form" on:submit={onSignupClick}>
        <p>
          Unlock the full power of our platform with a quick sign-up. Secure
          your ability to edit and manage your posts from any device, anytime.
          Don't just join the conversation, own it. Sign up today!
        </p>
        <TextInput
          bind:value={signupDisplayName}
          helperText="This is the name that other users will see"
          id="signup-name"
          labelText="Display name"
          on:input={handleDisplayNameInput}
        />
        <TextInput
          bind:value={userName}
          helperText={userNameMessageStatus === "valid"
            ? userNameMessage
            : "This is the name that uniquely identifies you"}
          id="signup-user-name"
          labelText="Username"
          on:blur={handleUserNameBlur}
          on:input={handleUserNameInput}
          invalidText={userNameMessageStatus === "invalid"
            ? userNameMessage
            : undefined}
          invalid={userNameMessageStatus === "invalid"}
          data-valid={userNameMessageStatus === "valid"}
        />

        <TextInput
          bind:value={signupEmail}
          helperText="Used only for verification and approved notifications. We never show or share your email."
          id="signup-email"
          labelText="Email"
          required
          type="email"
        />
        <PasswordInput
          type="password"
          id="signup-password"
          labelText="Password"
          bind:value={signupPassword}
          required
        />
        <Button type="submit">Sign up</Button>
      </Form>
    {/if}
  {/if}
  <p id="user-display">{userDisplay}</p>
</section>
