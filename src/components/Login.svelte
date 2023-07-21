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
    isValidEmail,
    postAuth,
    verifySelf,
  } from "../apiClient"
  import {
    validateUserName,
    debounceFunc,
    isValidationTrue,
  } from "../frontend-utilities"
  import InputField from "./low-level/InputField.svelte"

  let nextEvents = []
  let self: AdminSafeUser
  let isError = false
  let loginPassword = ""
  let loginUserName = ""
  let signupEmail = ""
  let signupEmailStatus = ""
  let signupEmailHelperText =
    "Used only for verification and approved notifications. We never show or share your email."
  let signupDisplayName = ""
  let statusMessage = ""
  let userDisplay = ""
  let userNameManuallyChanged = false
  let userNameMessage = undefined
  let userNameMessageStatus = undefined
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

    const validations = [
      () =>
        userNameMessageStatus === "error"
          ? { isValid: false, reason: userNameMessage }
          : { isValid: true },
      () => checkUserEmailValid(signupEmail),
      () => validateUserName(loginUserName),
    ]
    validations.forEach(func => {
      const valid = func()
    })

    const allValid =
      validations.reduce(
        (isValid, func) => (func().isValid ? isValid : false),
        true
      ) && userNameMessageStatus !== "error"

    if (allValid) send({ type: "SIGNUP" })
    else
      send({
        type: "ERROR",
        error:
          "The signup form has errors. Please correct them and click submit again.",
      })
  }

  const onLogoutClick = async () => {
    send({ type: "LOGOUT" })
  }

  /** Handler for XState "verifying" state */
  const verifyingStateHandler = () => {
    updateStatusDisplay()

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
    updateStatusDisplay()

    postAuth(loginUserName, loginPassword)
      .then(() => send("SUCCESS"))
      .catch(error => {
        send({ type: "ERROR", error })
      })
  }

  const signingUpStateHandler = () => {
    updateStatusDisplay()
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
    updateStatusDisplay()
  }

  const loggingOutStateHandler = () => {
    updateStatusDisplay()
    deleteAuth()
      .then(() => send("SUCCESS"))
      .catch(error => send({ type: "ERROR", error }))
  }

  const loggedOutStateHandler = () => {
    updateStatusDisplay()
    self = undefined
  }

  const errorStateHandler = () => {
    const error = $state.context.error

    if (typeof error === "string") {
      updateStatusDisplay(error, true)
      return
    }

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

  const checkUserNameExists = async username => {
    if (!onSubmitCheckUserNameValid(username).isValid) return

    userNameMessage = "..."
    try {
      await getOneUser(username)
      userNameMessage = `The username '${username}' is already taken. Please try another one.`
      userNameMessageStatus = "error"
    } catch (error) {
      userNameMessage = "This username is available."
      userNameMessageStatus = "success"
    }
  }

  const checkUserExists_debounced = debounceFunc(checkUserNameExists, 300)

  const onSubmitCheckUserNameValid = username => {
    const validation = validateUserName(username)

    if (isValidationTrue(validation)) {
      userNameMessage = "..."
      userNameMessageStatus = "valid"
    } else {
      userNameMessageStatus = "error"
      userNameMessage = validation.reason
    }
    return validation
  }

  const onInputCheckUserNameValid = username => {
    const validation = validateUserName(username)
    const ignoreReasons = ["Username is too short.", "Username cannot be empty"]
    const isIgnore = validation =>
      ignoreReasons.some(ignoreReason =>
        validation.reason?.startsWith(ignoreReason)
      )

    if (isValidationTrue(validation) || isIgnore(validation)) {
      userNameMessage = "..."
      userNameMessageStatus = undefined
    } else {
      userNameMessageStatus = "error"
      userNameMessage = validation.reason
    }
  }

  const checkUserNameValid_debounced = debounceFunc(
    onInputCheckUserNameValid,
    50
  )

  const handleDisplayNameInput = () => {
    if (!userNameManuallyChanged) {
      const formattedUserName = formatUserName(signupDisplayName)
      checkUserNameValid_debounced(formattedUserName)
      checkUserExists_debounced(formattedUserName)
      loginUserName = formattedUserName
    }
  }

  const checkUserEmailValid = email => {
    if (isValidEmail(email)) {
      signupEmailHelperText = "This email address is valid."
      signupEmailStatus = "valid"
      return { isValid: true }
    } else {
      signupEmailStatus = "error"
      signupEmailHelperText =
        "This email address appears to be invalid. Please check."
      return { isValid: false, reason: signupEmailHelperText }
    }
  }

  const checkUserEmailValid_debounced = debounceFunc(checkUserEmailValid, 50)

  const handleUserEmailInput = () => checkUserEmailValid_debounced(signupEmail)

  const handleUserNameInput = () => {
    userNameManuallyChanged = true
    checkUserNameValid_debounced(loginUserName)
    checkUserExists_debounced(loginUserName)
  }

  const handleUserNameBlur = () => {
    checkUserNameValid_debounced(loginUserName)
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
    dispatch("userChange", { currentUser: self })
  }

  $: {
    if (loginUserName.length < 3 && !userNameMessageStatus)
      userNameMessage = "This is the name that uniquely identifies you"
  }
</script>

<section class="simple-comment-login">
  <p
    id="status-display"
    class:invisible={!statusMessage || statusMessage.length === 0}
    class={isError ? "error" : ""}
  >
    {statusMessage}
  </p>
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
    <div class="selection-buttons button-row">
      <button
        class="login-selection-button"
        class:selected={selectedIndex === 0}
        on:click={() => (selectedIndex = 0)}>login</button
      >
      <button
        class="signup-selection-button"
        class:selected={selectedIndex === 1}
        on:click={() => (selectedIndex = 1)}>signup</button
      >
    </div>
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
          Unlock the full power of our platform with a quick sign-up. Secure
          your ability to edit and manage your posts from any device, anytime.
          Don't just join the conversation, own it. Sign up today!
        </p>
        <InputField
          bind:value={signupDisplayName}
          helperText="This is the name that others will see"
          id="signup-name"
          labelText="Display name"
          onInput={handleDisplayNameInput}
          placeholder="Display name"
          required
        />
        <InputField
          bind:value={loginUserName}
          status={userNameMessageStatus}
          helperText={userNameMessage}
          id="signup-user-name"
          labelText="Username"
          onBlur={handleUserNameBlur}
          onInput={handleUserNameInput}
          placeholder="User handle"
        />

        <InputField
          bind:value={signupEmail}
          helperText={signupEmailHelperText}
          status={signupEmailStatus}
          id="signup-email"
          labelText="Email"
          placeholder="Email"
          required
          type="email"
          onInput={handleUserEmailInput}
        />
        <InputField
          bind:value={loginPassword}
          id="signup-password"
          labelText="Password"
          placeholder="Password"
          required
          type="password"
        />
        <button type="submit">Sign up</button>
      </form>
    {/if}
  {/if}
  <p id="user-display">{userDisplay}</p>
</section>
