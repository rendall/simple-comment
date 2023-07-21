<script lang="ts">
  import type { ServerResponse } from "../lib/login.xstate"
  import type { AdminSafeUser } from "../lib/simple-comment-types"
  import { useMachine } from "@xstate/svelte"
  import { loginMachine } from "../lib/login.xstate"
  import { createEventDispatcher } from "svelte"
  import {
    createUser,
    deleteAuth,
    getOneUser,
    postAuth,
    verifySelf,
  } from "../apiClient"
  import {
    validateUserName,
    debounceFunc,
    isValidationTrue,
  } from "../frontend-utilities"

  let nextEvents = []
  let self: AdminSafeUser
  let isError = false
  let loginPassword = ""
  let loginUserName = ""
  let signupEmail = ""
  let signupDisplayName = ""
  let statusMessage = ""
  let userDisplay = ""
  let userNameManuallyChanged = false
  let userNameMessage = ""
  let userNameMessageStatus = ""
  let selectedIndex = 0

  const { state, send } = useMachine(loginMachine)
  const updateStatusDisplay = (message = "", error = false) => {
    statusMessage = message
    isError = error
  }

  const onLoginClick = async (e: Event) => {
    e.preventDefault()
    send({ type: "LOGIN" })
  }

  const onSignupClick = async (e: Event) => {
    e.preventDefault()
    send({ type: "SIGNUP" })
  }

  const onLogoutClick = async () => {
    send({ type: "LOGOUT" })
  }

  /** Handler for XState "verifying" state */
  const verifyingStateHandler = () => {
    updateStatusDisplay("verifying")

    verifySelf()
      .then((user: AdminSafeUser) => {
        self = user
        send({ type: "SUCCESS" })
      })
      .catch(error => {
        const { body } = error
        if (body === "No Cookie header 'simple-comment-token' value")
          send({ type: "FIRST_VISIT" })
        else send({ type: "ERROR", error })
      })
  }

  const loggingInStateHandler = () => {
    updateStatusDisplay("logging in")

    postAuth(loginUserName, loginPassword)
      .then(() => send("SUCCESS"))
      .catch(error => {
        send({ type: "ERROR", error })
      })
  }

  const signingUpStateHandler = () => {
    updateStatusDisplay("signing up")
    const userInfo = {
      id: loginUserName,
      name: signupDisplayName,
      email: signupEmail,
      password: loginPassword,
    }
    createUser(userInfo)
      .then(() => send("SUCCESS"))
      .catch(error => send({ type: "ERROR", error }))
  }

  const loggedInStateHandler = () => {
    updateStatusDisplay("logged in")
  }

  const loggingOutStateHandler = () => {
    updateStatusDisplay("logging out")
    deleteAuth()
      .then(() => send("SUCCESS"))
      .catch(error => send({ type: "ERROR", error }))
  }

  const loggedOutStateHandler = () => {
    updateStatusDisplay("logged out")
    self = undefined
  }

  const errorStateHandler = () => {
    const error = $state.context.error
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

  /** Set the green, success "valid" state on the user name input (or remove it by setting toggle to false) */
  const setValidStatus = (toggle: boolean = true) => {
    if (toggle) {
      document
        .getElementById("helper-signup-user-name")
        ?.setAttribute("data-valid", "true")
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
    } else {
      document
        .getElementById("helper-signup-user-name")
        ?.removeAttribute("data-valid")
      const svg = document
        .getElementById("signup-user-name")
        ?.parentElement.querySelector(".bx--text-input__valid-icon")
      if (svg) {
        svg.remove()
      }
    }
  }
  const checkUserNameExists = async username => {
    if (!validateUserName(username).isValid) return

    setValidStatus(false)
    try {
      await getOneUser(username)
      userNameMessage = `The username '${username}' is already taken. Please try another one.`
      userNameMessageStatus = "invalid"
    } catch (error) {
      userNameMessage = "This username is available."
      userNameMessageStatus = "valid"
      setValidStatus()
    }
  }

  const checkUserNameValid = username => {
    setValidStatus(false)
    const validation = validateUserName(username)

    if (isValidationTrue(validation)) {
      userNameMessage = ""
      userNameMessageStatus = ""
    } else {
      userNameMessageStatus = "invalid"
      userNameMessage = validation.reason
    }
  }

  const checkUserExists_debounced = debounceFunc(checkUserNameExists, 300)

  const handleDisplayNameInput = () => {
    if (!userNameManuallyChanged) {
      const formattedUserName = formatUserName(signupDisplayName)
      checkUserNameValid(formattedUserName)
      checkUserExists_debounced(formattedUserName)
      loginUserName = formattedUserName
    }
  }

  const handleUserNameInput = () => {
    userNameManuallyChanged = true
    checkUserNameValid(loginUserName)
    checkUserExists_debounced(loginUserName)
  }

  const handleUserNameBlur = () => {
    checkUserNameValid(loginUserName)
    checkUserExists_debounced(loginUserName)
  }

  $: {
    const stateHandlers: [string, () => void][] = [
      ["verifying", verifyingStateHandler],
      ["loggingIn", loggingInStateHandler],
      ["signingUp", signingUpStateHandler],
      ["loggedIn", loggedInStateHandler],
      ["loggingOut", loggingOutStateHandler],
      ["loggedOut", loggedOutStateHandler],
      ["error", errorStateHandler],
    ]

    stateHandlers.forEach(([stateValue, stateHandler]) => {
      if ($state.value === stateValue) stateHandler()
    })

    nextEvents = $state.nextEvents
  }

  const dispatch = createEventDispatcher()
  $: {
    console.log("userChange")
    dispatch("userChange", { currentUser: self })
  }
</script>

<p id="status-display" class={isError ? "error" : ""}>{statusMessage}</p>
{#if $state.value === "verifying" || $state.value === "loggingIn" || $state.value === "loggingOut"}
  <section class="self-display">
    <div class="self-avatar skeleton" />
    <div class="self-info skeleton" />
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
      <button id="log-out-button" on:click={onLogoutClick}>Log out</button>
    {/if}
  </section>
{/if}
{#if !self && nextEvents.includes("LOGOUT")}
  <button id="log-out-button" on:click={onLogoutClick}>Log out</button>
{/if}

{#if nextEvents.includes("LOGIN") || nextEvents.includes("SIGNUP")}
  {#if selectedIndex === 0}
    <form class="login-form" id="login-form" on:submit={onLoginClick}>
      <input id="login-user-name" bind:value={loginUserName} required />
      <input
        type="password"
        id="login-password"
        bind:value={loginPassword}
        required
      />
      <button type="submit">Log in</button>
    </form>
  {/if}

  {#if selectedIndex === 1}
    <form class="signup-form" id="signup-form" on:submit={onSignupClick}>
      <p>
        Unlock the full power of our platform with a quick sign-up. Secure your
        ability to edit and manage your posts from any device, anytime. Don't
        just join the conversation, own it. Sign up today!
      </p>
      <input
        bind:value={signupDisplayName}
        id="signup-name"
        on:input={handleDisplayNameInput}
      />
      <input
        bind:value={loginUserName}
        id="signup-user-name"
        on:blur={handleUserNameBlur}
        on:input={handleUserNameInput}
        data-valid={userNameMessageStatus === "valid"}
      />

      <input bind:value={signupEmail} id="signup-email" required type="email" />
      <input
        type="password"
        id="signup-password"
        bind:value={loginPassword}
        required
      />
      <button type="submit">Sign up</button>
    </form>
  {/if}
{/if}
<p id="user-display">{userDisplay}</p>
