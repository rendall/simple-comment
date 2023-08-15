import type {
  BaseActionObject,
  Interpreter,
  ResolveTypegenMeta,
  ServiceMap,
  StateSchema,
  TypegenDisabled,
} from "xstate"
import type {
  LoginMachineContext,
  LoginMachineEvent,
  LoginMachineState,
  LoginTypestate,
} from "./lib/login.xstate"
import type { AdminSafeUser, ServerResponse } from "./lib/simple-comment-types"
import { interpret } from "xstate"
import { loginMachine } from "./lib/login.xstate"
import {
  createUser,
  deleteAuth,
  getOneUser,
  postAuth,
  verifySelf,
} from "./apiClient"
import { debounceFunc } from "./frontend-utilities"

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

const updateStatusDisplay = (statusMessage: string = "", isError = false) => {
  const statusDisplay = document.getElementById(
    "status-display"
  ) as HTMLParagraphElement
  if (!statusDisplay) {
    console.error("#status-display not found", statusMessage)
    return
  }

  statusDisplay.classList.toggle("error", isError)
  statusDisplay.textContent = statusMessage
}

/** Handler for XState "verifying" state */
const verifyingStateHandler = loginService => {
  updateStatusDisplay("verifying")

  verifySelf()
    .then((user: AdminSafeUser) => {
      document.body.classList.remove("is-logged-out")
      document.body.classList.add("is-logged-in")
      const userDisplay = document.getElementById("user-display")
      if (userDisplay) userDisplay.textContent = `Logged in as ${user.name}`
      loginService.send({ type: "SUCCESS", user })
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

  const loginForm = document.querySelector(
    "#simple-comment-login #login-form"
  ) as HTMLFormElement
  const userId = (
    loginForm.querySelector("#login-user-name") as HTMLInputElement
  )?.value
  const password = (
    loginForm.querySelector("#login-password") as HTMLInputElement
  )?.value

  postAuth(userId, password)
    .then(() => loginService.send("SUCCESS"))
    .catch(error => {
      loginService.send({ type: "ERROR", error })
    })
}

const signingUpStateHandler = loginService => {
  updateStatusDisplay("signing up")
  const signupForm = document.querySelector(
    "#simple-comment-display #signup-form"
  ) as HTMLFormElement
  const name = (signupForm.querySelector("#signup-name") as HTMLInputElement)
    ?.value
  const id = (signupForm.querySelector("#signup-user-name") as HTMLInputElement)
    ?.value
  const email = (signupForm.querySelector("#signup-email") as HTMLInputElement)
    ?.value
  const password = (
    signupForm.querySelector("#signup-password") as HTMLInputElement
  )?.value
  createUser({ id, name, email, password })
    .then(() => loginService.send("SUCCESS"))
    .catch(error => loginService.send({ type: "ERROR", error }))
}

const loggedInStateHandler = _loginService => {
  updateStatusDisplay("logged in")
  document.body.classList.remove("is-logged-out")
  document.body.classList.add("is-logged-in")
}

const loggingOutStateHandler = loginService => {
  updateStatusDisplay("logging out")
  deleteAuth()
    .then(() => loginService.send("SUCCESS"))
    .catch(error => loginService.send({ type: "ERROR", error }))
}

const loggedOutStateHandler = _loginService => {
  updateStatusDisplay("logged out")
  // In the 'loggedOut' state, you might want to update the UI to reflect the logged out status
  document.body.classList.remove("is-logged-in")
  document.body.classList.add("is-logged-out")
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
      "It seems we couldn't find an account associated with the provided user id. Please double-check your input for any typos. If you don't have an account yet, feel free to create one. We'd love to have you join our community!",
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

/** This function handles the way that the username and display name fields interoperate  */
const setupSignupNamesRelationship = () => {
  const displayNameInput = document.getElementById(
    "signup-name"
  ) as HTMLInputElement
  const userNameInput = document.getElementById(
    "signup-user-name"
  ) as HTMLInputElement
  const messageElement = document.getElementById("signup-user-name-message")

  const formatUserName = (displayName: string): string =>
    displayName
      .trim() // Remove leading and trailing whitespace
      .toLowerCase() // Convert to lower case
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, "") // Remove non-alphanumeric characters except hyphens

  if (!displayNameInput || !userNameInput) {
    console.error("One or both input fields not found")
    return
  }

  let userNameManuallyChanged = false

  const onInput = (username: string): void => {
    const isValid = /^[a-z0-9-]{3,}$/.test(username)

    if (!isValid) {
      if (messageElement) {
        messageElement.textContent = `Username '${username}' is not valid. Please use only lowercase letters, numbers, and hyphens.`
        messageElement.style.color = "red"
      }
      return
    }

    getOneUser(username)
      .then(_response => {
        // update the UI with "username exists" message
        if (messageElement) {
          messageElement.textContent =
            "This username is already taken. Please try another one."
          messageElement.style.color = "red"
        }
      })
      .catch(_error => {
        // update the UI with "username ok" message
        if (messageElement) {
          messageElement.textContent = "This username is available."
          messageElement.style.color = "green"
        }
      })
  }

  // Create a debounced version of the getOneUser function
  const debouncedGetOneUser = debounceFunc(onInput)

  // Reflect changes from the display name input to the user name input
  displayNameInput.addEventListener("input", () => {
    if (!userNameManuallyChanged) {
      userNameInput.value = formatUserName(displayNameInput.value)
      debouncedGetOneUser(userNameInput.value)
    }
  })

  // Mark the user name as manually changed if the user types in it
  userNameInput.addEventListener("input", () => {
    userNameManuallyChanged = true
    debouncedGetOneUser(userNameInput.value)
  })

  // Check if the username already exists when it loses focus
  userNameInput.addEventListener("blur", async () => {
    debouncedGetOneUser(userNameInput.value)
  })
}

const setupUI = (loginService: LoginService) => {
  const loginForm = document.querySelector(
    "#simple-comment-login #login-form"
  ) as HTMLFormElement

  if (!loginForm) {
    throw "login form with id simple-comment-login not found"
  }

  // Add event listeners to the login form
  loginForm.addEventListener("submit", async event => {
    event.preventDefault()
    loginService.send({ type: "LOGIN" })
  })

  const signupForm = document.querySelector(
    "#simple-comment-display #signup-form"
  ) as HTMLFormElement

  if (!signupForm) {
    throw "signup form with id `#simple-comment-signup #signup-form` not found"
  }

  setupSignupNamesRelationship()

  // Add event listeners to the login form
  signupForm.addEventListener("submit", async event => {
    event.preventDefault()
    loginService.send({ type: "SIGNUP" })
  })

  const logoutButton = document.getElementById(
    "log-out-button"
  ) as HTMLButtonElement

  logoutButton.addEventListener("click", async event => {
    event.preventDefault()
    loginService.send({ type: "LOGOUT" })
  })
}

const onLoad = () => {
  // Create a service to interpret the login machine
  const loginService = interpret(loginMachine).start()

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
      ["error", errorStateHandler],
    ]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, handleState] =
      stateHandlers.find(([stateValue, _]) => state.matches(stateValue)) ?? []
    if (handleState) handleState(loginService)
  }

  // Set the onTransition handler
  loginService.onTransition(transitionHandler)

  // Continue with the rest of your code...
  setupUI(loginService)
}

window.addEventListener("load", onLoad)
