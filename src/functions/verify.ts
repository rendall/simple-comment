import type { Handler, APIGatewayEvent } from "aws-lambda"
import * as dotenv from "dotenv"
import {
  addHeaders,
  getAllowedOrigins,
  getAllowOriginHeaders,
  getAuthCredentials,
  getAuthHeaderValue,
  getCookieToken,
  hasBearerScheme,
  hasTokenCookie,
  stripUndefinedHeaders,
} from "../lib/backend-utilities"
import type { Success, TokenClaim, Error } from "../lib/simple-comment-types"
import {
  error401UserNotAuthenticated,
  error404NotFound,
  error405MethodNotAllowed,
  success200OK,
} from "../lib/messages"
import { MongodbService } from "../lib/MongodbService"

dotenv.config()

if (process.env.DB_CONNECTION_STRING === undefined)
  throw "DB_CONNECTION_STRING is not set in environment variables"
if (process.env.DATABASE_NAME === undefined)
  throw "DATABASE_NAME is not set in environment variables"

const service: MongodbService = new MongodbService(
  process.env.DB_CONNECTION_STRING,
  process.env.DATABASE_NAME
)

const getAllowHeaders = (event: APIGatewayEvent) => {
  const allowedHeaders = {
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  }
  const eventHeaders = stripUndefinedHeaders(event.headers)
  const allowedOriginHeaders = getAllowOriginHeaders(
    eventHeaders,
    getAllowedOrigins()
  )
  const headers = { ...allowedHeaders, ...allowedOriginHeaders }
  return headers
}

export const handler: Handler = async (event: APIGatewayEvent) => {
  const dirs = event.path.split("/")
  const isValidPath = dirs.length <= 5
  const headers = getAllowHeaders(event)

  if (!isValidPath)
    return addHeaders(
      { ...error404NotFound, body: `${event.path} is not valid` },
      headers
    )

  const eventHeaders = stripUndefinedHeaders(event.headers)

  const isBearer = hasBearerScheme(eventHeaders)
  const hasCookie = hasTokenCookie(eventHeaders)

  if (!isBearer && !hasCookie) {
    return addHeaders(
      {
        ...error401UserNotAuthenticated,
        body: "No Cookie header 'simple-comment-token' value",
      },
      headers
    )
  }

  const handleMethod = (
    method
  ): Promise<Success<TokenClaim> | Success | Error> => {
    // This is going to throw an error. q.v. https://github.com/auth0/node-jsonwebtoken#errors--codes
    const token = hasCookie
      ? getCookieToken(eventHeaders)
      : getAuthCredentials(getAuthHeaderValue(eventHeaders))

    switch (method) {
      case "GET":
        return service.verifyGET(token)
      case "OPTIONS":
        return new Promise<Success>(resolve => resolve({ ...success200OK }))
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
