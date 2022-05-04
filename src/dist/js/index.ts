/*
 * Simple Comment demo
 *
 * This illustrates a prototypical user flow
 *
 * - Visitor visits page
 * - A request to `/verify` endpont returns a claim (status code 200  and login) or not (401)
 * - A request to `/topic/{id}` returns a topic (200) or not (404). A topic is a "root" comment, to which top-level comments are made
 *   - If 404, submit a POST (create) request
 *     - If the user has permissions OR policy allows, the topic is created
 *     - Typically, policy is allowed to be created by non-privs under specific situations
 *       - Designed so that admin does not have to create every topic
 *       - (Typically) Allowed only if the topic id is based on the URL and the Referer header is correct
 *     - If the create request is granted, continue:
 * - What is returned is a Discussion, which is a Topic (root comment) + all replies (child comments)
 *
 * If the user submits a comment and credentials do not exist:
 *   - Validate information client-side
 *   - Visit to `/gauth` acquires a guest credential
 *   - POST to /user with guest credential and user info creates a guest user
 *     - Validate information server-side
 *   - POST to /comment with guest credential
 *
 * This file relies on the apiClient library, which is a group of async functions that connect to the API
 *
 */
import type {
  AdminSafeUser,
  Comment,
  CommentId,
  Discussion,
  ResolvedResponse,
  TokenClaim
} from "../../lib/simple-comment"
import {
  createNewTopic,
  deleteAuth,
  verifyUser,
  getDefaultDiscussionId,
  getOneDiscussion,
  getOneUser,
  postAuth,
  postComment,
  getGuestToken,
  isGuestId,
  createGuestUser,
  isValidEmail,
  createUser,
  deleteComment,
  formatDate,
  isTopic
} from "./apiClient"

let currUser: AdminSafeUser
let clearReply = () => {}
let updateReply = () => {}

// string type guard
const isString = (x: unknown): x is string => typeof x === "string"
// Response type guard
const isResponse = (
  res: string | ResolvedResponse | Response
): res is Response =>
  !isString(res) && "text" in res && typeof res.text === "function"
// Resolved Response type guard
const isResolvedResponse = (
  res: string | ResolvedResponse | Response
): res is Response => !isString(res) && "body" in res

/* UI methods
 * -----------
 * Methods that manipulate the DOM
 * Swap these out for your favored front-end framework
 */

let firstTopic: CommentId
/* insertReplyInput
 * Creates UI for replying to a comment and inserts it into the
 * document above target element */
const insertReplyInput = (commentId: CommentId) => {
  if (!firstTopic) firstTopic = commentId
  if (clearReply) clearReply()

  const user = currUser
  const ul = document.querySelector(
    `ul[data-comment='${commentId}']`
  ) as HTMLUListElement
  const target = ul.parentElement

  const replyInputGroup = document.createElement("div")
  replyInputGroup.classList.add("reply-input-group")
  target.insertBefore(replyInputGroup, ul)

  const userInfoGroup = document.createElement("div")
  userInfoGroup.classList.add("user-info")
  userInfoGroup.setAttribute("id", "user-info")

  const nameLabel = document.createElement("label")
  nameLabel.setAttribute("for", "name-field")
  nameLabel.innerHTML = "Name:"
  userInfoGroup.appendChild(nameLabel)

  const nameInput = document.createElement("input")
  nameInput.setAttribute("id", "name-field")
  nameInput.setAttribute("placeholder", "What's your name?")
  userInfoGroup.appendChild(nameInput)
  nameInput.value = user?.name ?? ""
  nameInput.toggleAttribute("disabled", !!user)

  const emailLabel = document.createElement("label")
  emailLabel.setAttribute("for", "email-field")
  emailLabel.innerHTML = "Email:"
  userInfoGroup.appendChild(emailLabel)

  const emailInput = document.createElement("input")
  emailInput.setAttribute("id", "email-field")
  emailInput.setAttribute("placeholder", "What's your email?")
  emailInput.value = user?.email ?? ""
  emailInput.toggleAttribute("disabled", !!user)
  userInfoGroup.appendChild(emailInput)

  const replyTextarea = document.createElement("textarea")
  replyTextarea.setAttribute("id", "reply-field")
  replyTextarea.setAttribute("placeholder", "What's on your mind?")

  const buttonGroup = document.createElement("div")
  buttonGroup.classList.add("button-group")

  const submitReplyButton = document.createElement("button")
  submitReplyButton.innerHTML = "submit"
  submitReplyButton.setAttribute("id", "reply-submit-button")
  submitReplyButton.addEventListener(
    "click",
    onCommentSubmit({ replyTextarea, nameInput, emailInput }, commentId)
  )
  buttonGroup.appendChild(submitReplyButton)

  target.classList.add("is-reply")
  replyInputGroup.appendChild(replyTextarea)
  replyInputGroup.appendChild(userInfoGroup)
  replyInputGroup.appendChild(buttonGroup)

  clearReply = () => {
    target.classList.remove("is-reply")
    replyTextarea.remove()
    submitReplyButton.remove()
    nameInput.remove()
    nameLabel.remove()
    emailInput.remove()
    emailLabel.remove()
    buttonGroup.remove()
    replyInputGroup.remove()
  }

  updateReply = () => insertReplyInput(commentId)
}

