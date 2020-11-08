import { Success, Error } from "./simple-comment";

export const user201: Success = {
  code: 201,
  message: "User created"
}

export const user401: Error = {
  code: 401,
  message: "Bad credentials"
}

export const user404: Error = {
  code: 404,
  message: "Unknown user"
}

export const userExists400: Error = {
  code: 400,
  message: "UserId exists"
}

export const userNotAuthenticated401: Error = {
  code: 401,
  message: "User not authenticated"
}

export const userNotAuthorized403: Error = {
  code: 403,
  message: "User not authorized"
}

export const discussionExists400: Error = {
  code: 400,
  message: "Discussion already exists"
}

export const userDeleted202: Success = {
  code: 202,
  message: "User deleted"
}

export const userUpdated204: Success = {
  code: 204,
  message: "User updated"
}

export const comment404: Error = {
  code:404,
  message: "Comment not found"
}

export const commentDeleted202: Success = {
  code: 202,
  message: "Comment deleted"
}

export const commentTooLong413: Error = {
  code:413,
  message: "Comment too long"
}