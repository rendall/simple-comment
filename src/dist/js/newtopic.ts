/** This script will attempt to downlaod a Simple Comment discussion.
 * If not found, it will attempt to create the topic and try again
 * When the topic is downloaded, it will populate the page with
 * any comments and add a reply text field */
import {
  createNewTopic,
  getDefaultDiscussionId,
  getOneTopic
} from "./apiClient.js"

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

const setErrorStatus = message => {
  setStatus(message, true)
}

const populateComments = popCommResp => console.log({ popCommResp })

const downloadDiscussion = discussionId =>
  getOneTopic(discussionId)
    .then((resp) => {
      setStatus("Discussion found! - attempting to populate discussion...")
      populateComments(resp)
    })

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

  setStatus("UI setup complete - attempting download...")

  downloadDiscussion(discussionId).catch(err => {
    if (err.status === 404) {
      setErrorStatus("Discussion not found - attempting to create it...")
      tryCreatingTopic(discussionId, title)
    }
    else setErrorStatus(err)
  })
}

setup()
