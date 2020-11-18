import { TopicId, UserId } from "./../../lib/simple-comment"

const processResponse = (res: Response) => {
  if (res.ok === false) {
    throw res
  } else return res.json()
}

export const getCurrentUser = () =>
  fetch("/.netlify/functions/verify").then(processResponse)

export const getAllUsers = () =>
  fetch("/.netlify/functions/user").then(processResponse)

export const getOneUser = (userId: UserId) =>
  fetch(`/.netlify/functions/user/${userId}`).then(processResponse)

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

export const deleteAuth = () =>
  fetch(`/.netlify/functions/auth`, {
    method: "DELETE"
  }).then(processResponse)

export const postAuth = (user: string, password: string) => {
  const credentials: RequestCredentials = "include"
  const encode = `${user}:${password}`
  const basicCred = window.btoa(encode)

  const authReqInfo = {
    credentials: credentials,
    method: "POST",
    headers: {
      Authorization: `Basic ${basicCred}`
    }
  }

  return fetch(`/.netlify/functions/auth`, authReqInfo).then(processResponse)
}

// TOPICS

export const getAllTopics = () =>
  fetch("/.netlify/functions/topic").then(processResponse)

export const getOneTopic = (topicId: TopicId) =>
  fetch(`/.netlify/functions/topic/${topicId}`).then(processResponse)

export const getDefaultDiscussionId = () =>
  window.location.href.toLowerCase().replace(/[^a-z0-9]/g, "-")

export const createNewTopic = (id, title, isLocked = false) => {
  const body = `id=${id}&title=${title}&isLocked=${isLocked}`
  const authReqInfo = {
    method: "POST",
    body
  }

  return fetch(`/.netlify/functions/topic`, authReqInfo).then(processResponse)
}
