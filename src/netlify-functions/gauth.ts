/** gauth stands for temporary auth, a separate endpoint for
 * 'temporary auth' to authenticate visitors */
import * as dotenv from "dotenv"
import type { APIGatewayEvent, APIGatewayEventRequestContext } from "aws-lambda"
import { MongodbService } from "../lib/MongodbService"
import { Success, Error, AuthToken } from "../lib/simple-comment"
import {
  error404CommentNotFound,
  error405MethodNotAllowed,
  success200OK,
  success204NoContent
} from "../lib/messages"
import {
  isError,
  getAllowOriginHeaders,
  getAllowedOrigins,
  addHeaders
} from "../lib/utilities"
dotenv.config()

const isProduction = process.env.SIMPLE_COMMENT_MODE === "production"

const service: MongodbService = new MongodbService(
  process.env.DB_CONNECTION_STRING,
  process.env.DATABASE_NAME
)

const getAllowHeaders = (event: APIGatewayEvent) => {
  const allowedMethods = {
    "Access-Control-Allow-Methods": "GET,OPTION",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Expose-Headers": "Set-Cookie"
  }
  const allowedOriginHeaders = getAllowOriginHeaders(
    event.headers,
    getAllowedOrigins()
  )
  const headers = { ...allowedMethods, ...allowedOriginHeaders }
  return headers
}

export const handler = async (
  event: APIGatewayEvent,
  context: APIGatewayEventRequestContext
) => {
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

  const handleMethod = (method): Promise<Success | Error> => {
    switch (method) {
      case "GET":
        return handleGauth(event)
      case "OPTION":
        return handleOption(event)
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

const handleGauth = async (event: APIGatewayEvent) => {
  const allowHeaders = getAllowHeaders(event)

  const gauthResponse = await service.gauthGET()

  if (isError(gauthResponse)) {
    return gauthResponse
  }

  const token = gauthResponse.body as AuthToken

  const expireDate = new Date(
    new Date().valueOf() + 52 * 7 * 24 * 60 * 60 * 1000
  ).toUTCString()

  const COOKIE_HEADER = {
    "Set-Cookie": `simple_comment_token=${token}; path=/; ${
      isProduction ? "Secure; " : ""
    }HttpOnly; SameSite; Max-Age=${52 * 7 * 24 * 60 * 60 * 1000}`
  }

  const headers = { ...allowHeaders, ...COOKIE_HEADER }

  return { ...success200OK, headers }
}

const handleOption = async (event: APIGatewayEvent) => {
  const headers = getAllowHeaders(event)
  return { ...success204NoContent, headers }
}
