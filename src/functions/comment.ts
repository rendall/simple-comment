import * as dotenv from "dotenv"
import type { APIGatewayEvent } from "aws-lambda"
import { CommentId, Success, Error, Comment } from "../lib/simple-comment"
import { MongodbService } from "../lib/MongodbService"
import {
  error404CommentNotFound,
  error405MethodNotAllowed,
  success200OK
} from "./../lib/messages"
import {
  addHeaders,
  getAllowedOrigins,
  getAllowOriginHeaders,
  getTargetId,
  getUserId
} from "../lib/utilities"
dotenv.config()

const service: MongodbService = new MongodbService(
  process.env.DB_CONNECTION_STRING,
  process.env.DATABASE_NAME
)

const getAllowHeaders = (event: APIGatewayEvent) => {
  const allowedMethods = {
    "Access-Control-Allow-Methods": "POST,GET,OPTIONS,PUT,DELETE",
    "Access-Control-Allow-Credentials": "true"
  }
  const allowedOriginHeaders = getAllowOriginHeaders(
    event.headers,
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
        body: `${event.path} is not valid`
      },
      headers
    )

  const authUserId = getUserId(event.headers)
  const targetId = getTargetId(event.path, "comment") as CommentId

  const handleMethod = (method): Promise<Success<Comment> | Error> => {
    switch (method) {
      case "GET":
        return service.commentGET(targetId, authUserId)
      case "POST":
        return service.commentPOST(targetId, event.body, authUserId)
      case "PUT":
        return service.commentPUT(targetId, event.body, authUserId)
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
    return addHeaders(error, headers)
  }
}
