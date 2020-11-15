import { Discussion, Topic, User, UserId } from "./../../lib/simple-comment"

const onReceiveTopics = (value: Topic[]) => {
  console.log({ value })
}

const onReceiveUsers = (value: User[]) => {
  console.log({ value })
}

const onReceiveSingleUser = (value: User) => {
  console.log({ value })
}

const onReceiveDiscussion = (value: Discussion) => {
  console.log({ value })
}

const onError = (reason: any) => {
  console.error(reason)
}

const processResponse = (res: Response) => res.json()

export const getAllTopics = () =>
  fetch("/.netlify/functions/topic")
    .then(processResponse, onError)
    .then(onReceiveTopics)

export const getAllUsers = () =>
  fetch("/.netlify/functions/user")
    .then(processResponse, onError)
    .then(onReceiveUsers, onError)

export const getOneUser = (userId: UserId) =>
  fetch("/.netlify/functions/user/{userId}")
    .then(processResponse, onError)
    .then(onReceiveSingleUser, onError)

/**
 * A discussion is a topic with all comments attached
 **/
export const getOneDiscussion = topicId =>
  fetch(`/.netlify/functions/topic/${topicId}`)
    .then(processResponse, onError)
    .then(onReceiveDiscussion, onError)

export const postComment = (targetId, comment) =>
  fetch(`/.netlify/functions/comment/${targetId}`)
    .then(processResponse, onError)
    .then(onReceiveDiscussion, onError)

// 'topicGET', 'topicPOST',
//   'topicGET', 'topicPUT',
//   'topicDELETE', 'commentPOST',
//   'commentGET', 'commentPUT',
//   'commentDELETE', 'userGET',
//   'userPOST', 'userGET',
//   'userPUT', 'userDELETE',
//   'authGET', 'authPOST'
