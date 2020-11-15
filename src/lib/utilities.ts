import * as jwt from "jsonwebtoken"
import * as dotenv from "dotenv"
import {
  NewUser,
  Success,
  Error,
  Topic,
  UpdateUser,
  UserId,
  AdminSafeUser,
  Comment,
  DeletedComment,
  Discussion,
  PublicSafeUser,
  User
} from "./simple-comment"

dotenv.config()

/**
 * Return object with properties in props removed
 */

/**
 * These are user properties that are unsafe to return to admins
 */
export const adminUnsafeUserProperties: (keyof User)[] = ["hash", "_id"]
/**
 * These are user properties that are unsafe to return to ordinary users and the public
 */
export const publicUnsafeUserProperties: (keyof User)[] = [
  ...adminUnsafeUserProperties,
  "email",
  "isVerified"
]
/**
 * These are user properties that only admins can modify on users
 */
export const adminOnlyModifiableUserProperties: (keyof User)[] = [
  "isVerified",
  "isAdmin"
]
/**
 * Return a user object that is clean and secure
 */
export const toSafeUser = (
  user: User,
  isAdmin: boolean = false
): PublicSafeUser | AdminSafeUser =>
  isAdmin ? toAdminSafeUser(user) : toPublicSafeUser(user)
export const toPublicSafeUser = (user: User) =>
  user ? narrowType<PublicSafeUser>(user, ["id", "name", "isAdmin"]) : user
export const toAdminSafeUser = (user: User) =>
  user
    ? narrowType<AdminSafeUser>(user, [
        "id",
        "name",
        "email",
        "isAdmin",
        "isVerified"
      ])
    : user

export const isComment = (target: Comment | Discussion): target is Comment =>
  target && target.hasOwnProperty("parentId")

export const isDeleted = (target: Comment | Discussion) =>
  target.hasOwnProperty("dateDeleted")

export const isDeletedComment = (
  target: Comment | Discussion
): target is DeletedComment =>
  isComment(target) && target.hasOwnProperty("dateDeleted")

export const isAdminSafeUser = (user: Partial<User>): user is AdminSafeUser =>
  (Object.keys(user) as (keyof User)[]).every(
    key => !adminOnlyModifiableUserProperties.includes(key)
  )
export const isPublicSafeUser = (user: Partial<User>): user is PublicSafeUser =>
  (Object.keys(user) as (keyof User)[]).every(
    key => !publicUnsafeUserProperties.includes(key)
  )

const AUTHORIZATION_HEADER = "Authorization"
const BEARER_SCHEME = "Bearer"
const BASIC_SCHEME = "Basic"
const ACCESS_CONTROL_ALLOW_ORIGIN = "Access-Control-Allow-Origin"

const hasHeader = (headers: { [header: string]: string }, header: string) =>
  Object.keys(headers).some(
    h => h.toLowerCase() === header.toLowerCase() && headers[h] !== undefined
  )

const getHeader = (headers: { [header: string]: string }, header: string) =>
  Object.keys(headers).find(h => h.toLowerCase() === header.toLowerCase())

const getHeaderValue = (
  headers: { [header: string]: string },
  header: string
) => headers[getHeader(headers, header)]

const getOrigin = (headers: { [header: string]: string }) =>
  getHeaderValue(headers, "origin")

export const getAllowedOrigins = () => process.env.ALLOW_ORIGIN.split(",")
// const isAllAllowed = (allowedOrigins) => allowedOrigins.includes("*")
const isOriginAllowed = (origin: string, allowedOrigins: string[]) =>
  allowedOrigins.includes("*") || getAllowedOrigins().includes(origin)

/** Returns the proper headers for Access-Control-Allow-Origin
 * as set in .env and as determined by the Request Origin header
 *
 * If allowed origin is '*" will return that header
 *
 * If allowed origin list matches origin, will return that header + vary:origin
 *
 * If no match will return {}
 *
 **/
export const getAllowOriginHeaders = (
  headers: { [header: string]: string },
  allowedOrigins: string[] = []
): {} | { "Access-Control-Allow-Origin": string; Vary?: "Origin" } =>
  // This function is so clunky from the need to return two headers if there
  // is an exact match and *no* headers if there is not!
  allowedOrigins.includes("*")
    ? { "Access-Control-Allow-Origin": "*" }
    : allowedOrigins.includes(getOrigin(headers))
    ? { "Access-Control-Allow-Origin": getOrigin(headers), Vary: "Origin" }
    : {}

const parseAuthHeaderValue = (
  authHeaderValue: string,
  spaceIndex?: number
): { scheme: string; credentials: string } =>
  spaceIndex === undefined
    ? parseAuthHeaderValue(authHeaderValue, authHeaderValue.indexOf(" "))
    : {
        scheme: authHeaderValue.slice(0, spaceIndex),
        credentials: authHeaderValue.slice(spaceIndex + 1)
      }

export const REALM = "Access to restricted resources"
/** nowPlusMinutes returns the numericDate `minutes` from now */
export const nowPlusMinutes = (minutes: number): number =>
  new Date(new Date().valueOf() + minutes * 60 * 1000).valueOf()

