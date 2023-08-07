<script lang="ts">
  import type {
    AdminSafeUser,
    ServerResponse,
    ServerResponseSuccess,
    TokenClaim,
    ValidationResult,
  } from "../lib/simple-comment-types"
  import { useMachine } from "@xstate/svelte"
  import { loginMachine } from "../lib/login.xstate"
  import {
    createGuestUser,
    createUser,
    deleteAuth,
    getGuestToken,
    getOneUser,
    isValidEmail,
    postAuth,
    verifySelf,
    verifyUser,
  } from "../apiClient"
  import {
    debounceFunc,
    isValidationTrue,
    isResponseOk,
    validatePassword,
    validateUserId,
  } from "../frontend-utilities"
  import InputField from "./low-level/InputField.svelte"
  import {
    currentUserStore,
    dispatchableStore,
    guestUserCreation,
    loginState,
  } from "../lib/svelte-stores"
  import { isValidResult, joinValidations, validateDisplayName, validateEmail } from "../lib/shared-utilities"

  let nextEvents = []
  let self: AdminSafeUser
  let isError = false
  let loginPassword = ""
  let loginUserId = ""
  let signupEmail = ""
  let signupEmailStatus = ""
  let signupEmailHelperText =
    "Used only for verification and approved notifications. We never show or share your email."
  let displayName = ""
  const DISPLAY_NAME_HELPER_TEXT = "This is the name that others will see"
  let displayNameHelperText = DISPLAY_NAME_HELPER_TEXT
  let displayNameStatus: "error" | "success" | undefined = undefined

  let statusMessage = ""
  let userNameManuallyChanged = false
  let userNameMessage = undefined
  let userNameMessageStatus = undefined
  let signupPasswordMessage = undefined
  let signupPasswordStatus = undefined

  enum Tab {
    guest,
    login,
    signup,
  }

  let selectedIndex = Tab.guest

  const { state, send } = useMachine(loginMachine)
  const updateStatusDisplay = (message = "", error = false) => {
    statusMessage = message
    isError = error
  }

  const onGuestClick = async (e:Event) => {

    e.preventDefault()

    const validations = [() => validateDisplayName(displayName), () => validateEmail(signupEmail)].map(validation => validation())
    const result = joinValidations(validations)

    if (isValidResult(result)) send({type:"GUEST", guest:{name:displayName, email:signupEmail}})
    else send({type:"ERROR", error:result.reason })
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
      () => validateUserId(loginUserId),
      () => validatePassword(loginPassword),
    ]

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

  /** Handler for XState "verifying" state */
  const verifyingStateHandler = () => {
    updateStatusDisplay()

    verifySelf()
      .then((user: AdminSafeUser) => {
        self = user
        send({ type: "SUCCESS" })
      })
      .catch(error => {
        const { status } = error
        if (status === 401)
          send({ type: "FIRST_VISIT" })
        else send({ type: "ERROR", error })
      })
  }

  const loggingInStateHandler = () => {
    updateStatusDisplay()

    postAuth(loginUserId, loginPassword)
      .then(() => send("SUCCESS"))
      .catch(error => {
        send({ type: "ERROR", error })
      })
  }

  const signingUpStateHandler = () => {
    updateStatusDisplay()
    const userInfo = {
      id: loginUserId,
      name: displayName,
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
    console.log("loggingOutStateHndler")
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
    if (!error) {
      updateStatusDisplay(
        "Apologies. An unknown error occurred. Please reload the page and try again. If the error persists, contact the site administrator",
        true
      )
      console.error("Unknown error")
      console.trace()
      return
    }

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

  const checkUserIdExists_debounced = debounceFunc(checkUserNameExists, 300)

  const onSubmitCheckUserNameValid = username => {
    const validation = validateUserId(username)

    if (isValidationTrue(validation)) {
      userNameMessage = "..."
      userNameMessageStatus = "success"
    } else {
      userNameMessageStatus = "error"
      userNameMessage = validation.reason
    }
    return validation
  }

  const onInputCheckUserNameValid = username => {
    const validation = validateUserId(username)
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

  const checkUserIdValid_debounced = debounceFunc(
    onInputCheckUserNameValid,
    50
  )

  const checkDisplayNameValid = ():ValidationResult => {
    const result = validateDisplayName(displayName)
    if (isValidResult(result)) {
      displayNameHelperText = "     "
      displayNameStatus = "success"
      return {isValid:true}
    } else {
      displayNameHelperText = result.reason
      displayNameStatus = "error"
      return result
    }
  }
  const checkDisplayName_debounced = debounceFunc(checkDisplayNameValid, 1000)

  const handleDisplayNameInput = () => {
    displayNameHelperText = "..."
    displayNameStatus = undefined
    checkDisplayName_debounced()
    if (!userNameManuallyChanged) {
      const formattedUserName = formatUserName(displayName)
      checkUserIdValid_debounced(formattedUserName)
      checkUserIdExists_debounced(formattedUserName)
      loginUserId = formattedUserName
    }
  }

  const checkUserEmailValid = () => {
    if (isValidEmail(signupEmail)) {
      signupEmailHelperText = " "
      signupEmailStatus = "success"
      return { isValid: true }
    } else {
      signupEmailStatus = "error"
      signupEmailHelperText =
        "This email address is invalid."
      return { isValid: false, reason: signupEmailHelperText }
    }
  }

  const checkUserEmailValid_debounced = debounceFunc(checkUserEmailValid, 1000)
  const handleUserEmailInput = () => {
    signupEmailHelperText = "..."
    signupEmailStatus = undefined

    checkUserEmailValid_debounced()
  }

  const handleUserNameInput = () => {
    userNameManuallyChanged = true
    checkUserIdValid_debounced(loginUserId)
    checkUserIdExists_debounced(loginUserId)
  }

  const handleUserNameBlur = () => {
    checkUserIdValid_debounced(loginUserId)
    checkUserIdExists_debounced(loginUserId)
  }

  const guestLoggingInStateHandler = () => {
    const { name, email } = $state.context.guest
    getGuestToken()
      .then(() => verifyUser())
      .then((response: ServerResponseSuccess<TokenClaim>) => response.body.user)
      .then(id => createGuestUser({ id, name, email }))
      .then(response => {
        if (isResponseOk(response)) send("SUCCESS")
        else send("ERROR", response)
      })
      .catch(error => send("ERROR", error))
  }

  dispatchableStore.subscribe(event => {
    switch (event.name) {
      case "logoutIntent":
        const canLogout = nextEvents.includes("LOGOUT")
        console.log("dispatchableStore", {event, nextEvents, stateValue: $state.value, canLogout})
        if (canLogout) send("LOGOUT")
        break

      default:
        // Intentionally left blank.  Do not respond to other events.
        break
    }
  })

  guestUserCreation.subscribe(({ name, email }) => {
    if (name && email) {
      const guest = { name, email }
      send({ type: "GUEST", guest })
    }
  })

  $: {
    const stateHandlers: [string, () => void][] = [
      ["verifying", verifyingStateHandler],
      ["guestLoggingIn", guestLoggingInStateHandler],
      ["loggingIn", loggingInStateHandler],
      ["signingUp", signingUpStateHandler],
      ["loggedIn", loggedInStateHandler],
      ["loggingOut", loggingOutStateHandler],
      ["loggedOut", loggedOutStateHandler],
      ["error", errorStateHandler],
    ]

    nextEvents = $state.nextEvents

    loginState.set({ value: $state.value, nextEvents })

    stateHandlers.forEach(([stateValue, stateHandler]) => {
      if ($state.value === stateValue) stateHandler()
    })
  }

  const onInputValidatePassword = password => {
    const validation = validatePassword(password)

    if (isValidationTrue(validation)) {
      signupPasswordMessage = "..."
      signupPasswordStatus = undefined
    } else {
      signupPasswordStatus = "error"
      signupPasswordMessage = validation.reason
    }
  }

  const checkPasswordValid_debounced = debounceFunc(
    onInputValidatePassword,
    500
  )
  const handleSignupPasswordInput = () =>
    checkPasswordValid_debounced(loginPassword)

  $: {
    currentUserStore.set(self)
  }

  $: {
    if (loginUserId.length < 3 && !userNameMessageStatus)
      userNameMessage = "This is the name that uniquely identifies you"
  }
</script>

<section class="simple-comment-login">
  {#if !self}
  <p id="status-display" class={isError ? "is-error" : ""}>
    {statusMessage}
  </p>

  <div class="selection-tabs button-row">
    {#if nextEvents.includes("LOGIN")}
      <button
        class="selection-tab selection-tab-login"
        class:selected={selectedIndex === Tab.login}
        on:click={() => (selectedIndex = Tab.login)}>Login</button
      >
    {/if}
    {#if nextEvents.includes("SIGNUP")}
      <button
        class="selection-tab selection-tab-signup"
        class:selected={selectedIndex === Tab.signup}
        on:click={() => (selectedIndex = Tab.signup)}>Signup</button
      >
    {/if}
    {#if !self}
      <button
        class="selection-tab selection-tab-guest"
        class:selected={selectedIndex === Tab.guest}
        on:click={() => (selectedIndex = Tab.guest)}>Guest</button
      >
    {/if}
  </div>
  {#if nextEvents.includes("LOGIN") || nextEvents.includes("SIGNUP")}
    {#if selectedIndex === Tab.guest}
      <form
        class="guest-login-form"
        id="guest-login-form"
        on:submit={onGuestClick}
      >
        <InputField
          bind:value={displayName}
          helperText={displayNameHelperText}
          id="guest-name"
          labelText="Display Name"
          onInput={handleDisplayNameInput}
          onBlur={checkDisplayNameValid}
          status={displayNameStatus}
          required
        />
        <InputField
          bind:value={signupEmail}
          helperText={signupEmailHelperText}
          id="guest-email"
          labelText="Email"
          onInput={handleUserEmailInput}
          onBlur={checkUserEmailValid}
          status={signupEmailStatus}
          required
        />
      </form>
    {/if}

    {#if selectedIndex === Tab.login}
      <form
        class="login-form"
        id="login-form"
        on:submit={onLoginClick}
      >
        <InputField
          id="login-user-name"
          labelText="User handle"
          bind:value={loginUserId}
          required
        />
        <InputField
          type="password"
          labelText="Password"
          id="login-password"
          bind:value={loginPassword}
          required
        />
      </form>
    {/if}

    {#if selectedIndex === Tab.signup}
      <form class="signup-form" id="signup-form" on:submit={onSignupClick}>
        <p>
          Unlock the full power of our platform with a quick sign-up. Secure
          your ability to edit and manage your posts from any device, anytime.
          Don't just join the conversation, own it. Sign up today!
        </p>
        <InputField
          bind:value={displayName}
          helperText="This is the name that others will see"
          id="signup-name"
          labelText="Display name"
          onInput={handleDisplayNameInput}
          onBlur={checkDisplayNameValid}
          required
        />
        <InputField
          bind:value={loginUserId}
          status={userNameMessageStatus}
          helperText={userNameMessage}
          id="signup-user-name"
          labelText="User handle"
          onBlur={handleUserNameBlur}
          onInput={handleUserNameInput}
        />

        <InputField
          bind:value={signupEmail}
          helperText={signupEmailHelperText}
          status={signupEmailStatus}
          id="signup-email"
          labelText="Email"
          required
          type="email"
          onInput={handleUserEmailInput}
        />
        <InputField
          bind:value={loginPassword}
          id="signup-password"
          labelText="Password"
          helperText={signupPasswordMessage}
          status={signupPasswordStatus}
          onInput={handleSignupPasswordInput}
          required
          type="password"
        />
      </form>
    {/if}
  {/if}
{/if}
</section>
