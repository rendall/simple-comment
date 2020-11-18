import {
  postComment,
  getAllTopics,
  getDiscussion,
  getCurrentUser,
  deleteAuth,
  postAuth,
  getOneUser
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
    console.error(message)
  }
}

const setErrorStatus = message => {
  setStatus(message, true)
}

const setUserStatus = (user?: {
  id: string
  name: string
  email: string
  isAdmin: string
  isVerified: string
}) => {
  const userName = user
    ? `Logged in as: ${user.name} ${user.isAdmin ? "(admin)" : ""}`
    : "Not logged in"
  if (user && user.isAdmin)
    document.querySelector("body").classList.add("is-admin")
  else document.querySelector("body").classList.remove("is-admin")

  document.querySelector("#user-name").innerHTML = userName
  document
    .querySelector("#user-display")
    .classList.toggle("is-logged-in", !!user)
}

const clearReply = () => {
  const oldTextArea = document.querySelector("#reply-textarea")
  if (oldTextArea) {
    oldTextArea.parentElement.classList.remove("is-reply")
    oldTextArea.remove()
  }

  const oldSubmitReplyButton = document.querySelector("#reply-submit-button")
  if (oldSubmitReplyButton) oldSubmitReplyButton.remove()

  const oldCancelReply = document.querySelector("#reply-cancel-button")
  if (oldCancelReply) oldCancelReply.remove()
}

const onSubmitReply = (textarea, targetId) => e => {
  const text = textarea.value

  const onPostCommentResponse = comment => {
    attachComment(comment, textarea.parentElement)
    clearReply()
    console.log({ comment })
  }

  postComment(targetId, text).then(onPostCommentResponse).catch(setErrorStatus)
}

const onReplyToComment = comment => e => {
  clearReply()

  const parentElement = e.target.parentElement
  parentElement.classList.add("is-reply")

  const textarea = document.createElement("textarea")
  textarea.setAttribute("id", "reply-textarea")
  const submitReplyButton = document.createElement("button")
  submitReplyButton.innerHTML = "submit"
  submitReplyButton.setAttribute("id", "reply-submit-button")
  submitReplyButton.addEventListener(
    "click",
    onSubmitReply(textarea, comment.id)
  )

  const cancelReplyButton = document.createElement("button")

  cancelReplyButton.innerHTML = "cancel"
  cancelReplyButton.setAttribute("id", "reply-cancel-button")
  cancelReplyButton.addEventListener("click", clearReply)

  parentElement.insertBefore(textarea, e.target)
  parentElement.insertBefore(submitReplyButton, e.target)
  parentElement.insertBefore(cancelReplyButton, e.target)
  console.log(`reply to ${comment.id}`, parentElement)
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
  replyCommentButton.innerText = "comment"
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

const getSelf = (userObj?: { user: string }) =>
  getOneUser(userObj.user).then(setUserStatus).catch(setErrorStatus)

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

  postAuth(username, password).then(updateLoginStatus).catch(setErrorStatus)
}

const updateLoginStatus = () =>
  getCurrentUser()
    .then(getSelf)
    .catch(currUserError => {
      if (currUserError.status && currUserError.status === 401) {
        setUserStatus()
      } else setErrorStatus(currUserError)
    })

const setup = () => {
  const logoutButton = document.querySelector("#log-out-button")
  logoutButton.addEventListener("click", onLogoutClick)

  const loginButton = document.querySelector("#log-in-button")
  loginButton.addEventListener("click", onLoginClick)

  updateLoginStatus()

  getAllTopics().then(onReceiveTopics, setStatus)
}

setup()
