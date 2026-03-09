import type { APIGatewayEvent } from "aws-lambda"
import type {
  CommentId,
  Success,
  Error,
  Comment,
} from "../lib/simple-comment-types"
import { MongodbService } from "../lib/MongodbService"
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
  databaseName
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
  const isValidPath = dirs.length <= 5
  const headers = getAllowHeaders(event)

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

  const handleMethod = (
    method: APIGatewayEvent["httpMethod"]
  ): Promise<Success<Comment> | Error> => {
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
        return service.commentDELETE(targetId, authUserId)
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
