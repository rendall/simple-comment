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

const actionValues = [
  "postComment"
] as const;

type ValueMap<T extends readonly string[]> = {
  [K in T[number]]: K;
};

export const Action: ValueMap<typeof actionValues> = actionValues.reduce((acc, value) => ({ ...acc, value }), {} as ValueMap<typeof actionValues>);
export type ActionType = (typeof Action)[keyof typeof Action]

export type Policy = {
  isGuestAccountAllowed : boolean, // if true, a visitor can post anonymously using a guest account. if false, only authenticated users can comment.
  canFirstVisitCreateTopic : boolean, // if a discussion does not exist for a page, shall it be created when visited for the first time, or does admin create all topics?
  canGuestCreateUser : boolean, // can a user with guest credentials create (their own) user profile? if 'canPublicCreateUser' is set to 'true' this setting is ignored
  canGuestReadDiscussion : boolean, // can a user with guest credentials browse and read discussions? if 'canPublicReadDiscussion' is set to 'true' this setting is ignored
  canGuestReadUser : boolean, // can a user with guest credentials view user profiles? if 'canPublicReadUser' is true, this setting is ignored
  canPublicCreateUser : boolean, // can a user with no credentials create (their own) user profile?
  canPublicReadDiscussion : boolean, // can a user with no credentials browse and read discussions?
  canPublicReadUser : boolean, // can an anonymous visitor view any user's profile?
  canUserDeleteSelf : boolean, // can a user delete their own profile?
  maxCommentLengthChars : number, // Attempting to post a comment longer than this number of characters will be rejected by the API
}