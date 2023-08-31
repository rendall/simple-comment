import { isResponseOk } from "./frontend-utilities"
import type {
  AdminSafeUser,
  AuthToken,
  Comment,
  CommentId,
  Discussion,
  NewUser,
  PublicSafeUser,
  ServerResponse,
  ServerResponseError,
  TokenClaim,
  Topic,
  TopicId,
  User,
  UserId,
} from "./lib/simple-comment-types"

const trimDash = (slug: string) => slug.replace(/-+$/, "").replace(/^-+/, "")
const cleanSlug = (slug: string): string =>
  slug.match(/--/) ? cleanSlug(slug.replace(/--/g, "-")) : trimDash(slug)

/** Returns a slugified version of the given string */
export const toSlug = (x: string) => {
  const slug = x.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return cleanSlug(slug)
}
// Set SIMPLE_COMMENT_API_URL variable in the .env file, following example.env
const SIMPLE_COMMENT_API_URL = process.env.SIMPLE_COMMENT_API_URL

const getSimpleCommentURL = () => {
  if (SIMPLE_COMMENT_API_URL === undefined)
    throw new Error("Simple comment URL is not set in .env file")
  else return SIMPLE_COMMENT_API_URL
}

/** Fetch a guest token for guest posts, if allowed
 * @returns {ServerResponse<AuthToken>}
 */
export const getGuestToken = () =>
  fetch(`${getSimpleCommentURL()}/gauth`, {
    credentials: "include",
  }).then(res => resolveBody<AuthToken>(res))

/** Verify claim in local HTTPCookie, if it exists
 * @async
 * @function
 * @returns {ServerResponse<TokenClaim>}
 */
export const verifyUser = () =>
  fetch(`${getSimpleCommentURL()}/verify`, {
    credentials: "include",
  }).then(res => resolveBody<TokenClaim>(res))

/* getSelf
 * Request information about the current user and display it */
export const getSelf = (claim: TokenClaim) =>
  getOneUser(claim.user).then(res => res.body as AdminSafeUser)

/** verifySelf
 * Verify token information and then retrieve self information using getSelf
 */
export const verifySelf = () =>
  verifyUser()
    .then(res => res.body as TokenClaim)
    .then(getSelf)

/** Fetch all user info
 * @async
 * @function
 * @returns {ServerResponse<User[]>}
 */
export const getAllUsers = () =>
  fetch(`${getSimpleCommentURL()}/user`, {
    credentials: "include",
  }).then(res => resolveBody<AdminSafeUser[] | PublicSafeUser[]>(res))

/** Fetch user info
 * @async
 * @function
 * @param {UserId} userId - username/userid
 * @returns {ServerResponse<User>}
 */
export const getOneUser = (userId: UserId) =>
  fetch(`${getSimpleCommentURL()}/user/${userId}`, {
    credentials: "include",
  }).then(res => resolveBody<AdminSafeUser | PublicSafeUser>(res))

/** Create a user
 * @async
 * @function
 * @param {NewUser} newUserInfo
 * @returns {ServerResponse<User>}
 */
export const createUser = (newUserInfo: NewUser) =>
  fetch(`${getSimpleCommentURL()}/user`, {
    body: objToQuery(newUserInfo),
    method: "POST",
    credentials: "include",
  }).then(res => resolveBody<AdminSafeUser>(res))

/** Update a user
 * @async
 * @function
 * @param {NewUser} newUserInfo
 * @returns {ServerResponse<User>}
 */
export const updateUser = (userInfo: User) =>
  fetch(`${getSimpleCommentURL()}/user/${userInfo.id}`, {
    body: objToQuery(userInfo),
    method: "PUT",
    credentials: "include",
  }).then(res => resolveBody<AdminSafeUser>(res))

/** Create a guest user
 * @async
 * @function
 * @param {obj} userInfo
 * @returns {ServerResponse<User>}
 */
export const createGuestUser = (userInfo: {
  id: string
  name: string
  email: string
}) => createUser({ ...userInfo, password: "" })

/** Revoke user authentication by expiring the auth token
 * @async
 * @function
 * @returns {ServerResponse}
 */
export const deleteAuth = () =>
  fetch(`${getSimpleCommentURL()}/auth`, {
    method: "DELETE",
    credentials: "include",
  }).then(res => resolveBody(res))

/** Retrieve user authentication
 * @param {string} user - username/userid (term used interchangeably)
 * @param {string} password - user password
 * @returns {ServerResponse<AuthToken>}
 */
export const postAuth = (user: string, password: string) => {
  const credentials: RequestCredentials = "include"
  const encode = `${user}:${password}`

  // eslint-disable-next-line no-control-regex
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
      Authorization: `Basic ${basicCred}`,
    },
  }

  return fetch(`${getSimpleCommentURL()}/auth`, authReqInfo).then(res =>
    resolveBody<AuthToken>(res)
  )
}

