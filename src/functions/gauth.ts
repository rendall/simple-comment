/** gauth stands for temporary auth, a separate endpoint for
 * 'temporary auth' to authenticate visitors */
import * as dotenv from "dotenv"
import type { APIGatewayEvent } from "aws-lambda"
import { MongodbService } from "../lib/MongodbService"
import { Success, Error, AuthToken } from "../lib/simple-comment"
import {
  error404CommentNotFound,
  error405MethodNotAllowed,
  success200OK
} from "../lib/messages"
import {
  getAllowOriginHeaders,
  getAllowedOrigins,
  addHeaders
} from "../lib/utilities"
dotenv.config()

const YEAR_SECONDS = 60 * 60 * 24 * 365 // 60s * 1 hour * 24 hours * 365 days

const isCrossSite = process.env.IS_CROSS_SITE === "true"

const service: MongodbService = new MongodbService(
  process.env.DB_CONNECTION_STRING,
  process.env.DATABASE_NAME
)

const getAllowHeaders = (event: APIGatewayEvent) => {
  const allowedMethods = {
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Access-Control-Allow-Headers"
  }
  const allowedOriginHeaders = getAllowOriginHeaders(
    event.headers,
    getAllowedOrigins()
  )
  const headers = { ...allowedMethods, ...allowedOriginHeaders }
  return headers
}

export const handler = async (
  event: APIGatewayEvent
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
      case "OPTIONS":
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

  if (gauthResponse instanceof Error) return gauthResponse

  const token = gauthResponse.body as AuthToken

  const COOKIE_HEADER = {
    "Set-Cookie": `simple_comment_token=${token}; path=/; SameSite=${
      isCrossSite ? "None; Secure; " : "Strict; "
    }HttpOnly; Max-Age=${YEAR_SECONDS}`
  }

  const headers = { ...allowHeaders, ...COOKIE_HEADER }

  const allowToken = event.queryStringParameters.token

  return allowToken
    ? { ...success200OK, headers, body: token }
    : { ...success200OK, headers }
}

const handleOption = async (event: APIGatewayEvent) => {
  const headers = getAllowHeaders(event)
  return { ...success200OK, headers }
}
