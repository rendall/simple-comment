import type {
  AdminSafeUser,
  AuthToken,
  Discussion,
  NewUser,
  PublicSafeUser,
  ResolvedResponse,
  TokenClaim,
  Topic,
  Comment,
  UserId
} from "./../../lib/simple-comment"

const URL = "https://blog-rendall-dev-comments.netlify.app"

// USER & AUTH

export const getHttpCookie = (elem: HTMLElement, url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    if (!document) throw new Error("apiClient.getHttpCookie has no document")

    const img = document.createElement("img") as HTMLImageElement
    try {
      img.src = url
      elem.appendChild(img)
      resolve(img)
    } catch (error) {
      reject(error)
    }
  })

export const getGuestToken = () =>
  fetch(`${URL}/.netlify/functions/gauth`, {
    credentials: "include"
  }).then(res => resolveBody<AuthToken>(res))

export const verifyUser = () =>
  fetch(`${URL}/.netlify/functions/verify`, {
    credentials: "include"
  }).then(res => resolveBody<TokenClaim>(res))

export const getAllUsers = () =>
  fetch(`${URL}/.netlify/functions/user`, {
    credentials: "include"
  }).then(res => resolveBody<AdminSafeUser[] | PublicSafeUser[]>(res))

export const getOneUser = (userId: UserId) =>
  fetch(`${URL}/.netlify/functions/user/${userId}`, {
    credentials: "include"
  }).then(res => resolveBody<AdminSafeUser | PublicSafeUser>(res))

export const createUser = (newUserInfo: NewUser) =>
  fetch(`${URL}/.netlify/functions/user/`, {
    body: objToQuery(newUserInfo),
    method: "POST",
    credentials: "include"
  }).then(res => resolveBody<AdminSafeUser>(res))

export const createGuestUser = (userInfo: {
  id: string
  name: string
  email: string
}) => createUser({ ...userInfo, password: "" })

export const deleteAuth = () =>
  fetch(`${URL}/.netlify/functions/auth`, {
    method: "DELETE",
    credentials: "include"
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

  return fetch(`${URL}/.netlify/functions/auth`, authReqInfo).then(res =>
    resolveBody<AuthToken>(res)
  )
}

// COMMENT

export const postComment = (targetId, text) =>
  fetch(`${URL}/.netlify/functions/comment/${targetId}`, {
    body: text,
    method: "POST",
    credentials: "include"
  }).then(res => resolveBody(res))

export const deleteComment = commentId =>
  fetch(`${URL}/.netlify/functions/comment/${commentId}`, {
    method: "DELETE",
    credentials: "include"
  }).then(res => resolveBody(res))

// TOPIC & DISCUSSION

// A discussion is a topic with all comments attached
export const getOneDiscussion = topicId =>
  fetch(`${URL}/.netlify/functions/topic/${topicId}`, {
    credentials: "include"
  }).then(res => resolveBody<Discussion>(res))

export const getAllTopics = () =>
  fetch(`${URL}/.netlify/functions/topic`, {
    credentials: "include"
  }).then(res => resolveBody<Topic[]>(res))

// By default a topic/discussion id is a normalized string of the page url
export const getDefaultDiscussionId = () =>
  window.location.href.toLowerCase().replace(/[^a-z0-9]/g, "-")

export const createNewTopic = (id, title, isLocked = false) => {
  const body = `id=${id}&title=${title}&isLocked=${isLocked}`
  const credentials: RequestCredentials = "include"
  const authReqInfo = {
    method: "POST",
    headers: {
      "Referrer-Policy": "no-referrer-when-downgrade"
    },
    body,
    credentials
  }

  return fetch(`${URL}/.netlify/functions/topic`, authReqInfo).then(res =>
    resolveBody(res)
  )
}

// UTILITY

// objToQuery
// convert an object of type { prop1:val1, prop2:val2, ... } to
// string "prop1=val1&prop2=val2..."
export const objToQuery = (obj: {}) =>
  Object.entries(obj)
    .map(entry => `${entry[0]}=${entry[1]}`)
    .join("&")

//  Tests user id and returns true if it is a Guest ID
//  All guest ids are uuidv4
export const isGuestId = (id: UserId) =>
  id.match(
    /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i
  )
export const formatDate = (dateStr: string | Date) =>
  `${new Date(dateStr).toLocaleString()}`
// Validate email
export const isValidEmail = (x: string) =>
  x.match( /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i)
//  Return the response with the body field read and resolved
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
export const isTopic = (
  discussion: Discussion | Comment
): discussion is Topic => !(discussion as Comment).parentId
