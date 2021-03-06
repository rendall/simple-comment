import * as dotenv from "dotenv"
import type { APIGatewayEvent, Callback, Context } from "aws-lambda"
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
import { EmailService } from "../lib/EmailService"
import { GmailService } from "../lib/GmailService"
import { Service } from "../lib/Service"
dotenv.config()

const dbService: Service = new MongodbService(
  process.env.DB_CONNECTION_STRING,
  process.env.DATABASE_NAME
)

const notifyService: EmailService = new GmailService()

const getAllowHeaders = (event: Pick<APIGatewayEvent, "headers">) => {
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

export const handler = async (
  event: Pick<APIGatewayEvent, "path" | "headers" | "body" | "httpMethod">,
  context: Context,
  testService?: Service,
  testNotifyService?: EmailService
) => {
  const dirs = event.path.split("/")
  const isValidPath = dirs.length <= 5
  const headers = getAllowHeaders(event)

  // the arguments of the handler function are in unknown territory,
  // so make sure that testService and testNotifyService are what is
  // expected

  const isDBService = (x: any): x is Service =>
    x.hasOwnProperty("commentDELETE")
  const isNotifyService = (x: any): x is EmailService =>
    x.hasOwnProperty("sendEmail")

  const service = isDBService(testService) ? testService : dbService
  const notify = isNotifyService(testNotifyService)
    ? testNotifyService
    : notifyService

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

    const isSuccessfulPost =
      event.httpMethod === "POST" && response.statusCode === 201

    if (isSuccessfulPost) {
      const comment = response.body as Comment
      try {
        notify.sendEmail(
          process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL,
          `${comment.userId} commented on ${comment.id}`,
          comment.text
        )
      } catch (error) {
        console.error(error)
      }
    }

    return addHeaders(response, headers)
  } catch (error) {
    return addHeaders(error, headers)
  }
}
