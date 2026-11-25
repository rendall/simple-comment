import type { APIGatewayEvent } from "aws-lambda"
import type {
  CommentId,
  Success,
  Error,
  Comment,
} from "../lib/simple-comment-types"
import { MongodbService } from "../lib/MongodbService"
import { getNotificationService } from "../lib/getNotificationService"
import {
  error400BadRequest,
  error500InternalServerError,
  error404CommentNotFound,
  error405MethodNotAllowed,
  success200OK,
} from "./../lib/messages"
import {
  addHeaders,
  getAllowedOrigins,
  getAllowOriginHeaders,
  getTargetId,
  getUserId,
  isDefined,
  toApiError,
  toDefinedHeaders,
} from "../lib/backend-utilities"
import { getBackendEnv } from "../lib/env"

const { dbConnectionString, databaseName } = getBackendEnv()

const service: MongodbService = new MongodbService(
  dbConnectionString,
  databaseName,
  getNotificationService()
)

const getAllowHeaders = (event: APIGatewayEvent) => {
  const allowedMethods = {
    "Access-Control-Allow-Methods": "POST,GET,OPTIONS,PUT,DELETE",
    "Access-Control-Allow-Credentials": "true",
  }

  const eventHeaders = toDefinedHeaders(event.headers)

  const allowedOriginHeaders = getAllowOriginHeaders(
    eventHeaders,
    getAllowedOrigins()
  )
  const headers = { ...allowedMethods, ...allowedOriginHeaders }
  return headers
}

export const handler = async (event: APIGatewayEvent) => {
  const dirs = event.path.split("/")
  const isApproval =
    dirs[dirs.length - 3] === "comment" && dirs[dirs.length - 1] === "approve"
  const isValidPath = dirs.length <= 5 || (dirs.length === 6 && isApproval)
  const headers = {
    ...getAllowHeaders(event),
    ...(event.httpMethod === "GET" && { "Cache-Control": "private, no-store" }),
  }

  if (!isValidPath)
    return addHeaders(
      {
        ...error404CommentNotFound,
        body: `${event.path} is not valid`,
      },
      headers
    )
  const eventHeaders = toDefinedHeaders(event.headers)
  const authUserId = getUserId(eventHeaders) ?? undefined
  const targetId = getTargetId(event.path, "comment") as CommentId

  const handleMethod = async (
    method: APIGatewayEvent["httpMethod"]
  ): Promise<Success<Comment> | Error> => {
    if (isApproval && method !== "OPTIONS") {
      if (method !== "POST") return error405MethodNotAllowed
      if (!targetId || !isDefined(event.body)) return error400BadRequest
      return service.commentAPPROVE(targetId, event.body, authUserId)
    }
    switch (method) {
      case "GET":
        return service.commentGET(targetId, authUserId)
      case "POST":
        if (isDefined(event.body))
          return service.commentPOST(targetId, event.body, authUserId)
        else return new Promise<Error>(resolve => resolve(error400BadRequest))
      case "PUT":
        if (isDefined(event.body))
          return service.commentPUT(targetId, event.body, authUserId)
        else return new Promise<Error>(resolve => resolve(error400BadRequest))
      case "DELETE":
        return service.commentDELETE(
          targetId,
          authUserId,
          event.body ?? undefined
        )
      case "OPTIONS":
        return new Promise<Success>(resolve =>
          resolve({ ...success200OK, headers })
        )
      default:
        return new Promise<Error>(resolve => resolve(error405MethodNotAllowed))
    }
  }

  try {
    const response = await handleMethod(event.httpMethod)
    return addHeaders(response, headers)
  } catch (error) {
    return addHeaders(toApiError(error, error500InternalServerError), headers)
  }
}
