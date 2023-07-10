import type {
  BaseActionObject,
  Interpreter,
  ResolveTypegenMeta,
  ServiceMap,
  StateSchema,
  TypegenDisabled
} from "xstate"
import type {
  LoginMachineContext,
  LoginMachineEvent,
  LoginMachineState,
  LoginTypestate,
  ServerResponse
} from "./lib/login.xstate"
import { AdminSafeUser } from "./lib/simple-comment"
import { interpret } from "xstate"
import { loginMachine } from "./lib/login.xstate"
import { createUser, deleteAuth, getOneUser, postAuth, verifySelf } from "./apiClient" // assuming you have an apiClient.ts file
import { debounceFunc } from "./apiClient"

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
  const statusDisplay = document.getElementById("status-display") as HTMLParagraphElement
  console.log(`Status: ${statusMessage}`)
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
      // If the user is logged in, update the UI and display the user's information
      document.body.classList.remove("is-logged-out")
      document.body.classList.add("is-logged-in")

      const userDisplay = document.getElementById("user-display")
      if (userDisplay) {
        userDisplay.textContent = `Logged in as ${user.name}`
      }

      // Send a 'SUCCESS' event to the login machine with the user data
      loginService.send({ type: "SUCCESS", user })
    })
    .catch(error => {
      console.error("Error verifying user:", error)

      const { status, body } = error

      switch (status) {
        case 401:
          if (body === "No Cookie header 'simple-comment-token' value")
            loginService.send({ type: "FIRST_VISIT" })
          break

        default:
          loginService.send({ type: "ERROR", error })
          break
      }
    })
}

const loggingInStateHandler = (loginService: LoginService) => {
  updateStatusDisplay("logging in")

  const loginForm = document.querySelector(
    "#simple-comment-login #login-form"
  ) as HTMLFormElement
  const userId = (loginForm.querySelector("#login-email") as HTMLInputElement)
    ?.value
  const password = (
    loginForm.querySelector("#login-password") as HTMLInputElement
  )?.value

  postAuth(userId, password)
    .then(() => loginService.send("SUCCESS"))
    .catch((error) => {
      loginService.send({ type: "ERROR", error })
    })
}

const signingUpStateHandler = loginService => {
  updateStatusDisplay("signing up")
  const signupForm = document.querySelector(
    "#simple-comment-display #signup-form"
  ) as HTMLFormElement
  const name = (signupForm.querySelector("#signup-name") as HTMLInputElement)?.value
  const id = (signupForm.querySelector("#signup-user-name") as HTMLInputElement)?.value
  const email = (signupForm.querySelector("#signup-email") as HTMLInputElement)
    ?.value
  const password = (
    signupForm.querySelector("#signup-password") as HTMLInputElement
  )?.value
  createUser({ id, name, email, password })
    .then(() => loginService.send("SUCCESS"))
    .catch(error =>
      loginService.send({ type: "ERROR", error })
    )
}

const loggedInStateHandler = _loginService => {
  updateStatusDisplay("logged in")
  // In the 'loggedIn' state, you might want to update the UI to reflect the logged in status
  document.body.classList.remove("is-logged-out")
  document.body.classList.add("is-logged-in")
}

const loggingOutStateHandler = loginService => {
  updateStatusDisplay("logging out")
  deleteAuth()
    .then(() => loginService.send("SUCCESS"))
    .catch(error =>
      loginService.send({ type: "ERROR", error })
    )
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
  switch (status) {
    case 404:
      switch (body) {
        case "Unknown user":
          updateStatusDisplay("It seems we couldn't find an account associated with the provided username or email. Please double-check your input for any typos. If you don't have an account yet, feel free to create one. We'd love to have you join our community!", true)
          return

        case "Authenticating user is unknown":
          updateStatusDisplay("This user is unknown. Try logging out and back in again.", true)
          return
      }
    default: updateStatusDisplay(`${status}:${statusText} ${body}`, true)
  }
}

const setupSignupNamesRelationship = () => {
  const displayNameInput = document.getElementById('signup-name') as HTMLInputElement
  const userNameInput = document.getElementById('signup-user-name') as HTMLInputElement

  const formatUserName = (displayName: string): string => displayName
    .trim() // Remove leading and trailing whitespace
    .toLowerCase() // Convert to lower case
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric characters except hyphens

  if (!displayNameInput || !userNameInput) {
    console.error('One or both input fields not found')
    return
  }

  let userNameManuallyChanged = false

  const onInput = (username:string):void => {
    getOneUser(username).then((response) => {
      // update the UI with "username exists" message
      console.log("user exists", response)

    })
    .catch((error) => {
      // update the UI with "username ok" message
      console.log("user name ok", error)
    })

  }

  // Create a debounced version of the getOneUser function
  const debouncedGetOneUser = debounceFunc(onInput)

  // Reflect changes from the display name input to the user name input
  displayNameInput.addEventListener('input', () => {
    if (!userNameManuallyChanged) {
      userNameInput.value = formatUserName(displayNameInput.value)
      debouncedGetOneUser(userNameInput.value)
    }
  })

  // Mark the user name as manually changed if the user types in it
  userNameInput.addEventListener('input', () => {
    userNameManuallyChanged = true
    debouncedGetOneUser(userNameInput.value)
  })

  // Check if the username already exists when it loses focus
  userNameInput.addEventListener('blur', async () => {
    const response = await getOneUser(encodeURIComponent(userNameInput.value))

    if (response.ok) {
      console.info('Username already exists')
    } else if (response.status === 404) {
      console.info('Username does not exist')
    } else {
      console.error('An error occurred while checking the username')
    }
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

  const logoutButton = document.getElementById("log-out-button") as HTMLButtonElement

  logoutButton.addEventListener("click", async event => {
    event.preventDefault()
    console.log("logout press")
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
  setupUI(loginService)
}

window.addEventListener("load", onLoad)

