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

/** Fetch a guest token for guest posts, if allowed
 * @returns {ResolvedResponse<AuthToken>}
 */
export const getGuestToken = () =>
  fetch(`${URL}/.netlify/functions/gauth`, {
    credentials: "include"
  }).then(res => resolveBody<AuthToken>(res))

/** Verify claim in local HTTPCookie, if it exists
 * @async
 * @function
 * @returns {ResolvedResponse<TokenClaim>}
 */
export const verifyUser = () =>
  fetch(`${URL}/.netlify/functions/verify`, {
    credentials: "include"
  }).then(res => resolveBody<TokenClaim>(res))

/** Fetch all user info
 * @async
 * @function
 * @returns {ResolvedResponse<User[]>}
 */
export const getAllUsers = () =>
  fetch(`${URL}/.netlify/functions/user`, {
    credentials: "include"
  }).then(res => resolveBody<AdminSafeUser[] | PublicSafeUser[]>(res))

/** Fetch user info
 * @async
 * @function
 * @param {UserId} userId - username/userid
 * @returns {ResolvedResponse<User>}
 */
export const getOneUser = (userId: UserId) =>
  fetch(`${URL}/.netlify/functions/user/${userId}`, {
    credentials: "include"
  }).then(res => resolveBody<AdminSafeUser | PublicSafeUser>(res))

/** Create a user
 * @async
 * @function
 * @param {NewUser} newUserInfo
 * @returns {ResolvedResponse<User>}
 */
export const createUser = (newUserInfo: NewUser) =>
  fetch(`${URL}/.netlify/functions/user/`, {
    body: objToQuery(newUserInfo),
    method: "POST",
    credentials: "include"
  }).then(res => resolveBody<AdminSafeUser>(res))

/** Create a guest user
 * @async
 * @function
 * @param {obj} userInfo
 * @returns {ResolvedResponse<User>}
 */
export const createGuestUser = (userInfo: {
  id: string
  name: string
  email: string
}) => createUser({ ...userInfo, password: "" })

/** Revoke user authentication by expiring the auth token
 * @async
 * @function
 * @returns {ResolvedResponse}
 */
export const deleteAuth = () =>
  fetch(`${URL}/.netlify/functions/auth`, {
    method: "DELETE",
    credentials: "include"
  }).then(res => resolveBody(res))

/** Retrieve user authentication
 * @param {string} user - username/userid (term used interchangeably)
 * @param {string} password - user password
 * @returns {ResolvedResponse<AuthToken>}
 */
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

/** Post a comment
 * @async
 * @function
 * @param {string} targetId - comment or topic id to attach this reply to
 * @param {string} text - the comment copy
 * @returns {ResolvedResponse}
 */
export const postComment = (targetId, text) =>
  fetch(`${URL}/.netlify/functions/comment/${targetId}`, {
    body: text,
    method: "POST",
    credentials: "include"
  }).then(res => resolveBody(res))

/** Delete a comment
 * @async
 * @function
 * @param {string} commentId
 * @return {ResolvedResponse}
 */
export const deleteComment = commentId =>
  fetch(`${URL}/.netlify/functions/comment/${commentId}`, {
    method: "DELETE",
    credentials: "include"
  }).then(res => resolveBody(res))

// TOPIC & DISCUSSION
// A discussion is a topic with all comments attached

/** Fetch a discussion
 * @async
 * @function
 * @param {string} topicId
 * @returns {Discussion}
 */
export const getOneDiscussion = topicId =>
  fetch(`${URL}/.netlify/functions/topic/${topicId}`, {
    credentials: "include"
  }).then(res => resolveBody<Discussion>(res))

/** Fetch all topics
 * @async
 * @function
 * @returns {Topic[]}
 */
export const getAllTopics = () =>
  fetch(`${URL}/.netlify/functions/topic`, {
    credentials: "include"
  }).then(res => resolveBody<Topic[]>(res))

/** Generate a Topic id
 * @function
 * @param {string} title - Any string. default: window.location.href
 * @returns {string} - a slug using only characters: `a-z`, `0-9` and `-`
 */
export const getDefaultDiscussionId = (title:string = window.location.href) =>
  title.toLowerCase().replace(/[^a-z0-9 ]/g, "-")

/** Create a new Topic
 * @async
 * @function
 * @param {string} id - a slug to identify the new Topic using only characters: `a-z`, `0-9` and `-`
 * @param {string} title - The title of the Topic
 * @param {boolean} isLocked - set to 'true' if the Topic should be 'locked'. default value is 'false'
 */
export const createNewTopic = (id, title, isLocked = false) => {
  const body = `id=${id}&title=${title}&isLocked=${isLocked}`
  const credentials: RequestCredentials = "include"
  const authReqInfo = {
    method: "POST",
    body,
    credentials
  }

  return fetch(`${URL}/.netlify/functions/topic`, authReqInfo).then(res =>
    resolveBody(res)
  )
}

// UTILITY

/** Convert an object of type { prop1:val1, prop2:val2, ... } to string "prop1=val1&prop2=val2..."
 * @function
 * @param obj {object}
 * @returns {string}
 */
export const objToQuery = (obj: {}) =>
  Object.entries(obj)
    .map(entry => `${entry[0]}=${entry[1]}`)
    .join("&")

/** Return true if UserId `id` is a GuestId
 * @param {UserId} id - username/userid
 * @returns {boolean}
 */
export const isGuestId = (id: UserId) =>
  id.match(
    /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i
  )
export const formatDate = (dateStr: string | Date) =>
  `${new Date(dateStr).toLocaleString()}`
// Validate email
export const isValidEmail = (x: string) =>
  x.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i)
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

/** Return true if 'discussion' or 'comment' is a Topic, false otherwise 
 * @param discussion {Discussion | Comment}
 * @returns {boolean}
 */
export const isTopic = (
  discussion: Discussion | Comment
): discussion is Topic => !(discussion as Comment).parentId

/** Consume `Set-Cookie` response header at 'url' and set its Http Cookie locally
 * *Deprecated*
 * @param {HTMLElement} elem = The HTMLElement to which to attach the dummy HTMLImageElement
 * @param {string} url - The url which responds with a Set-Cookie URL
 * @deprecated - This method bypasses cross-origin constraints
 */
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