/* setupSignup
 * Add event listener and handler for signup flow */
const setupSignup = () => {
  const signupButton = document.querySelector(
    "#sign-up-button"
  ) as HTMLButtonElement
  const setSignupStatus = (message: string = "", isError: boolean = false) => {
    document
      .querySelector("#sign-up-status")
      .classList.toggle("is-error", isError)
    document.querySelector("#sign-up-status").textContent = message
  }
  const getElem = id => document.querySelector(`#sign-up-${id}`) as HTMLElement
  const getValue = id => (getElem(id) as HTMLInputElement).value
  const clearSignupForm = () =>
    Array.from(getElem("form").querySelectorAll("input")).forEach(
      i => (i.value = "")
    )

  signupButton.addEventListener("click", () => {
    setSignupStatus("... please wait ...")

    const id = getValue("userid")
    if (id === "") return setSignupStatus("Username is required", true)
    if (!id.match(/[A-Za-z0-9]{5,20}/))
      return setSignupStatus(
        `Invalid username '${id}'. ` +
          "The username must contain only letters or numbers and be between 5 and 20 characters. Go hog-wild on the display name, though!",
        true
      )

    const password = getValue("password")
    if (password === "") return setSignupStatus("Password is required", true)

    const password2 = getValue("password-2")
    if (password !== password2)
      return setSignupStatus("Password fields must both match", true)

    const email = getValue("email")
    if (!isValidEmail(email))
      return setSignupStatus("Email must be valid", true)

    const name = getValue("display-name")
    if (name.trim() === "")
      (getElem("display-name") as HTMLInputElement).value = id

    createUser({ id, name, email, password })
      .then(resp => {
        if (resp.status === 201)
          setSignupStatus(`User '${name}' created. Signing in...`)
        else throw Error(`Unknown response code ${resp.status} from POST /user`)
        clearSignupForm()
        return resp
      })
      .then(() =>
        postAuth(id, password).then(updateLoginStatus).catch(setErrorStatus)
      )
      .catch((err: ResolvedResponse) =>
        setSignupStatus(
          `Error ${err.status} ${err.statusText}: ${err.body}`,
          true
        )
      )
  })
}

/* appendComment
 * Creates the UI for displaying a single comment, and appends it to HTMLElement `elem` */
const appendComment = (comment: Comment, li: HTMLLIElement) => {
  if (!li) throw new Error("parameter 'elem' is undefined in appendComment")
  const commentDisplay = document.createElement("div")
  commentDisplay.classList.add("comment-display")
  li.appendChild(commentDisplay)

  const isDeleted = !!comment.dateDeleted
  const hasUser = comment.user && comment.user.id

  const userDisplay = document.createElement("P")
  if (hasUser) {
    userDisplay.setAttribute("id", comment.user.id)
    userDisplay.innerText = comment.user.name
  } else {
    userDisplay.classList.add("user-unknown")
    userDisplay.innerText = "Unknown user"
  }

  if (!isDeleted) commentDisplay.appendChild(userDisplay)

  const commentText = document.createElement("p")
  commentText.setAttribute("id", comment.id)
  commentDisplay.appendChild(commentText)

  if (isDeleted) {
    commentText.innerText = `Comment deleted ${formatDate(comment.dateDeleted)}`
    commentDisplay.classList.add("is-deleted")
  } else {
    commentText.innerText = comment.text

    const replyCommentButton = document.createElement("button")
    replyCommentButton.innerText = "reply"
    replyCommentButton.classList.add("comment-button")
    replyCommentButton.classList.add("reply-button")
    replyCommentButton.addEventListener("click", onReplyToComment(comment))
    commentDisplay.appendChild(replyCommentButton)

    const isOwnComment =
      comment.user && currUser && comment.user.id === currUser.id

    const isAdmin = currUser && currUser.isAdmin

    if (isOwnComment || isAdmin) {
      // This comment is from the current user
      const deleteCommentButton = document.createElement("button")
      deleteCommentButton.innerText = "delete"
      deleteCommentButton.classList.add("comment-button")
      deleteCommentButton.classList.add("delete-button")
      commentDisplay.appendChild(deleteCommentButton)

      deleteCommentButton.addEventListener("click", () => {
        deleteComment(comment.id)
          .then((res: ResolvedResponse) => {
            if (res.status !== 202) {
              console.error(res)
              throw new Error(`Unknown response status code ${res.status}`)
            }
            commentDisplay.classList.add("is-deleted")
            commentText.innerText = "Comment deleted"
            setStatus("Comment deleted")
          })
          .catch(setErrorStatus)
      })
    }
  }
  const ul = document.createElement("ul")
  ul.dataset.comment = comment.id
  li.appendChild(ul)
}
/* setupUserLogin
 * Adds eventlisteners to the login UI */
