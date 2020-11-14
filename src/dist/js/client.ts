const AUTH_ENDPOINT = "/.netlify/functions/auth"
const VERIFY_ENDPOINT = "/.netlify/functions/verify"
const credentials: RequestCredentials = "include"

const onBasicSubmit = (event: Event) => {
  event.preventDefault()
  displayError("")
  displayStatus("")
  const inputs = Array.from(
    document.querySelectorAll("form#userForm input")
  ).map((i: HTMLInputElement) => [i.name, i.value])
  const user = inputs.find(i => i[0] === "user")[1]
  const password = inputs.find(i => i[0] === "password")[1]
  const encode = `${user}:${password}`
  const basicCred = window.btoa(encode)

  const authReqInfo = {
    credentials: credentials,
    headers: {
      Authorization: `Basic ${basicCred}`
    }
  }

  fetch(AUTH_ENDPOINT, authReqInfo)
    .then(response =>
      response.text().then(text => ({ status: response.status, text: text }))
    )
    .then(({ status, text }) => {
      if (status !== 200) throw `${status}:${text}`
      else return text
    })
    .then(token => {
      const input: HTMLTextAreaElement = document.querySelector(
        "textarea[name=token]"
      )
      input.value = token
      displayStatus("The auth API returns a token")
    })
    .catch(reason => {
      displayError(formatReason(reason))
    })
}

const displayError = (error: string) =>
  ((document.querySelector(
    "#errorDisplay"
  ) as HTMLParagraphElement).innerText = error)

const displayStatus = (status: string) =>
  ((document.querySelector(
    "#statusDisplay"
  ) as HTMLParagraphElement).innerText = status)

const onBearerSubmit = (event: Event) => {
  event.preventDefault()
  displayError("")
  displayStatus("")

  const token = (document.querySelector(
    "textarea[name=token]"
  ) as HTMLTextAreaElement).value

  const verifyReqInfo = {
    credentials: credentials,
    headers: {
      Authorization: `Bearer ${token}`
    }
  }

  fetch(VERIFY_ENDPOINT, verifyReqInfo)
    .then(response =>
      response.text().then(text => ({ status: response.status, text: text }))
    )
    .then(({ status, text }) => {
      if (status !== 200) throw `${status}:${text}`
      else displayStatus(`The API can be certain that: ${text}`)
    })
    .catch(reason => {
      displayError(formatReason(reason))
    })
}

document
  .querySelector("form")
  .addEventListener("submit", (submitEvent: Event) =>
    submitEvent.preventDefault()
  )

document
  .querySelector("#userSubmitButton")
  .addEventListener("click", onBasicSubmit)

document
  .querySelector("#tokenSubmitButton")
  .addEventListener("click", onBearerSubmit)

const formatReason = (error: Error | string) =>
  typeof error === "string" ? error : `${error.name}:${error.message}`

const tap = message => arg => {
  console.log(message, arg)
  return arg
}
