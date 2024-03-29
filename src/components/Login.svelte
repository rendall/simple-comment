<script lang="ts">
  import { fly } from "svelte/transition"
  import type {
    AdminSafeUser,
    ServerResponse,
    ServerResponseSuccess,
    TokenClaim,
    User,
    UserId,
    ValidationResult,
  } from "../lib/simple-comment-types"
  import { LoginTab } from "../lib/simple-comment-types"
  import { useMachine } from "@xstate/svelte"
  import { loginMachine } from "../lib/login.xstate"
  import {
    createGuestUser,
    createUser,
    deleteAuth,
    getGuestToken,
    getOneUser,
    postAuth,
    updateUser,
    verifySelf,
    verifyUser,
  } from "../apiClient"
  import {
    debounceFunc,
    isValidationTrue,
    isResponseOk,
    validatePassword,
    validateUserId,
    formatUserId,
  } from "../frontend-utilities"
  import InputField from "./low-level/InputField.svelte"
  import {
    currentUserStore,
    dispatchableStore,
    loginStateStore,
  } from "../lib/svelte-stores"
  import {
    isGuestId,
    isValidResult,
    joinValidations,
    validateDisplayName,
    validateEmail,
  } from "../lib/shared-utilities"
  import { onDestroy, onMount } from "svelte"
  import PasswordInput from "./low-level/PasswordInput.svelte"
  import PasswordTwinInput from "./low-level/PasswordTwinInput.svelte"
  import Avatar from "./low-level/Avatar.svelte"
  import { StateValue } from "xstate"

  const DISPLAY_NAME_HELPER_TEXT = "This is the name that others will see"
  const USER_EMAIL_HELPER_TEXT =
    "Used only for verification and approved notifications. We never show or share your email."
  const USER_ID_HELPER_TEXT = "This is the user id that uniquely identifies you"

  export let currentUser: User | undefined

  let self: User = currentUser
  let isError = false
  let isLoaded = false // Hide the component until isLoaded is true

  let nextEvents = []
  let statusMessage = ""

  let displayName = ""
  let displayNameHelperText = DISPLAY_NAME_HELPER_TEXT
  let displayNameStatus: "error" | "success" | undefined = undefined

  let userEmail = ""
  let userEmailHelperText = USER_EMAIL_HELPER_TEXT

  let userEmailStatus = ""

  let userId = ""
  let userIdHelperText = undefined
  let userIdStatus = undefined
  let userIdManuallyChanged = false

  let loginUserIdHelperText = " "

  let userPassword = ""
  let userPasswordConfirm = ""
  let isPasswordView = true

  let userPasswordMessage = undefined
  let userPasswordStatus = undefined

  let selectedIndex = isNaN(
    parseInt(localStorage.getItem("simple_comment_login_tab"))
  )
    ? LoginTab.guest
    : parseInt(localStorage.getItem("simple_comment_login_tab"))

  let lastIdChecked

  const { state, send } = useMachine(loginMachine)
  const updateStatusDisplay = (message = "", error = false) => {
    statusMessage = message
    isError = error
  }

  //TODO: Move the log in *functionality* away from the Login.svelte *component*. Currently the Login component must be on the page for login functionality to occur.

  /** Note that usually these onClick events will not be used. Rather, "loginIntent" will be sent.*/
  const onGuestClick = async (e: Event) => {
    e.preventDefault()
    updateStatusDisplay()

    const validations = [
      () => validateDisplayName(displayName),
      () => validateEmail(userEmail),
    ].map(validation => validation())
    const result = joinValidations(validations)

    if (isValidResult(result))
      send({ type: "GUEST", guest: { name: displayName, email: userEmail } })
    else send({ type: "ERROR", error: result.reason })
  }

  const onLoginClick = async (e: Event) => {
    e.preventDefault()
    updateStatusDisplay()

    const result = checkLoginValid()

    if (isValidResult(result)) send({ type: "LOGIN" })
    else
      send({
        type: "ERROR",
        error: result.reason,
      })
  }

  const onSignupClick = async (e: Event) => {
    e.preventDefault()
    updateStatusDisplay()

    const result = joinValidations([
      checkDisplayNameValid(),
      checkUserIdValid(),
      checkUserEmailValid(),
      checkPasswordValid(),
      checkPasswordsMatch(),
    ])

    if (isValidResult(result)) send({ type: "SIGNUP" })
    else
      send({
        type: "ERROR",
        error: result.reason,
      })
  }

  /** Handler for XState "verifying" state */
  const verifyingStateHandler = () => {
    updateStatusDisplay()

    if (self || currentUser) send({ type: "SUCCESS" })
    else
      verifySelf()
        .then((user: AdminSafeUser) => {
          self = user
          localStorage.setItem("simple_comment_user", JSON.stringify(user))
          send({ type: "SUCCESS" })
        })
        .catch(error => {
          const { status } = error
          if (status === 401) send({ type: "FIRST_VISIT" })
          else send({ type: "ERROR", error })
        })
  }

  const loggingInStateHandler = () => {
    updateStatusDisplay()
    const result = checkLoginValid()
    if (!isValidResult(result)) {
      send({ type: "ERROR", error: result.reason })
      return
    }
    postAuth(userId, userPassword)
      .then(response => {
        if (isResponseOk(response)) {
          send("SUCCESS")
        } else {
          send({ type: "ERROR", error: response })
        }
      })
      .catch(error => {
        send({ type: "ERROR", error })
      })
  }

  const signingUpStateHandler = () => {
    updateStatusDisplay()
    const result = joinValidations([
      checkDisplayNameValid(),
      checkUserIdValid(),
      checkUserEmailValid(),
      checkPasswordValid(),
      checkPasswordsMatch(),
    ])
    if (!isValidResult(result)) {
      send({ type: "ERROR", error: result.reason })
      return
    }

    const userInfo = {
      id: userId,
      name: displayName,
      email: userEmail,
      password: userPassword,
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
    updateStatusDisplay()

    const error = $state.context.error
    if (!error) {
      updateStatusDisplay(
        "Apologies. An unknown error occurred. Please reload the page and try again. If the error persists, contact the site administrator",
        true
      )
      console.error("Unknown error")
      console.trace()
    } else if (typeof error === "string") {
      updateStatusDisplay(error, true)
    } else {
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
          "It seems we couldn't find an account associated with the provided user id. Please double-check your input for any typos. If you don't have an account yet, feel free to create one. We'd love to have you join our community!",
        ],
        [
          404,
          "Authenticating user is unknown",
          "It seems there's an issue with your current session. Please log out and log back in again. If the problem persists, contact the site administrator for assistance.",
        ],
        [
          undefined,
          undefined,
          "Unknown error. Possibly the comment server is unreachable. Try reloading.",
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
    // send("RESET")
  }

  const checkUserIdExists = async (idToCheck?: UserId) => {
    const id = idToCheck ?? userId

    if (!onSubmitCheckUserIdValid(id).isValid) return

    try {
      await getOneUser(id)
      userIdHelperText = `The handle '${id}' is already taken. Please try another one.`
      userIdStatus = "error"
    } catch (error) {
      userIdHelperText = "This handle is available."
      userIdStatus = "success"
    }

    lastIdChecked = id
  }

  const checkUserIdExists_debounced = debounceFunc(checkUserIdExists, 400)

  const onSubmitCheckUserIdValid = userId => {
    const validation = validateUserId(userId)

    if (isValidationTrue(validation)) {
      userIdHelperText = "..."
      userIdStatus = "success"
    } else {
      userIdStatus = "error"
      userIdHelperText = validation.reason
    }
    return validation
  }

  const checkUserIdValid = (idToCheck?: UserId) => {
    const id = idToCheck ?? userId
    const result = validateUserId(id)

    if (isValidResult(result)) {
      userIdHelperText = "..."
      userIdStatus = undefined
    } else {
      userIdStatus = "error"
      userIdHelperText = result.reason
    }

    return result
  }

  const checkUserIdValid_debounced = debounceFunc(checkUserIdValid, 300)

  const checkLoginValid = (): ValidationResult => {
    const userIdResult: ValidationResult =
      userId && userId.length
        ? { isValid: true }
        : { isValid: false, reason: "User handle is required." }

    if (isValidResult(userIdResult)) {
      loginUserIdHelperText = "   "
      userIdStatus = "success"
    } else {
      loginUserIdHelperText = userIdResult.reason
      userIdStatus = "error"
    }

    const userPasswordResult: ValidationResult =
      userPassword && userPassword.length
        ? { isValid: true }
        : { isValid: false, reason: "Password is required." }
    if (isValidResult(userPasswordResult)) {
      userPasswordMessage = "   "
      userPasswordStatus = "success"
    } else {
      userPasswordMessage = userPasswordResult.reason
      userPasswordStatus = "error"
    }

    const result = joinValidations([userIdResult, userPasswordResult])
    return result
  }

  const checkDisplayNameValid = (): ValidationResult => {
    const result = validateDisplayName(displayName)
    if (isValidResult(result)) {
      displayNameHelperText = "     "
      displayNameStatus = "success"
    } else {
      displayNameHelperText = result.reason
      displayNameStatus = "error"
    }
    return result
  }
  const checkDisplayName_debounced = debounceFunc(checkDisplayNameValid, 250)

  const onSignupDisplayNameInput = () => {
    if (displayName.length <= 3)
      displayNameHelperText = DISPLAY_NAME_HELPER_TEXT
    displayNameHelperText = "..."
    displayNameStatus = undefined
    checkDisplayName_debounced()
    if (!userIdManuallyChanged && displayName.length > 3) {
      const formattedUserId = formatUserId(displayName)
      if (formattedUserId === lastIdChecked) return
      userIdHelperText = "..."
      userIdStatus = undefined
      checkUserIdExists_debounced(formattedUserId)
      userId = formattedUserId
    }
  }
  const onGuestDisplayNameInput = () => {
    displayNameHelperText = "..."
    displayNameStatus = undefined
    checkDisplayName_debounced()
  }

  const checkUserEmailValid = (): ValidationResult => {
    const result = validateEmail(userEmail)
    if (isValidResult(result)) {
      userEmailHelperText = " "
      userEmailStatus = "success"
      return { isValid: true }
    } else {
      userEmailStatus = "error"
      userEmailHelperText = result.reason
      return result
    }
  }

  const checkUserEmailValid_debounced = debounceFunc(checkUserEmailValid, 1000)

  const onUserEmailInput = () => {
    userEmailStatus = undefined
    if (userEmail.length <= 5) {
      userEmailHelperText = USER_EMAIL_HELPER_TEXT
      return
    }
    userEmailHelperText = "..."
    checkUserEmailValid_debounced()
  }

  const onUserIdInput = () => {
    userId = formatUserId(userId.replace(/\s/g, "-"))
    if (userId.length <= 3) {
      userIdHelperText = USER_ID_HELPER_TEXT
      userIdStatus = undefined
      return
    }
    userIdHelperText = "..."
    userIdStatus = undefined
    userIdManuallyChanged = true
    checkUserIdValid_debounced(userId)
    checkUserIdExists_debounced(userId)
  }

  const onUserIdBlur = () => {
    if (userId === lastIdChecked) return
    checkUserIdValid_debounced(userId)
    checkUserIdExists_debounced(userId)
  }

  const guestLoggingInStateHandler = () => {
    const guestValidationResult = joinValidations([
      checkDisplayNameValid(),
      checkUserEmailValid(),
    ])

    if (!isValidResult(guestValidationResult)) {
      send({ type: "ERROR", error: guestValidationResult.reason })
      return
    }

    const storedItem: string | null = localStorage.getItem(
      "simple_comment_user"
    )

    const storedUser = storedItem
      ? (JSON.parse(storedItem) as {
          id?: string
          name?: string
          email?: string
          challenge?: string
        })
      : { id: undefined, challenge: undefined }

    const {
      id: storedId,
      challenge: storedChallenge,
      name: storedName,
      email: storedEmail,
    } = storedUser

    const postAuthFlow = () =>
      postAuth(storedId, storedChallenge)
        .then(() => verifyUser())
        .then((response: ServerResponseSuccess<TokenClaim>) => response)
        .then(response => {
          if (isResponseOk(response)) {
            send("SUCCESS")
          } else getTokenFlow()
        })
        .catch(getTokenFlow)

    const getTokenFlow = () =>
      getGuestToken()
        .then(() => verifyUser())
        .then(
          (response: ServerResponseSuccess<TokenClaim>) => response.body.user
        )
        .then(id =>
          createGuestUser({ id, name: displayName, email: userEmail })
        )
        .then(response => {
          if (isResponseOk(response)) send("SUCCESS")
          else send({ type: "ERROR", error: response })
        })
        .catch(error => {
          console.error(error)
          send({ type: "ERROR", error })
        })

    const updateIfChanged = () => {
      if (displayName !== storedName || userEmail !== storedEmail) {
        updateUser({ id: storedId, name: displayName, email: userEmail }).catch(
          error => send({ type: "ERROR", error })
        )
      }
    }

    if (storedId && storedChallenge) postAuthFlow().then(updateIfChanged)
    else getTokenFlow()
  }

  const unsubscribeDispatchableStore = dispatchableStore.subscribe(event => {
    switch (event.name) {
      case "logoutIntent": {
        const canLogout = nextEvents?.includes("LOGOUT")
        if (canLogout) send("LOGOUT")
        else console.warn("Received logoutIntent at state", $state.value)
        break
      }

      case "loginIntent": {
        const canLogin = nextEvents?.some(event =>
          ["LOGIN", "GUEST", "SIGNUP"].includes(event)
        )
        if (canLogin) {
          switch (selectedIndex) {
            case LoginTab.guest:
              send("GUEST")
              break
            case LoginTab.signup:
              send("SIGNUP")
              break
            case LoginTab.login:
              send("LOGIN")
              break
            default:
              send({
                type: "ERROR",
                error: `Unknown selectedTabIndex ${selectedIndex}`,
              })
              break
          }
        } else if ($state.value === "error") send("RESET")
        else console.warn("Received loginIntent at state", $state.value)
        break
      }

      default:
        // Intentionally left blank.  Do not respond to other events.
        break
    }
  })

  const checkPasswordValid = () => {
    const result = validatePassword(userPassword)

    if (isValidResult(result)) {
      userPasswordMessage = "..."
      userPasswordStatus = undefined
    } else {
      userPasswordStatus = "error"
      userPasswordMessage = result.reason
    }

    return result
  }

  const checkPasswordsMatch = (): ValidationResult => {
    if (!isPasswordView) return { isValid: true }
    if (userPasswordConfirm.length === 0)
      return {
        isValid: false,
        reason:
          "Confirm the password by re-entering it into the 'Confirm password' field below.",
      }
    if (userPasswordConfirm !== userPassword)
      return { isValid: false, reason: "The passwords do not match." }
    return { isValid: true }
  }

  const checkPasswordValid_debounced = debounceFunc(checkPasswordValid, 500)
  const handleSignupPasswordInput = () => checkPasswordValid_debounced()

  const onTabClick = (tab: LoginTab) => e => {
    e.preventDefault()
    updateStatusDisplay()
    selectedIndex = tab
    localStorage.setItem("simple_comment_login_tab", selectedIndex.toString())
    switch (selectedIndex) {
      case LoginTab.signup: {
        const hasDisplayName = displayName && displayName.trim().length > 0
        const hasUserId = userId && userId.trim().length > 0
        if (hasDisplayName && !hasUserId) {
          userIdManuallyChanged = false
          userId = formatUserId(displayName)
          checkUserIdExists()
        }
        break
      }

      default:
        break
    }
  }

  onMount(() => {
    self = currentUser
    const storedItem: string | null = localStorage.getItem(
      "simple_comment_user"
    )
    if (storedItem) {
      const storedUser = JSON.parse(storedItem) as {
        id?: string
        name?: string
        email?: string
      }

      const { id, name, email } = storedUser

      if (id && !isGuestId(id)) userId = id
      if (name) displayName = name
      if (email) userEmail = email
    }
  })

  onDestroy(() => {
    currentUserStore.set(self)
    unsubscribeDispatchableStore()
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

    isLoaded =
      isLoaded ||
      (["loggedIn", "loggedOut", "error"] as StateValue[]).includes(
        $state.value
      )

    nextEvents = $state.nextEvents ?? []
    loginStateStore.set({ state: $state.value, nextEvents })
    stateHandlers.forEach(([stateValue, stateHandler]) => {
      if ($state.value === stateValue) setTimeout(stateHandler, 1)
    })
  }

  $: currentUserStore.set(self)

  $: loginStateStore.set({ select: selectedIndex })

  $: {
    if (userId.length < 3 && !userIdStatus)
      userIdHelperText = USER_ID_HELPER_TEXT
  }
</script>

<section class="simple-comment-login" class:is-loading={!isLoaded}>
  {#if !self}
    <div class="selection-tabs button-row">
      <button
        class:selected={selectedIndex === LoginTab.login}
        class="selection-tab selection-tab-login"
        on:click={onTabClick(LoginTab.login)}
        type="button">Login</button
      >
      <button
        class:selected={selectedIndex === LoginTab.signup}
        class="selection-tab selection-tab-signup"
        on:click={onTabClick(LoginTab.signup)}
        type="button">Signup</button
      >
      <button
        class:selected={selectedIndex === LoginTab.guest}
        class="selection-tab selection-tab-guest"
        on:click={onTabClick(LoginTab.guest)}
        type="button">Guest</button
      >
    </div>

    <div class="form-container">
      {#if selectedIndex === LoginTab.guest}
        <form
          class="guest-login-form login-form"
          id="guest-login-form"
          in:fly={{ y: 0, duration: 250 }}
          on:submit={onGuestClick}
        >
          {#if statusMessage && statusMessage.length}
            <p
              id="status-display"
              class="call-to-action"
              class:is-error={isError}
            >
              {statusMessage}
            </p>
          {:else}
            <p class="call-to-action">
              To comment as a guest, enter a display name and email below.
            </p>
          {/if}

          <InputField
            bind:value={displayName}
            helperText={displayNameHelperText}
            id="guest-name"
            labelText="Display Name"
            onInput={onGuestDisplayNameInput}
            onBlur={checkDisplayNameValid}
            status={displayNameStatus}
            required
          />
          <InputField
            bind:value={userEmail}
            helperText={userEmailHelperText}
            id="guest-email"
            labelText="Email"
            onInput={onUserEmailInput}
            onBlur={checkUserEmailValid}
            status={userEmailStatus}
            required
          />
        </form>
      {/if}

      {#if selectedIndex === LoginTab.login}
        <form
          class="user-login-form login-form"
          id="user-login-form"
          in:fly={{ y: 0, duration: 250 }}
          on:submit={onLoginClick}
        >
          {#if statusMessage && statusMessage.length}
            <p
              id="status-display"
              class="call-to-action"
              class:is-error={isError}
            >
              {statusMessage}
            </p>
          {:else}
            <p class="call-to-action">
              If you have an account, this is where you enter your user handle
              and password to log in.
            </p>
          {/if}
          <InputField
            id="login-user-id"
            labelText="User handle"
            helperText={loginUserIdHelperText}
            status={userIdStatus}
            bind:value={userId}
            required
          >
            <Avatar {userId} status={userIdStatus} slot="icon" />
          </InputField>

          <PasswordInput
            labelText="Password"
            helperText={userPasswordMessage}
            status={userPasswordStatus}
            id="login-password"
            bind:value={userPassword}
            required
          />
        </form>
      {/if}

      {#if selectedIndex === LoginTab.signup}
        <form
          class="signup-form login-form"
          id="signup-form"
          in:fly={{ y: 0, duration: 250 }}
          on:submit={onSignupClick}
        >
          {#if statusMessage && statusMessage.length}
            <p
              id="status-display"
              class="call-to-action"
              class:is-error={isError}
            >
              {statusMessage}
            </p>
          {:else}
            <p class="call-to-action">
              Unlock the full power of our platform with a quick sign-up. Secure
              your ability to edit and manage your posts from any device,
              anytime. Don't just join the conversation, own it. Sign up today!
            </p>
          {/if}
          <InputField
            bind:value={displayName}
            helperText={displayNameHelperText}
            status={displayNameStatus}
            id="signup-name"
            labelText="Display name"
            onInput={onSignupDisplayNameInput}
            onBlur={checkDisplayNameValid}
            required
          />
          <InputField
            bind:value={userId}
            status={userIdStatus}
            helperText={userIdHelperText}
            id="signup-user-id"
            labelText="User handle"
            onBlur={onUserIdBlur}
            onInput={onUserIdInput}
          >
            <Avatar {userId} status={userIdStatus} slot="icon" />
          </InputField>

          <InputField
            bind:value={userEmail}
            helperText={userEmailHelperText}
            status={userEmailStatus}
            id="signup-email"
            labelText="Email"
            required
            type="email"
            onInput={onUserEmailInput}
          />
          <PasswordTwinInput
            bind:value={userPassword}
            bind:confirmValue={userPasswordConfirm}
            bind:isPasswordView
            id="signup-password"
            labelText="Password"
            helperText={userPasswordMessage}
            status={userPasswordStatus}
            onInput={handleSignupPasswordInput}
            required
          />
        </form>
      {/if}
    </div>
  {/if}
</section>
