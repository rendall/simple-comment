import * as dotenv from "dotenv"
import type { APIGatewayEvent, APIGatewayEventRequestContext } from "aws-lambda"
import { MongodbService } from "../lib/MongodbService"
import { Success, Error, AuthToken } from "../lib/simple-comment"
import {
  error401UserNotAuthenticated,
  error404CommentNotFound,
  error405MethodNotAllowed,
  success200OK,
  success204NoContent
} from "../lib/messages"
import {
  getUserIdPassword,
  hasBasicScheme,
  REALM,
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
    "Access-Control-Allow-Methods": "POST,GET,OPTION,DELETE",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Cookie"
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
      case "POST":
      case "GET":
        return handleAuth(event)
      case "OPTION":
        return handleOption(event)
      case "DELETE":
        return service.authDELETE()
      default:
        const headers = getAllowHeaders(event)
        return new Promise<Error>(resolve =>
          resolve({ ...error405MethodNotAllowed, headers })
        )
    }
  }

  try {
    const response = await handleMethod(event.httpMethod)
    return addHeaders(response, headers)
  } catch (error) {
    return addHeaders(error, headers)
  }
}

const handleAuth = async (event: APIGatewayEvent) => {
  const isBasicAuth = hasBasicScheme(event.headers)

  const allowHeaders = getAllowHeaders(event)

  if (!isBasicAuth)
    return {
      // Receiving no basic authorization header, send instructions via WWW-Authenticate header
      // q.v. RFC7235 https://tools.ietf.org/html/rfc7235#section-4.1
      ...error401UserNotAuthenticated,
      headers: {
        ...allowHeaders,
        "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`
      }
    }
  else {
    const { user, password } = getUserIdPassword(event.headers)
    const authUser = await service.authGET(user, password)

    if (isError(authUser)) {
      return authUser
    }

    const token = authUser.body as AuthToken

    const COOKIE_HEADER = {
      "Set-Cookie": `simple_comment_token=${token}; path=/; ${
        isProduction ? "Secure; " : ""
      }HttpOnly; SameSite; Max-Age=${7 * 24 * 60 * 60 * 1000}`
    }

    const headers = { ...allowHeaders, ...COOKIE_HEADER }

    return { ...success200OK, headers }
  }
}

const handleOption = async (event: APIGatewayEvent) => {
  const headers = getAllowHeaders(event)
  return { ...success204NoContent, headers }
}
