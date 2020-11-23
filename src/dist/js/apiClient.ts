import { stringify } from "querystring"
import {
  AdminSafeUser,
  AuthToken,
  Discussion,
  PublicSafeUser,
  ResolvedResponse,
  TokenClaim,
  Topic,
  TopicId,
  UserId
} from "./../../lib/simple-comment"

/**
 * Return the response with the body field read and resolved
 *
 **/
const resolveBody = async <T>(
  res: Response
): Promise<ResolvedResponse<string | T>> => {
  const textRes = res.clone()
  const body = await res.json().catch(() => textRes.text())
  const { status, ok, statusText } = res
  const resolvedRes = { status, ok, statusText, body }

  if (!resolvedRes.ok) throw resolvedRes
  else return resolvedRes
}

export const getGuestToken = () =>
  fetch("/.netlify/functions/gauth").then(res => resolveBody<AuthToken>(res))

export const verifyUser = () =>
  fetch("/.netlify/functions/verify").then(res => resolveBody<TokenClaim>(res))

export const getAllUsers = () =>
  fetch("/.netlify/functions/user").then(res =>
    resolveBody<AdminSafeUser[] | PublicSafeUser[]>(res)
  )

export const getOneUser = (userId: UserId) =>
  fetch(`/.netlify/functions/user/${userId}`).then(res =>
    resolveBody<AdminSafeUser | PublicSafeUser>(res)
  )

/**
 * A discussion is a topic with all comments attached
 **/
export const getDiscussion = topicId =>
  fetch(`/.netlify/functions/topic/${topicId}`).then(res =>
    resolveBody<Discussion>(res)
  )

export const postComment = (targetId, text, user?) =>
  fetch(`/.netlify/functions/comment/${targetId}`, {
    body: JSON.stringify({ text, user }),
    method: "POST"
  }).then(res => resolveBody(res))

export const deleteAuth = () =>
  fetch(`/.netlify/functions/auth`, {
    method: "DELETE"
  }).then(res => resolveBody(res))

export const postAuth = (user: string, password: string) => {
  const credentials: RequestCredentials = "include"
  const encode = `${user}:${password}`

  const nonAsciiChars = encode.match(/[^\x00-\x7F]/g)

  //TODO: Allow UTF-8 chars
  // window.btoa will fail if encode includes non-ASCII chars
  // This page seems to have good advice: https://attacomsian.com/blog/javascript-base64-encode-decode
  // Until then, throw an error if it's attempted
  if (nonAsciiChars) {
    throw Error(
      `Username / password combination included non-ASCII characters ${nonAsciiChars.join(
        ", "
      )}`
    )
  }

  const basicCred = window.btoa(encode)

  const authReqInfo = {
    credentials: credentials,
    method: "POST",
    headers: {
      Authorization: `Basic ${basicCred}`
    }
  }

  return fetch(`/.netlify/functions/auth`, authReqInfo).then(res =>
    resolveBody<AuthToken>(res)
  )
}

// TOPICS

export const getAllTopics = () =>
  fetch("/.netlify/functions/topic").then(res => resolveBody<Topic[]>(res))

export const getOneTopic = (topicId: TopicId) =>
  fetch(`/.netlify/functions/topic/${topicId}`).then(res =>
    resolveBody<Discussion>(res)
  )

export const getDefaultDiscussionId = () =>
  window.location.href.toLowerCase().replace(/[^a-z0-9]/g, "-")

export const createNewTopic = (id, title, isLocked = false) => {
  const body = `id=${id}&title=${title}&isLocked=${isLocked}`
  const authReqInfo = {
    method: "POST",
    body
  }

  return fetch(`/.netlify/functions/topic`, authReqInfo).then(res =>
    resolveBody(res)
  )
}