export const getAuthHeaderValue = (headers: {
  [header: string]: string
}): string | undefined => getHeaderValue(headers, AUTHORIZATION_HEADER)

export const getAuthCredentials = (authHeaderValue: string) =>
  parseAuthHeaderValue(authHeaderValue).credentials

export const hasBasicScheme = (
  headers: { [header: string]: string },
  parse?: { scheme: string; credentials: string }
) =>
  parse === undefined
    ? hasHeader(headers, AUTHORIZATION_HEADER)
      ? hasBasicScheme(
          headers,
          parseAuthHeaderValue(getHeaderValue(headers, AUTHORIZATION_HEADER))
        )
      : false
    : parse.scheme.toLowerCase() === BASIC_SCHEME.toLowerCase()

export const hasBearerScheme = (
  headers: { [header: string]: string },
  parse?: { scheme: string; credentials: string }
) =>
  parse === undefined
    ? hasHeader(headers, AUTHORIZATION_HEADER)
      ? hasBearerScheme(
          headers,
          parseAuthHeaderValue(getHeaderValue(headers, AUTHORIZATION_HEADER))
        )
      : false
    : parse.scheme.toLowerCase() === BEARER_SCHEME.toLowerCase()

/** decodeAuthHeader expects a string of the form `Basic someBase64String==` and returns its plaintext decode */
const decodeAuthHeader = authHeaderValue =>
  Buffer.from(authHeaderValue.slice(6), "base64").toString()

/** parseAuthHeader expects a string of the form `user:password` and returns an object of the form {user, password} Will fail if the : character is in the user name */
const parseAuthHeader = (
  plainText: string,
  colonIndex?: number
): { user: string; password: string } =>
  colonIndex === undefined
    ? parseAuthHeader(plainText, plainText.indexOf(":"))
    : {
        user: plainText.slice(0, colonIndex),
        password: plainText.slice(colonIndex + 1)
      }

export const getUserIdPassword = eventHeaders =>
  [getAuthHeaderValue, decodeAuthHeader, parseAuthHeader].reduce(
    (acc, func) => func(acc),
    eventHeaders
  )

export const getUserId = (headers: {
  [key: string]: string
}): UserId | null => {
  const isBearer = hasBearerScheme(headers)

  if (!isBearer) return null

  const authHeaderValue = getAuthHeaderValue(headers)
  const token = getAuthCredentials(authHeaderValue)
  const claim: { user: UserId; exp: number } = jwt.verify(
    token,
    process.env.JWT_SECRET
  ) as { user: UserId; exp: number }
  const isExpired = claim.exp <= new Date().valueOf()

  if (isExpired) return null

  return claim.user
}

/**
 * return the path directory after endpoint or null if none
 * /dir1/endpoint/somestring/anotherstring returns somestring
 * /dir1/endpoint/somestring returns somestring
 * /dir1/endpoint returns null
 * /dir1/somestring/anotherstring returns null
 **/
export const getTargetId = (
  path: string,
  endpoint: string,
  dirs?: string[]
): string | null => {
  if (dirs === undefined) return getTargetId(path, endpoint, path.split("/"))

  if (dirs.length <= 1) return null // this means dirs[0] is endpoint or endpoint does not exist

  if (dirs[0] === endpoint) return dirs[1]

  return getTargetId(path, endpoint, dirs.splice(1))
}

type GenericObj = { [key: string]: string | number | boolean }

const parseBody = (body: string): GenericObj =>
  body
    .split("&")
    .map(i => i.split("="))
    .map(([key, value]: [string, string]) => [key, decodeURIComponent(value)])
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})

const narrowType = <T>(obj: GenericObj | User, keys: (keyof T)[]) =>
  Object.entries(obj).reduce(
    (narrowType, [key, value]) =>
      keys.includes(key as keyof T)
        ? { ...narrowType, [key]: value }
        : narrowType,
    {}
  ) as T

const newUserKeys: (keyof NewUser)[] = [
  "id",
  "isAdmin",
  "email",
  "isVerified",
  "name",
  "password"
]
export const getNewUserInfo = (body: string): NewUser =>
  narrowType<NewUser>(parseBody(body), newUserKeys)
const updatedUserKeys: (keyof UpdateUser)[] = [
  "isAdmin",
  "email",
  "isVerified",
  "name"
]
export const getUpdatedUserInfo = (body: string): UpdateUser =>
  narrowType<UpdateUser>(parseBody(body), updatedUserKeys) as UpdateUser

export const getNewTopicInfo = (body: string): Topic =>
  narrowType<Topic>(parseBody(body), ["id", "title", "isLocked"]) as Topic
export const getUpdateTopicInfo = (body: string): Topic =>
  narrowType<Topic>(parseBody(body), ["title", "isLocked"]) as Topic

export const isError = (res: Success | Error): boolean => res.statusCode >= 400

export class HeaderList {
  private _headers: { [header: string]: string }
  constructor(headers?: { [header: string]: string }) {
    this._headers = headers
  }
  add = (header, value) => {
    this._headers = { ...this._headers, ...{ [header]: value } }
  }
  get headers() {
    return this._headers
  }
}
