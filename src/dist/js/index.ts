/**
 * Simple Comment demo
 * 
 * This illustrates a prototypical user flow
 * 
 * - Visitor visits page
 * - A request to `/verify` endpont returns a claim (status code 200  and login) or not (204) 
 *   - With 204, the user can retrieve a temporary user
 * - A request to `/topic/{id}` returns a topic (200) or not (404). A topic is a "root" comment, to which top-level comments are made
 *   - If 404, submit a POST (create) request
 *     - If the user has permissions OR policy allows, the topic is created
 *     - Typically, policy is allowed to be created by non-privs under specific situations
 *       - Designed so that admin does not have to create every topic
 *       - (Typically) Allowed only if the topic id is based on the URL and the Referer header is correct
 *     - If the create request is granted, continue:
 * - What is returned is a Discussion, which is a Topic (root comment) + all replies (child comments)
 * 
 * This file relies on the apiClient library, which is a group of async functions that connect to the API
 *
 **/
import type { AdminSafeUser, CommentId, TokenClaim } from "../../lib/simple-comment"
import {
  createNewTopic,
  deleteAuth,
  verifyUser,
  getDefaultDiscussionId,
  getDiscussion,
  getOneTopic,
  getOneUser,
  postAuth,
  postComment,
  getGuestToken
} from "./apiClient.js"

const clearStatus = () => {
  document.querySelector("#status-display").innerHTML = ""
  document.querySelector("#status-display").classList.remove("error")
}

const setStatus = (message, isError = false) => {
  if (typeof message !== "string") {
    if (typeof message.text === "function") {
      message.text().then(msg => setStatus(msg, isError))
    } else return setStatus(JSON.stringify(message), isError)
  } else {
    document.querySelector("#status-display").classList.toggle("error", isError)
    document.querySelector("#status-display").innerHTML = message
    if (isError) console.error(message)
    else console.log(message)
  }
}

const setErrorStatus = message => {
  document.querySelector("#user-display").classList.remove("is-logging-in")
  setStatus(message, true)
}

let currUser: AdminSafeUser

const setUserStatus = (user?: AdminSafeUser) => {
  const userName = user
    ? `Logged in as: ${user.name} ${user.isAdmin ? "(admin)" : ""}`
    : "Not logged in"
  if (user && user.isAdmin)
    document.querySelector("body").classList.add("is-admin")
  else document.querySelector("body").classList.remove("is-admin")

  const userNameField = document.querySelector("#user-name")
  userNameField.innerHTML = userName
  document.querySelector("#name-input").toggleAttribute("disabled", !!user)

  const userDisplay = document.querySelector("#user-display")
  userDisplay.classList.remove("is-logging-in")
  userDisplay.classList.toggle("is-logged-in", !!user)

  currUser = user
  const nameInput = document.querySelector("#name-input") as HTMLInputElement
  if (nameInput)
    if (user) nameInput.value = user.name
    else nameInput.value = ""
}

let clearReply = () => { }

const onSubmitReply = (textarea, targetId) => e => {
  const text = textarea.value

  const onPostCommentResponse = comment => {
    attachComment(comment, textarea.parentElement)
    clearReply()
    console.log({ comment })
  }

  postComment(targetId, text).then(onPostCommentResponse).catch(setErrorStatus)
}

const insertReplyInput = (commentId: CommentId, target: Element) => {
  const nameLabel = document.createElement("label")
  nameLabel.setAttribute("for", "name-input")
  nameLabel.innerHTML = "Name:"

  const nameInput = document.createElement("input")
  nameInput.setAttribute("id", "name-input")
  nameInput.setAttribute("placeholder", "What's your name?")
  if (currUser) nameInput.value = currUser.name

  const replyTextarea = document.createElement("textarea")
  replyTextarea.setAttribute("id", "reply-textarea")
  replyTextarea.setAttribute("placeholder", "What's on your mind?")

  const buttonGroup = document.createElement("div")
  buttonGroup.classList.add("button-group")

  const submitReplyButton = document.createElement("button")
  submitReplyButton.innerHTML = "submit"
  submitReplyButton.setAttribute("id", "reply-submit-button")
  submitReplyButton.addEventListener(
    "click",
    onSubmitReply(replyTextarea, commentId)
  )
  buttonGroup.appendChild(submitReplyButton)

  const parentElement = target.parentElement
  parentElement.classList.add("is-reply")
  parentElement.insertBefore(replyTextarea, target)
  parentElement.insertBefore(nameLabel, target)
  parentElement.insertBefore(nameInput, target)
  parentElement.insertBefore(buttonGroup, target)

  clearReply = () => {
    parentElement.classList.remove("is-reply")
    replyTextarea.remove()
    submitReplyButton.remove()
    nameInput.remove()
    nameLabel.remove()
    buttonGroup.remove()
  }
}

const onReplyToComment = comment => e => {
  clearReply()
  insertReplyInput(comment.id, e.target)

  console.log(`reply to ${comment.id}`, e.target.parentElement)
}

const attachComment = (comment, elem) => {
  const commentDisplay = document.createElement("div")
  commentDisplay.classList.add("comment-display")
  elem.appendChild(commentDisplay)

  const userDisplay = document.createElement("P")
  userDisplay.setAttribute("id", comment.user.id)
  userDisplay.innerText = comment.user.name
  commentDisplay.appendChild(userDisplay)

  const commentText = document.createElement("p")
  commentText.innerText = comment.text
  commentText.setAttribute("id", comment.id)
  commentDisplay.appendChild(commentText)

  const replyCommentButton = document.createElement("button")
  replyCommentButton.innerText = "reply"
  replyCommentButton.classList.add("comment-button")
  commentDisplay.appendChild(replyCommentButton)

  replyCommentButton.addEventListener("click", onReplyToComment(comment))
}