const setupUserLogin = () => {
  const logoutButton = document.querySelector("#log-out-button")
  logoutButton.addEventListener("click", onLogoutClick)
  const loginButton = document.querySelector("#log-in-button")
  loginButton.addEventListener("click", onLoginClick)
  updateLoginStatus()
}

let currDiscussion: ResolvedResponse<Discussion>
const updateDiscussionDisplay = (
  discussionResponse: ResolvedResponse<Discussion>
) => {
  const discussion: Discussion = discussionResponse.body as Discussion
  const discussionDiv = document.querySelector("#discussion") as HTMLDivElement

  while (discussionDiv.hasChildNodes()) {
    discussionDiv.removeChild(discussionDiv.lastChild)
  }

  clearStatus()
  if (!discussion) {
    setStatus("No discussion on that topic")
    return
  }

  const commentDisplay = document.createElement("div")
  commentDisplay.classList.add("comment-display")
  discussionDiv.appendChild(commentDisplay)
  const commentButton = document.createElement("button")
  commentButton.innerText = "comment"
  commentButton.classList.add("comment-button")
  commentButton.classList.add("reply-button")
  commentButton.addEventListener("click", onReplyToComment(discussion))
  commentDisplay.appendChild(commentButton)

  const comments = discussion.replies

  // replies can be threaded, although they arrive in a flat array
  const threadReplies = (
    parent: Comment | Discussion,
    listItem: HTMLLIElement | HTMLDivElement
  ) => {
    const parentId = parent.id
    const comment = comments.find(c => c.id === parentId)
    if (comment) appendComment(comment, listItem as HTMLLIElement)
    const replies = comments
      .filter(c => c.parentId === parentId)
      .sort(
        (a, b) =>
          new Date(b.dateCreated).valueOf() - new Date(a.dateCreated).valueOf()
      )

    const replyList = listItem.querySelector(
      `ul[data-comment='${parentId}']`
    ) as HTMLUListElement

    if (replies.length) {
      replies.forEach(reply => {
        const li = document.createElement("li")
        replyList.appendChild(li)
        threadReplies(reply, li)
      })
    }

    if (isTopic(parent)) insertReplyInput(parentId)
  }

  const title = document.createElement("h2")
  title.innerText = discussion.title
  title.setAttribute("id", "discussion-title")
  discussionDiv.appendChild(title)
  const replyTopicButton = document.createElement("button")
  replyTopicButton.innerText = "reply"
  replyTopicButton.classList.add("comment-button")

  const ul = document.createElement("ul")
  ul.dataset.comment = discussion.id
  discussionDiv.appendChild(ul)

  replyTopicButton.addEventListener("click", onReplyToTopic(discussion))

  if (comments) threadReplies(discussion, discussionDiv)

  // const commentUL = discussionDiv.querySelector("ul")
  // const replyLI = document.createElement("li")

  // if (commentUL.firstChild)
  // commentUL.insertBefore(replyLI, commentUL.firstChild)
  // else commentUL.appendChild(replyLI)

  // replyLI.appendChild(replyTopicButton)

  // insertReplyInput(discussion.id, replyTopicButton)
  setStatus("Discussion received and displayed")
}

// Status display methods
/* updateLoginStatus
 * Login status may have changed, and the display needs to change to update that */
const updateLoginStatus = () =>
  verifyUser()
    .then(res => res.body as TokenClaim)
    .then(claim => {
      const claimUserField = document.querySelector(
        "#claim-user"
      ) as HTMLInputElement
      claimUserField.value = claim.user
      return claim
    })
    .then(getSelf)
    .then(() => {
      if (currDiscussion) updateDiscussionDisplay(currDiscussion)
    })
    .then(updateReply)
    .catch(currUserError => {
      if (currUserError.status && currUserError.status === 401) {
        return getGuestToken().then(updateLoginStatus)
      } else setErrorStatus(currUserError)
    })

