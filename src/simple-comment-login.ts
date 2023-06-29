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
  LoginTypestate
} from "./lib/login.xstate"
import { AdminSafeUser } from "./lib/simple-comment"
import { interpret } from "xstate"
import { loginMachine } from "./lib/login.xstate"
import { createUser, postAuth, verifySelf } from "./apiClient" // assuming you have an apiClient.ts file

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

/** Handler for XState "verifying" state */
const verifyingStateHandler = loginService => {
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
    .catch(reason => {
      // If an error occurred, log it to the console and update the UI
      console.error("Error verifying user:", reason)
      document.body.classList.remove("is-logged-in")
      document.body.classList.add("is-logged-out")

      // Send a 'FAILURE' event to the login machine with the error message
      loginService.send({ type: "ERROR", message: reason.message })
    })
}

const loggingInStateHandler = (loginService: LoginService) => {
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
    .catch(error =>
      loginService.send({ type: "ERROR", message: error.message })
    )
}

const signingUpStateHandler = loginService => {
  const signupForm = document.querySelector(
    "#simple-comment-display #signup-form"
  ) as HTMLFormElement
  const name = (signupForm.querySelector("#signup-name") as HTMLInputElement)
    ?.value
  const email = (signupForm.querySelector("#signup-email") as HTMLInputElement)
    ?.value
  const password = (
    signupForm.querySelector("#signup-password") as HTMLInputElement
  )?.value
  createUser({ id: email, name, email, password })
    .then(() => loginService.send("SUCCESS"))
    .catch(error =>
      loginService.send({ type: "ERROR", message: error.message })
    )
}

const loggedInStateHandler = _loginService => {
  // In the 'loggedIn' state, you might want to update the UI to reflect the logged in status
  document.body.classList.remove("is-logged-out")
  document.body.classList.add("is-logged-in")
}

const loggedOutStateHandler = _loginService => {
  // In the 'loggedOut' state, you might want to update the UI to reflect the logged out status
  document.body.classList.remove("is-logged-in")
  document.body.classList.add("is-logged-out")
}

const errorStateHandler = loginService => {
  // In the 'error' state, you might want to display the error message in the UI
  const errorDisplay = document.getElementById("error-display")
  if (errorDisplay) {
    errorDisplay.textContent = loginService.state.context.error
  }
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

  // Add event listeners to the login form
  signupForm.addEventListener("submit", async event => {
    event.preventDefault()
    loginService.send({ type: "SIGNUP" })
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
