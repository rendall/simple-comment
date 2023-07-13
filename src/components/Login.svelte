<script lang="ts">
  import type {
    LoginMachineState,
    ServerResponse,
    LoginMachineContext,
    LoginMachineEvent,
    LoginTypestate
  } from "../lib/login.xstate"
  import type {
    BaseActionObject,
    Interpreter,
    ResolveTypegenMeta,
    ServiceMap,
    StateSchema,
    TypegenDisabled
  } from "xstate"
  import type { AdminSafeUser } from "../lib/simple-comment"
  import { interpret } from "xstate"
  import { loginMachine } from "../lib/login.xstate"
  import { onMount } from "svelte"
  import {
    createUser,
    deleteAuth,
    getOneUser,
    postAuth,
    verifySelf
  } from "../apiClient"
  import { debounceFunc } from "../apiClient"

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
  let userNameMessageColor = ""

  const loginService = interpret(loginMachine).start()

  const updateStatusDisplay = (message = "", error = false) => {
    console.log({ statusMessage: message, isError: error })
    statusMessage = message
    isError = error
  }

  const onLoginClick = async () => {
    loginService.send({ type: "LOGIN" })
  }

  const onSignupClick = async () => {
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
      password: signupPassword
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
    self=undefined
  }

  const errorStateHandler = loginService => {
    const error = loginService.state.context.error
    const { status, statusText, ok, body } = error as ServerResponse
    if (ok) console.warn("Error handler caught an OK response", error)

    const errorMessages = [
      [
        401,
        "Policy violation: no authentication and canPublicCreateUser is false",
        "Sorry, new user registration is currently closed. Please contact the site administrator for assistance."
      ],
      [
        401,
        "Bad credentials",
        "Oops! The password you entered is incorrect. Please try again. If you've forgotten your password, you can reset it."
      ],
      [
        403,
        "Cannot modify root credentials",
        "Sorry, but the changes you're trying to make are not allowed. The administrator credentials you're attempting to modify are secured and can only be updated through the appropriate channels. If you need to make changes, please contact your system administrator or refer to your system documentation for the correct procedure."
      ],
      [
        404,
        "Unknown user",
        "It seems we couldn't find an account associated with the provided username or email. Please double-check your input for any typos. If you don't have an account yet, feel free to create one. We'd love to have you join our community!"
      ],
      [
        404,
        "Authenticating user is unknown",
        "It seems there's an issue with your current session. Please log out and log back in again. If the problem persists, contact the site administrator for assistance."
      ]
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
    if (!isValid) {
      userNameMessage = `Username '${username}' is not valid. Please use only lowercase letters, numbers, and hyphens.`
      userNameMessageColor = "red"
      return
    }
    const isTooShort = username.length < 4

    if (isTooShort) {
      userNameMessage = `Username '${username}' is too short. The username must be at least 4 characters.`
      userNameMessageColor = "red"
      return
    }

    const isTooLong = username.length > 30
    if (isTooLong) {
      userNameMessage = `Username '${username}' is too long.`
      userNameMessageColor = "red"
      return
    }

    try {
      await getOneUser(username)
      userNameMessage =
        "This username is already taken. Please try another one."
      userNameMessageColor = "red"
    } catch (error) {
      userNameMessage = "This username is available."
      userNameMessageColor = "green"
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
    // Define the transition handler
    const transitionHandler = state => {
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
        ["error", errorStateHandler]
      ]
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, handleState] =
        stateHandlers.find(([stateValue, _]) => state.matches(stateValue)) ?? []
      if (handleState) handleState(loginService)
    }

    // Set the onTransition handler
    loginService.onTransition(transitionHandler)

    // Continue with the rest of your code...
  })
</script>

<section>
  <p id="status-display" class={isError ? "error" : ""}>{statusMessage}</p>
  {#if self}
    <div id="self-display">
      <p id="self-user-name">User Name: {self.id}</p>
      <p id="self-name">Name: {self.name}</p>
      <p id="self-email">Email: {self.email}</p>
      <p id="self-is-admin">Is Admin: {self.isAdmin.toString()}</p>
    </div>
  {/if}
  <div id="login-form">
    <h2>Login</h2>
    <form on:submit|preventDefault={onLoginClick}>
      <label for="login-user-name">User name:</label><br />
      <input
        type="text"
        id="login-user-name"
        bind:value={loginUserName}
        required
      /><br />
      <label for="login-password">Password:</label><br />
      <input
        type="password"
        id="login-password"
        bind:value={loginPassword}
        required
      /><br />
      <input type="submit" value="Login" />
    </form>
  </div>

  <div id="signup-form">
    <h2>Signup</h2>
    <form on:submit|preventDefault={onSignupClick}>
      <label for="signup-name">Display Name:</label><br />
      <input
        type="text"
        bind:value={signupDisplayName}
        on:input={handleDisplayNameInput}
      /><br />
      <label for="signup-user-name">User name:</label><br />
      <input
        type="text"
        bind:value={userName}
        on:input={handleUserNameInput}
        on:blur={handleUserNameBlur}
      />
      <br />
      <label for="signup-email">Email:</label><br />
      <input
        type="email"
        id="signup-email"
        bind:value={signupEmail}
        required
      /><br />
      <p style="color: {userNameMessageColor};">{userNameMessage}</p>
      <label for="signup-password">Password:</label><br />
      <input
        type="password"
        id="signup-password"
        bind:value={signupPassword}
        required
      /><br />
      <input type="submit" value="Signup" />
    </form>
  </div>
  <button id="log-out-button" on:click={onLogoutClick}>Log out</button>
  <p id="user-display">{userDisplay}</p>
</section>

<style>
  .error {
    color: red;
  }
</style>