const clearStatus = () => {
  document.querySelector("#status-display").textContent = ""
  document.querySelector("#status-display").classList.remove("error")
  document.querySelector("body").classList.remove("is-logging-in")
}

const setStatus = (
  message: string | ResolvedResponse | Response,
  isError = false
) => {
  if (isResponse(message))
    return message.text().then(msg => setStatus(msg, isError))
  if (isResolvedResponse(message))
    return setStatus(JSON.stringify(message.body), isError)
  if (!isString(message)) return setStatus(JSON.stringify(message), isError)
  clearStatus()
  document.querySelector("#status-display").classList.toggle("error", isError)
  document.querySelector("#status-display").textContent = message
}

const setErrorStatus = (
  error: Error | ResolvedResponse | Response | string
) => {
  console.error(error)
  if (typeof error === "string") return setStatus(error, true)
  if ("message" in error)
    return setStatus(`${error.name}:${error.message}`, true)
  else setStatus(error, true)
}

const setUserStatus = (user?: AdminSafeUser) => {
  const docBody = document.querySelector("body")
  const userName = user
    ? `Logged in as: ${user.name} ${isGuestId(user.id) ? "(guest)" : ""}${
        user.isAdmin ? "(admin)" : ""
      }`
    : "Not logged in"
  if (user && user.isAdmin) docBody.classList.add("is-admin")
  else docBody.classList.remove("is-admin")

  if (user && isGuestId(user.id)) docBody.classList.add("is-guest")
  else docBody.classList.remove("is-guest")

  const userNameField = document.querySelector("#user-name")
  userNameField.textContent = userName

  docBody.classList.remove("is-logging-in")
  docBody.classList.toggle("is-logged-in", !!user)

  currUser = user
}

/* getSelf
 * Request information about the current user and display it */
const getSelf = (claim: TokenClaim) =>
  getOneUser(claim.user)
    .then(res => res.body as AdminSafeUser)
    .then(setUserStatus)
    .catch(error => {
      const isUnbornGuest = error.status === 404 && isGuestId(claim.user)
      if (!isUnbornGuest) return setErrorStatus(error)
      else setUserStatus()
      // we won't create the guest user until the user submits a comment!
    })

/* Methods handling responses from the server
 * -------------------------------------------
 * When the server sends a response, these methods handle and
 * client-side logic and display the result */
/* onReceiveDiscussion
 * The server has responded to a request to the `/topic/{topicId}`
 * endpoint, requesting a single topic and its replies. This method
 * handles the response. */
const onReceiveDiscussion = (
  discussionResponse: ResolvedResponse<Discussion>
) => {
  currDiscussion = discussionResponse
  updateDiscussionDisplay(currDiscussion)
}
/* onReceiveTopics
 * The server has responded to a request to the `/topic`
 * endpoint, requesting the entire list of current topics. This
 * method handles the response. */
// const onReceiveTopics = (topics = []) => {
// // kept here as an example
//   const topicList = document.querySelector("#topic-list")
//   while (topicList.hasChildNodes()) {
//     topicList.removeChild(topicList.lastChild)
//   }
//   if (topics.length)
//     topics.forEach(topic => {
//       const listItem = document.createElement("li")
//       topicList.appendChild(listItem)
//       const anchor = document.createElement("a")
//       anchor.innerText = topic.title
//       anchor.setAttribute("id", topic.id)
//       anchor.setAttribute("href", "#")
//       anchor.addEventListener("click", onTopicClick)
//       listItem.appendChild(anchor)
//     })
// }
/* Methods responding to user events
 * ---------------------------------- */
/* onCommentSubmit
 * The user has pressed the submit button and expects something to happen. This function handles those possiblities */