// COMMENT

/** Post a comment
 * @async
 * @function
 * @param {string} targetId - comment or topic id to attach this reply to
 * @param {string} text - the comment copy
 * @returns {ServerResponse}
 */
export const postComment = (
  targetId: CommentId,
  text: string
): Promise<ServerResponse<Comment>> =>
  fetch(`${getSimpleCommentURL()}/comment/${targetId}`, {
    body: text,
    method: "POST",
    credentials: "include",
  }).then(res => resolveBody<Comment>(res))

/** PUT (update) an edited, existing comment
 * @async
 * @function
 * @param {string} commentId - comment to update
 * @param {string} text - the updated comment copy
 * @returns {ServerResponse}
 */
export const putComment = (
  commentId: CommentId,
  text: string
): Promise<ServerResponse<Comment>> =>
  fetch(`${getSimpleCommentURL()}/comment/${commentId}`, {
    body: text,
    method: "PUT",
    credentials: "include",
  }).then(res => resolveBody<Comment>(res))

/** Delete a comment
 * @async
 * @function
 * @param {string} commentId
 * @return {ServerResponse}
 */
export const deleteComment = (commentId: CommentId) =>
  fetch(`${getSimpleCommentURL()}/comment/${commentId}`, {
    method: "DELETE",
    credentials: "include",
  }).then(res => resolveBody<string>(res))

// TOPIC & DISCUSSION
// A discussion is a topic with all comments attached

/** Fetch a discussion
 * @async
 * @function
 * @param {string} topicId
 * @returns {Discussion}
 */
export const getOneDiscussion = (topicId: TopicId) =>
  fetch(`${getSimpleCommentURL()}/topic/${topicId}`, {
    credentials: "include",
  }).then(res => resolveBody<Discussion>(res))

/** Fetch all topics
 * @async
 * @function
 * @returns {Topic[]}
 */
export const getAllTopics = () =>
  fetch(`${getSimpleCommentURL()}/topic`, {
    credentials: "include",
  }).then(res => resolveBody<Topic[]>(res))

/** Generate a Topic id
 * @function
 * @param {string} title - Any string. default: window.location.href
 * @returns {string} - a slug using only characters: `a-z`, `0-9` and `-`
 */
export const getDefaultDiscussionId = (title: string = window.location.href) =>
  toSlug(title)

/** Create a new Topic
 * @async
 * @function
 * @param {string} id - a slug to identify the new Topic using only characters: `a-z`, `0-9` and `-`
 * @param {string} title - The title of the Topic
 * @param {boolean} isLocked - set to 'true' if the Topic should be 'locked'. default value is 'false'
 */
export const createNewTopic = (
  id: TopicId,
  title: string,
  isLocked = false
) => {
  const body = `id=${id}&title=${title}&isLocked=${isLocked}`
  const credentials: RequestCredentials = "include"
  const authReqInfo = {
    method: "POST",
    body,
    credentials,
  }

  return fetch(`${getSimpleCommentURL()}/topic`, authReqInfo).then(res =>
    resolveBody(res)
  )
}

// UTILITY
//TODO: Move these utilities to frontend-utilties.ts

/** Convert an object of type { prop1:val1, prop2:val2, ... } to string "prop1=val1&prop2=val2..."
 * Use this instead of formData to reduce complexity and avoid dependencies
 * @function
 * @param obj {object}
 * @returns {string}
 */
export const objToQuery = <T extends { [s: string]: unknown }>(obj: T) =>
  Object.entries(obj)
    .map(
      entry =>
        `${encodeURIComponent(entry[0])}=${encodeURIComponent(
          entry[1] as string
        )}`
    )
    .join("&")

/** Return true if UserId `id` is a GuestId
 * @param {UserId} id - username/userid
 * @returns {boolean}
 */
export const isGuestId = (id: UserId) =>
  id.match(
    /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i
  )

// Validate email
export const isValidEmail = (email: string) => {
  if (!email || typeof email !== "string") return false
  const match = email.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i)
  return match !== null
}

//  Return the response with the body field read and resolved
const resolveBody = async <T>(res: Response): Promise<ServerResponse<T>> => {
  const textRes = res.clone()
  //TODO: return a "content-type" header from the server to obviate this check
  const body = await res
    .json()
    .catch(() => textRes.text())
    .catch(() => {
      console.error("Unknown type in response body")
      return ""
    })
  const { status, ok, statusText } = res
  const resolvedRes = { status, ok, statusText, body }

  if (isResponseOk(resolvedRes)) return resolvedRes as ServerResponse<T>
  else throw resolvedRes as ServerResponseError
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
