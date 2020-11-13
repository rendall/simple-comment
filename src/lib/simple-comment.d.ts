import { ObjectId } from "mongodb"

export type AuthToken = string
export type CommentId = string
export type TopicId = string
export type Email = string
export type URL = string
export type UserId = string

export interface Success<T = string> {
  statusCode: number,
  body: (T)
}

export interface Error {
  statusCode: number,
  body: string
}

export interface Discussion {
  _id?: ObjectId,
  id: TopicId,
  title: string,
  isLocked: boolean,
  replies?: Comment[],
  dateCreated: Date
}

export type Topic = Pick<Discussion, "id" | "title" | "isLocked" | "dateCreated">

export interface Comment {
  _id?: ObjectId,
  id: CommentId,
  userId: UserId,
  user?: (PublicSafeUser | AdminSafeUser),
  text: string | null,
  parentId: (TopicId | CommentId),
  replies?: Comment[],
  dateCreated: Date,
  dateDeleted?: Date
}

export interface DeletedComment {
  _id?: ObjectId,
  id: CommentId,
  userId: null,
  text: null,
  parentId: (TopicId | CommentId),
  replies?: Comment[],
  dateCreated: Date,
  dateDeleted: Date
}

export interface User {
  _id?: ObjectId,
  id: UserId,
  name: string,
  email?: Email,
  hash?: string,
  isAdmin?: boolean,
  isVerified?: boolean
}

// This is a user that is safe to return from the server to the public
export type PublicSafeUser = Pick<User, "id" | "name" | "isAdmin">
// This is a user that is safe to return from the server to admin
export type AdminSafeUser = Pick<User, "id" | "name" | "isAdmin" | "email" | "isVerified">