const onReplyToTopic = onReplyToComment

const onReceiveDiscussion = discussion => {
  const discussionDiv = document.querySelector("#discussion")

  while (discussionDiv.hasChildNodes()) {
    discussionDiv.removeChild(discussionDiv.lastChild)
  }

  clearStatus()
  if (!discussion) {
    setStatus("No discussion on that topic")
    return
  }

  const comments = discussion.replies

  // replies can be threaded, although they arrive in a flat array
  const threadReplies = (listItem, parentId) => {
    const comment = comments.find(c => c.id === parentId)

    if (comment) attachComment(comment, listItem)

    const replies = comments.filter(c => c.parentId === parentId)
    const replyList = document.createElement("ul")
    listItem.appendChild(replyList)

    if (replies.length) {
      replies.forEach(reply => {
        const li = document.createElement("li")
        replyList.appendChild(li)
        threadReplies(li, reply.id)
      })
    }
  }

  const title = document.createElement("h2")
  title.innerText = discussion.title
  title.setAttribute("id", "discussion-title")
  discussionDiv.appendChild(title)
  const replyTopicButton = document.createElement("button")
  replyTopicButton.innerText = "reply"
  replyTopicButton.classList.add("comment-button")

  replyTopicButton.addEventListener("click", onReplyToTopic(discussion))

  threadReplies(discussionDiv, discussion.id)

  const commentUL = discussionDiv.querySelector("ul")
  const replyLI = document.createElement("li")

  if (commentUL.firstChild)
    commentUL.insertBefore(replyLI, commentUL.firstChild)
  else commentUL.appendChild(replyLI)

  replyLI.appendChild(replyTopicButton)

  insertReplyInput(discussion.id, replyTopicButton)
  setStatus("Ready!")
}

const onReceiveTopics = (topics = []) => {
  const topicList = document.querySelector("#topic-list")
  while (topicList.hasChildNodes()) {
    topicList.removeChild(topicList.lastChild)
  }

  if (topics.length)
    topics.forEach(topic => {
      const listItem = document.createElement("li")
      topicList.appendChild(listItem)
      const anchor = document.createElement("a")
      anchor.innerText = topic.title
      anchor.setAttribute("id", topic.id)
      anchor.setAttribute("href", "#")
      anchor.addEventListener("click", onTopicClick)
      listItem.appendChild(anchor)
    })
}

const onTopicClick = e => {
  e.preventDefault()
  const topicId = e.target.id
  getDiscussion(topicId).then(onReceiveDiscussion, setStatus)
}

const onLogoutClick = e => {
  deleteAuth().then(updateLoginStatus).catch(setErrorStatus)
}

const getSelf = (claim: TokenClaim) =>
  getOneUser(claim.user)
    .then(res => res.body as AdminSafeUser)
    .then(setUserStatus)
    .catch(setErrorStatus)

const onLoginClick = e => {
  const usernamevalue = (document.querySelector("#userid") as HTMLInputElement)
    .value
  const passwordvalue = (document.querySelector(
    "#password"
  ) as HTMLInputElement).value

  const username = usernamevalue ? usernamevalue.trim() : usernamevalue
  const password = passwordvalue ? passwordvalue.trim() : passwordvalue

  clearStatus()

  if (!username || !password) {
    setStatus("Enter username and password")
    return
  }

  const userDisplay = document.querySelector("#user-display") as HTMLDivElement
  userDisplay.classList.add("is-logging-in")

  postAuth(username, password).then(updateLoginStatus).catch(setErrorStatus)
}

const updateLoginStatus = () =>
  verifyUser()
    .then(res => res.body as TokenClaim)
    .then(getSelf)
    .catch(currUserError => {
      if (currUserError.status && currUserError.status === 401) {
        return getGuestToken().then(updateLoginStatus)
      } else setErrorStatus(currUserError)
    })

const setupUserLogin = () => {
  const logoutButton = document.querySelector("#log-out-button")
  logoutButton.addEventListener("click", onLogoutClick)
  const loginButton = document.querySelector("#log-in-button")
  loginButton.addEventListener("click", onLoginClick)
  updateLoginStatus()
}

const downloadDiscussion = discussionId =>
  getOneTopic(discussionId).then(resp => {
    setStatus("Discussion downloaded! - attempting to populate discussion...")
    onReceiveDiscussion(resp)
  })

/** Send a POST request to create a topic for discussion */
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
  const simpleCommentArea = document.querySelector("#simple-comment-area")

  if (!simpleCommentArea) {
    console.error(
      "Simple Comment area not found. q.v. https://github.com/rendall/simple-comment "
    )
    return
  }

  console.info("Simple Comment area found! - attempting to set up UI...")

  const statusDisplay = document.createElement("p")
  statusDisplay.setAttribute("id", "status-display")
  simpleCommentArea.appendChild(statusDisplay)

  const discussionDiv = document.createElement("div")
  discussionDiv.setAttribute("id", "discussion")
  simpleCommentArea.appendChild(discussionDiv)

  setStatus("UI setup complete - attempting download...")

  setupUserLogin()
  console.log("afterSetupsetupUserLogin")

  downloadDiscussion(discussionId).catch(err => {
    if (err.status === 404) {
      setErrorStatus("Discussion not found - attempting to create it...")
      tryCreatingTopic(discussionId, title)
    } else setErrorStatus(err)
  })
}

setup()
