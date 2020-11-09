import { Success, Error } from "./simple-comment";
export const error400TopicExists: Error = { code: 400, message: "Discussion already exists" }
export const error400UserExists: Error = { code: 400, message: "UserId exists" }
export const error401BadCredentials: Error = { code: 401, message: "Bad credentials" }
export const error401UserNotAuthenticated: Error = { code: 401, message: "User not authenticated" }
export const error403Forbidden: Error = { code: 403, message: "Forbidden" }
export const error403UserNotAuthorized: Error = { code: 403, message: "User not authorized" }
export const error404CommentNotFound: Error = { code: 404, message: "Comment not found" }
export const error404TopicNotFound: Error = { code: 404, message: "Topic not found" }
export const error404UserUknown: Error = { code: 404, message: "Unknown user" }
export const error413CommentTooLong: Error = { code: 413, message: "Comment too long" }
export const error425DuplicateComment: Error = { code: 425, message: "Duplcate comment" }
export const success201CommentCreated: Success = { code: 201, message: "Comment created" }
export const success201UserCreated: Success = { code: 201, message: "User created" }
export const success202CommentDeleted: Success = { code: 202, message: "Comment deleted" }
export const success202UserDeleted: Success = { code: 202, message: "User deleted" }
export const success202TopicDeleted: Success = { code: 202, message: "Topic deleted" }
export const success204UserUpdated: Success = { code: 204, message: "User updated" }