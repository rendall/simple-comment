import { ObjectId } from "mongodb"

export type AuthToken = string
export type CommentId = string
export type TopicId = string
export type Email = string
export type URL = string
export type UserId = string

export type Headers = { [key: string]: string }

/**
 * This is the type returned by a decoded AuthToken
 **/
export type TokenClaim = { user: UserId; exp: number }

export type Success<T = string> = {
  statusCode: number
  body: T
  headers?: Headers
}

export type Error = {
  statusCode: number
  body: string
  headers?: Headers
}

/**
 * Holds salient values of a Response,
 * particularly the value of `body` after ReadableStream is read **/
export type ResolvedResponse<T = string> = {
  status: number
  ok: boolean
  statusText: string
  body: T
}

export type Discussion = {
  _id?: ObjectId
  id: TopicId
  title: string
  isLocked: boolean
  replies?: Comment[]
  dateCreated: Date
  dateDeleted?: Date
}

export type Topic = Pick<
  Discussion,
  "id" | "title" | "isLocked" | "dateCreated"
>
export type NewTopic = Pick<
  Discussion,
  "id" | "title" | "isLocked" | "dateCreated"
> & { referer?: string }

export type Comment = {
  _id?: ObjectId
  id: CommentId
  userId: UserId
  user?: PublicSafeUser | AdminSafeUser
  text: string | null
  parentId: TopicId | CommentId
  replies?: Comment[]
  dateCreated: Date
  dateDeleted?: Date
}

export type DeletedComment = {
  _id?: ObjectId
  id: CommentId
  userId: null
  text: null
  parentId: TopicId | CommentId
  replies?: Comment[]
  dateCreated: Date
  dateDeleted: Date
}

export type User = {
  _id?: ObjectId
  id: UserId
  name: string
  email: Email
  hash?: string
  isAdmin?: boolean
  isVerified?: boolean
}

// This is a user that is safe to return from the server to the public
export type PublicSafeUser = Pick<User, "id" | "name" | "isAdmin">
// This is a user that is safe to return from the server to admin
export type AdminSafeUser = Pick<
  User,
  "id" | "name" | "email" | "isAdmin" | "isVerified"
>
// The information that may be expected for a new user
export type NewUser = {
  id: UserId
  name: string
  email: Email
  password: string
  isAdmin?: boolean
  isVerified?: boolean
}
// The information that can be updated for a user
export type UpdateUser = Partial<Omit<NewUser, "id">>
