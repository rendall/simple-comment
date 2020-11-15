import { METHODS } from "http"
import { Discussion, Topic, User, UserId } from "./../../lib/simple-comment"

const processResponse = (res: Response) => res.json()

export const getAllTopics = () =>
  fetch("/.netlify/functions/topic").then(processResponse)

export const getAllUsers = () =>
  fetch("/.netlify/functions/user").then(processResponse)

export const getOneUser = (userId: UserId) =>
  fetch("/.netlify/functions/user/{userId}").then(processResponse)

/**
 * A discussion is a topic with all comments attached
 **/
export const getDiscussion = topicId =>
  fetch(`/.netlify/functions/topic/${topicId}`).then(processResponse)

export const postComment = (targetId, text) =>
  fetch(`/.netlify/functions/comment/${targetId}`, {
    body: text,
    method: "POST"
  }).then(processResponse)

// 'topicGET', 'topicPOST',
//   'topicGET', 'topicPUT',
//   'topicDELETE', 'commentPOST',
//   'commentGET', 'commentPUT',
//   'commentDELETE', 'userGET',
//   'userPOST', 'userGET',
//   'userPUT', 'userDELETE',
//   'authGET', 'authPOST'
