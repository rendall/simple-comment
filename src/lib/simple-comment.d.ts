
export type AuthToken = string
export type CommentId = string
export type TopicId = string
export type Email = string
export type URL = string
export type UserId = string

export interface Success<T = {}> {
  code: number,
  message: string,
  body?:T
}

export interface Error {
  code: number,
  message: string
}

export interface Discussion {
  id: TopicId,
  title: string,
  isLocked: boolean,
  comments?: Comment[]
  dateCreated: Date
}

export type Topic = Pick<Discussion, "id" | "title" | "isLocked" | "dateCreated">

export interface Comment {
  id: CommentId,
  user: Pick<User, "email" | "name" | "id">,
  text: string,
  parentId: (TopicId | CommentId ),
  dateCreated: Date
}

type NewComment = Exclude<Comment, "id">
type DeletedComment = Pick<Comment, "id" | "parentId">

export interface User {
  id: UserId,
  verified: boolean,
  email: Email,
  name: string,
  avatar?: URL,
  hash: string,
  isAdmin: boolean
}


