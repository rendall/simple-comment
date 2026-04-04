<script lang="ts">
  import type {
    User,
    UserId,
    ValidationResult,
  } from "../lib/simple-comment-types"
  import { LoginTab } from "../lib/simple-comment-types"
  import { getOneUser } from "../apiClient"
  import {
    debounceFunc,
    isValidationTrue,
    validatePassword,
    formatUserId,
  } from "../frontend-utilities"
  import {
    readStoredLoginTab,
    readStoredSession,
  } from "../lib/auth/auth-storage"
  import {
    isGuestId,
    isValidResult,
    joinValidations,
    validateDisplayName,
    validateEmail,
    validateUserId,
  } from "../lib/shared-utilities"
  import { onDestroy, onMount } from "svelte"
  import GuestForm from "./auth/GuestForm.svelte"
  import LoginForm from "./auth/LoginForm.svelte"
  import SignupForm from "./auth/SignupForm.svelte"
  import { useAuthRuntime } from "../lib/auth/auth-runtime"

  const DISPLAY_NAME_HELPER_TEXT = "This is the name that others will see"
  const USER_EMAIL_HELPER_TEXT =
    "Used only for verification and approved notifications. We never show or share your email."
  const USER_ID_HELPER_TEXT = "This is the user id that uniquely identifies you"

  export let currentUser: User | undefined

  let self: User = currentUser
  let isError = false
  let isLoaded = false // Hide the component until isLoaded is true

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

  const storedLoginTabToIndex = (
    storedLoginTab: "login" | "signup" | "guest"
  ) =>
    ({
      guest: LoginTab.guest,
      login: LoginTab.login,
      signup: LoginTab.signup,
    })[storedLoginTab]

  const loginTabToStoredLoginTab = (
    tab: LoginTab
  ): "login" | "signup" | "guest" =>
    (
      ({
        [LoginTab.guest]: "guest",
        [LoginTab.login]: "login",
        [LoginTab.signup]: "signup",
      }) as const
    )[tab]

  let selectedIndex = storedLoginTabToIndex(readStoredLoginTab())
  let lastHandledAuthUiRequestId = 0

  let lastIdChecked

  const updateStatusDisplay = (message = "", error = false) => {
    statusMessage = message
    isError = error
  }

  const authController = useAuthRuntime().controller
  const unsubscribeAuthController = authController.subscribe(snapshot => {
    selectedIndex = storedLoginTabToIndex(snapshot.uiTab)
    self = snapshot.currentUser
    isLoaded =
      isLoaded || ["loggedIn", "loggedOut", "error"].includes(snapshot.state)

    if (snapshot.state === "error" && snapshot.error)
      updateStatusDisplay(snapshot.error, true)
    // else if (snapshot.state !== "error") updateStatusDisplay()

    if (
      snapshot.authUiRequest &&
      snapshot.authUiRequest.id !== lastHandledAuthUiRequestId
    ) {
      lastHandledAuthUiRequestId = snapshot.authUiRequest.id

      void attemptSelectedAuth(
        storedLoginTabToIndex(
          snapshot.authUiRequest.preferredTab ?? snapshot.uiTab
        )
      )
      authController.clearAuthUiRequest()
    }
  })

  //TODO: Move the log in *functionality* away from the Login.svelte *component*. Currently the Login component must be on the page for login functionality to occur.

  /** These click handlers support direct interaction with the rendered auth form. */
  const onGuestClick = async () => {
    updateStatusDisplay()

    const result = joinValidations([
      checkDisplayNameValid(),
      checkUserEmailValid(),
    ])

    if (isValidResult(result))
      await authController.guestLogin({
        name: displayName,
        email: userEmail,
      })
    else {
      updateStatusDisplay(result.reason, true)
      authController.reportLocalValidationError(result.reason)
    }
  }

  const onLoginClick = async () => {
    updateStatusDisplay()

    const result = checkLoginValid()

    if (isValidResult(result))
      await authController.login({
        username: userId,
        password: userPassword,
      })
    else {
      updateStatusDisplay(result.reason, true)
      authController.reportLocalValidationError(result.reason)
    }
  }

  const onSignupClick = async () => {
    updateStatusDisplay()

    const result = joinValidations([
      checkDisplayNameValid(),
      checkUserIdValid(),
      checkUserEmailValid(),
      checkPasswordValid(),
      checkPasswordsMatch(),
    ])

    if (isValidResult(result))
      await authController.signup({
        id: userId,
        name: displayName,
        email: userEmail,
        password: userPassword,
      })
    else {
      updateStatusDisplay(result.reason, true)
      authController.reportLocalValidationError(result.reason)
    }
  }

  const attemptSelectedAuth = async (tab: LoginTab = selectedIndex) => {
    switch (tab) {
      case LoginTab.guest:
        await onGuestClick()
        break
      case LoginTab.signup:
        await onSignupClick()
        break
      case LoginTab.login:
        await onLoginClick()
        break
      default:
        updateStatusDisplay(`Unknown selectedTabIndex ${tab}`, true)
        break
    }
  }

  const checkUserIdExists = async (idToCheck?: UserId) => {
    const id = idToCheck ?? userId

    if (!onSubmitCheckUserIdValid(id).isValid) return

    try {
      await getOneUser(id)
      userIdHelperText = `The handle '${id}' is already taken. Please try another one.`
      userIdStatus = "error"
    } catch {
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
    authController.setTab(loginTabToStoredLoginTab(selectedIndex))
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
    const storedUser = readStoredSession()?.user
    if (storedUser) {
      const { id, name, email } = storedUser

      if (id && !isGuestId(id)) userId = id
      if (name) displayName = name
      if (email) userEmail = email
    }
  })

  onDestroy(() => {
    unsubscribeAuthController()
  })

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
        <GuestForm
          bind:displayName
          bind:userEmail
          {displayNameHelperText}
          {displayNameStatus}
          {userEmailHelperText}
          {userEmailStatus}
          {statusMessage}
          {isError}
          {onGuestDisplayNameInput}
          {checkDisplayNameValid}
          {onUserEmailInput}
          {checkUserEmailValid}
          on:submit={onGuestClick}
        />
      {/if}

      {#if selectedIndex === LoginTab.login}
        <LoginForm
          bind:userId
          bind:userPassword
          {userIdStatus}
          {loginUserIdHelperText}
          {userPasswordMessage}
          {userPasswordStatus}
          {statusMessage}
          {isError}
          on:submit={onLoginClick}
        />
      {/if}

      {#if selectedIndex === LoginTab.signup}
        <SignupForm
          bind:displayName
          bind:userId
          bind:userEmail
          bind:userPassword
          bind:userPasswordConfirm
          bind:isPasswordView
          {displayNameHelperText}
          {displayNameStatus}
          {userIdStatus}
          {userIdHelperText}
          {userEmailHelperText}
          {userEmailStatus}
          {userPasswordMessage}
          {userPasswordStatus}
          {statusMessage}
          {isError}
          {onSignupDisplayNameInput}
          {checkDisplayNameValid}
          {onUserIdBlur}
          {onUserIdInput}
          {onUserEmailInput}
          {handleSignupPasswordInput}
          on:submit={onSignupClick}
        />
      {/if}
    </div>
  {/if}
</section>