const onCommentSubmit = (submitElems, targetId) => async () => {
  const { replyTextarea, nameInput, emailInput } = submitElems
  const text = replyTextarea.value
  const name = nameInput.value
  const email = emailInput.value
  const isLoggedIn = document
    .querySelector("body")
    .classList.contains("is-logged-in")
  // if not isLoggedIn in we need to verify some things then create a guest user
  if (!isLoggedIn) {
    //TODO: due validation of email and name
    const id = (document.querySelector("#claim-user") as HTMLInputElement).value
    try {
      const createGuestUserResult = await createGuestUser({ id, name, email })
      if (createGuestUserResult.status === 201) await updateLoginStatus()
      else setErrorStatus(createGuestUserResult as ResolvedResponse)
    } catch (error) {
      setErrorStatus(error)
      return
    }
    // A successful createGuestUserResult would look like this:
    // {
    //   status: 201,
    //   ok: true,
    //   statusText: "Created",
    //   body: {
    //     id: "de066dc8-07ba-40d7-8f27-eca9c0647b37",
    //     name: "Fang!",
    //     email: "fang@example.net"
    //   }
    // }
  }

  const ul = document.querySelector(
    `ul[data-comment='${targetId}']`
  ) as HTMLUListElement
  const li = document.createElement("li")

  if (ul.firstChild) ul.insertBefore(li, ul.firstChild)
  else ul.appendChild(li)

  const onCommentResponse =
    parentElement => (response: ResolvedResponse<Comment>) => {
      setStatus("Successfully posted comment")
      const comment = response.body
      appendComment(comment, parentElement)
      clearReply()
    }

  postComment(targetId, text).then(onCommentResponse(li)).catch(setErrorStatus)
}
/* onReplyToComment
 * The user has pushed the 'reply' button adjacent to a comment. This
 * method responds by coordinating building the UI */
const onReplyToComment = (comment: Comment | Discussion) => () => {
  clearReply()
  insertReplyInput(comment.id)
}

/* onReplyToTopic
 * The user has pushed the 'comment' button below the main topic.
 * This method is equivalent to 'onReplyToComment', responds by
 * coordinating building the UI. They are conceptually different,
 * though functionally the same */
const onReplyToTopic = onReplyToComment

/* onTopicClick
 * The user has clicked on a link for a topic, expecting to see
 * comments. This method requests the discussion */
// kept as an example
// const onTopicClick = e => {
//   e.preventDefault()
//   const topicId = e.target.id
//   getOneDiscussion(topicId).then(onReceiveDiscussion, setErrorStatus)
// }

/* onLogoutClick
 * The user has pressed the logout button. This method coordinates
 * the response of deleting authentication and updating the user
 * display */
const onLogoutClick = () => {
  deleteAuth().then(updateLoginStatus).catch(setErrorStatus)
}

/* onLoginClick
 * The user has pressed the login button. This method coordinates
 * validating the input and sending the authentication request to the
 * server. */
const onLoginClick = () => {
  const usernamevalue = (document.querySelector("#userid") as HTMLInputElement)
    .value
  const passwordvalue = (
    document.querySelector("#password") as HTMLInputElement
  ).value

  const username = usernamevalue ? usernamevalue.trim() : usernamevalue
  const password = passwordvalue ? passwordvalue.trim() : passwordvalue

  clearStatus()

  if (!username || !password) {
    setStatus("Enter username and password")
    return
  }

  document.querySelector("body").classList.add("is-logging-in")

  postAuth(username, password).then(updateLoginStatus).catch(setErrorStatus)
}

const downloadDiscussion = discussionId =>
  getOneDiscussion(discussionId).then(resp => {
    setStatus("Discussion downloaded! - attempting to populate discussion...")
    onReceiveDiscussion(resp as ResolvedResponse<Discussion>)
  })

/* Send a POST request to create a topic for discussion */
const tryCreatingTopic = (discussionId, title) =>
  createNewTopic(discussionId, title)
    .then(() => setStatus("Topic created!"))
    .then(() => downloadDiscussion(discussionId))
    .catch(err => {
      if (err.status === 401) {
        setErrorStatus(
          "Simple Comment policy disallows anonymous discussion creation."
        )
      } else setErrorStatus(err)
    })

const setup = async (
  discussionId = getDefaultDiscussionId(),
  title = document.title
) => {
  console.info("Looking for Simple Comment area...")
  const simpleCommentArea = document.querySelector("#simple-comment-display")

  if (!simpleCommentArea) {
    console.error(
      "Simple Comment area not found. q.v. https://github.com/rendall/simple-comment "
    )
    return
  }

  console.info("Simple Comment area found! - attempting to set up UI...")

  setupUserLogin()
  setupSignup()

  const statusDisplay = document.createElement("p")
  statusDisplay.setAttribute("id", "status-display")
  simpleCommentArea.appendChild(statusDisplay)

  setStatus("UI setup complete - attempting download...")

  downloadDiscussion(discussionId).catch(err => {
    if (err.status === 404) {
      setErrorStatus("Discussion not found - attempting to create it...")
      tryCreatingTopic(discussionId, title)
    } else setErrorStatus(err)
  })
}

// setup("some-topic-id") will link this page to "some-topic-id"
setup()
