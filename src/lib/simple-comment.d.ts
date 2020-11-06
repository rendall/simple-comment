
export type AuthToken = string
export type CommentId = string
export type DiscussionId = string
export type Email = string
export type URL = string
export type UserId = string

export interface Success {
  code: number,
  message: string
}

export interface Error {
  code: number,
  message: string
}

export interface Comment {
  id: CommentId,
  discussion: DiscussionId,
  user: UserId,
  text: string,
  parentComment?: CommentId,
  edits?:Comment[],
  dateCreated: Date,
  dateModified: Date
}

export interface User {
  id:UserId,
  verified:boolean,
  email:Email,
  name:string,
  avatar:URL,
  isAdmin:boolean
}

export interface Discussion {
  id:DiscussionId,
  isLocked: boolean,
  comments: Comment[]
}
