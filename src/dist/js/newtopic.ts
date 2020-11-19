/** This script attempts to downlaod a Simple Comment discussion. If not found,
 * it attempts to create the topic and then tries to download again. When the
 * topic is downloaded, it populates the page with any comments and adds a
 * reply text field */

import {
  createNewTopic,
  getDefaultDiscussionId,
  getOneTopic,
  postComment
} from "./apiClient.js"

/** Display a status message. Interpret it if the parameter is a response */
const setStatus = (message, isError = false) => {
  if (typeof message !== "string") {
    if (typeof message.text === "function") {
      message.text().then(msg => setStatus(msg, isError))
    } else return setStatus(JSON.stringify(message), isError)
  } else {
    document.querySelector("#status-display").classList.toggle("error", isError)
    document.querySelector("#status-display").innerHTML = message
    if (isError) console.error(message)
    else console.info(message)
  }
}

/** Display an error message. Interpret it if the parameter is a response */
const setErrorStatus = message => {
  setStatus(message, true)
}

/** Remove the reply textfield and buttons */
const clearReply = () => {
  const oldTextArea = document.querySelector("#comment-field")
  if (oldTextArea) {
    oldTextArea.parentElement.classList.remove("is-reply")
    oldTextArea.remove()
  }

  const oldSubmitReplyButton = document.querySelector("#reply-submit-button")
  if (oldSubmitReplyButton) oldSubmitReplyButton.remove()

  const oldCancelReply = document.querySelector("#reply-cancel-button")
  if (oldCancelReply) oldCancelReply.remove()
}

/** Handle a reply submission, when the user has written
 * a reply and sends it to the server */
const onSubmitReply = (textarea, targetId) => e => {
  const text = textarea.value

  const onPostCommentResponse = comment => {
    attachComment(comment, textarea.parentElement)
    clearReply()
    console.log({ comment })
  }

  postComment(targetId, text).then(onPostCommentResponse).catch(setErrorStatus)
}

/** Handle the user's intent to reply:
 * open the textfield and populate submit and cancel
 * buttons */
const onReplyToComment = comment => e => {
  clearReply()

  const parentElement = e.target.parentElement
  parentElement.classList.add("is-reply")

  const commentField = document.createElement("textarea")
  commentField.setAttribute("id", "comment-field")

  const submitReplyButton = document.createElement("button")
  submitReplyButton.innerHTML = "submit"
  submitReplyButton.setAttribute("id", "reply-submit-button")
  submitReplyButton.addEventListener(
    "click",
    onSubmitReply(commentField, comment.id)
  )

  const cancelReplyButton = document.createElement("button")
  cancelReplyButton.setAttribute("id", "reply-cancel-button")
  cancelReplyButton.innerHTML = "cancel"
  cancelReplyButton.addEventListener("click", clearReply)

  parentElement.insertBefore(commentField, e.target)
  parentElement.insertBefore(submitReplyButton, e.target)
  parentElement.insertBefore(cancelReplyButton, e.target)
  console.log(`reply to ${comment.id}`, parentElement)
}

const onReplyToTopic = onReplyToComment

/* Attach a single comment to the DOM */
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
  replyCommentButton.innerText = "comment"
  replyCommentButton.classList.add("comment-button")
  commentDisplay.appendChild(replyCommentButton)

  replyCommentButton.addEventListener("click", onReplyToComment(comment))
}

/** Populate the page with the discussion when the
 * server has responded with it */
const onReceiveDiscussion = discussion => {
  const discussionDiv = document.querySelector("#discussion")

  while (discussionDiv.hasChildNodes()) {
    discussionDiv.removeChild(discussionDiv.lastChild)
  }

  if (!discussion) {
    setErrorStatus("No discussion on that topic")
    return
  }

  const comments = discussion.replies

  // Replies arrive unsorted in a flat array.
  // Sort them according to parentId
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

  setStatus("Ready")
}

/** Send a request for a specific discussion */
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

const createElement = (
  type: string,
  parent?: Element,
  id?: string,
  innerHtml?: string
) => {
  const elem = document.createElement(type)
  if (id) elem.setAttribute("id", id)
  if (innerHtml) elem.innerHTML = innerHtml
  if (parent) parent.appendChild(elem)
  return elem
}

const setupUserLogin = (div: HTMLElement) => {
  const usernameLabel = createElement("label", div, null, "Username")
  usernameLabel.setAttribute("for", "userid")

  // username field
  createElement("input", div, "userid")

  const userpasswordLabel = createElement("label", div, null, "Password")
  userpasswordLabel.setAttribute("for", "password")

  const passwordField = createElement(
    "input",
    div,
    "password"
  ) as HTMLInputElement
  passwordField.type = "password"

  const logoutButton = createElement("button", div, "log-out-button", "Log out")
  // logoutButton.addEventListener("click", onLogoutClick)

  const loginButton = createElement("button", div, "log-in-button", "Log in")
  // loginButton.addEventListener("click", onLoginClick)

  const signupButton = createElement("button", div, "sign-up-button", "Sign up")
  // signupButton.addEventListener("click", onSignupClick)
}

/** Add minimal Simple Comment UI and functionality to this page */
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

  const userDiv = createElement("div", simpleCommentArea, "user-div")
  setupUserLogin(userDiv)

  const statusDisplay = document.createElement("p")
  statusDisplay.setAttribute("id", "status-display")
  simpleCommentArea.appendChild(statusDisplay)

  const discussionDiv = document.createElement("div")
  discussionDiv.setAttribute("id", "discussion")
  simpleCommentArea.appendChild(discussionDiv)

  setStatus("UI setup complete - attempting download...")

  downloadDiscussion(discussionId).catch(err => {
    if (err.status === 404) {
      setErrorStatus("Discussion not found - attempting to create it...")
      tryCreatingTopic(discussionId, title)
    } else setErrorStatus(err)
  })
}

setup()
