import { Success, Error } from "./simple-comment"
export const error400BadRequest: Error = {
  statusCode: 400,
  body: "Bad Request"
}
export const error400CommentIdMissing: Error = {
  statusCode: 400,
  body: "Comment id missing"
}
export const error400NoUpdate: Error = {
  statusCode: 400,
  body: "Comment text is same"
}

export const error400UserIdMissing: Error = {
  statusCode: 400,
  body: "UserId missing"
}
export const error400PasswordMissing: Error = {
  statusCode: 400,
  body: "Password missing"
}
export const error401BadCredentials: Error = {
  statusCode: 401,
  body: "Bad credentials"
}
export const error401UserNotAuthenticated: Error = {
  statusCode: 401,
  body: "User not authenticated"
}
export const error403Forbidden: Error = { statusCode: 403, body: "Forbidden" }
export const error403ForbiddenToModify: Error = {
  statusCode: 403,
  body: "Forbidden to modify"
}
export const error403UserNotAuthorized: Error = {
  statusCode: 403,
  body: "User not authorized"
}
export const error404CommentNotFound: Error = {
  statusCode: 404,
  body: "Comment not found"
}
export const error404NotFound: Error = {
  statusCode: 404,
  body: "Not found"
}
export const error404TopicNotFound: Error = {
  statusCode: 404,
  body: "Topic not found"
}
export const error404UserUnknown: Error = {
  statusCode: 404,
  body: "Unknown user"
}
export const error405MethodNotAllowed: Error = {
  statusCode: 405,
  body: "Method not allowed"
}
export const error409DuplicateTopic: Error = {
  statusCode: 409,
  body: "Discussion already exists"
}
export const error409DuplicateComment: Error = {
  statusCode: 409,
  body: "Duplicate comment"
}
export const error409UserExists: Error = {
  statusCode: 409,
  body: "UserId exists"
}
export const error413CommentTooLong: Error = {
  statusCode: 413,
  body: "Comment too long"
}
export const error500UpdateError: Error = {
  statusCode: 500,
  body: "Update error"
}
export const success200OK: Success = { statusCode: 200, body: "OK" }
export const success204NoContent: Success = { statusCode: 204, body: undefined }
export const success201CommentCreated: Success = {
  statusCode: 201,
  body: "Comment created"
}
export const success201UserCreated: Success = {
  statusCode: 201,
  body: "User created"
}
export const success202CommentDeleted: Success = {
  statusCode: 202,
  body: "Comment deleted"
}
export const success202LoggedOut: Success = {
  statusCode: 202,
  body: "Logged out"
}
export const success202TopicDeleted: Success = {
  statusCode: 202,
  body: "Topic deleted"
}
export const success202UserDeleted: Success = {
  statusCode: 202,
  body: "User deleted"
}
export const success204CommentUpdated: Success = {
  statusCode: 204,
  body: "Comment updated"
}
export const success204UserUpdated: Success = {
  statusCode: 204,
  body: "User updated"
}
