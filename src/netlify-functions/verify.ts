import { Handler, Context, APIGatewayEvent } from "aws-lambda"
import * as dotenv from "dotenv"
import {
  getAllowedOrigins,
  getAllowOriginHeaders,
  getAuthCredentials,
  getAuthHeaderValue,
  getCookieToken,
  hasBearerScheme,
  hasTokenCookie
} from "../lib/utilities"
import { Success, TokenClaim, Error } from "../lib/simple-comment"
import {
  error401UserNotAuthenticated,
  error404NotFound,
  error405MethodNotAllowed,
  success204NoContent
} from "../lib/messages"
import { MongodbService } from "../lib/MongodbService"

dotenv.config()

const service: MongodbService = new MongodbService(
  process.env.DB_CONNECTION_STRING,
  process.env.DATABASE_NAME
)

const getAllowHeaders = (event: APIGatewayEvent) => {
  const allowedMethods = {
    "Access-Control-Allow-Methods": "GET,OPTION"
  }
  const allowedOriginHeaders = getAllowOriginHeaders(
    event.headers,
    getAllowedOrigins()
  )
  const headers = { ...allowedMethods, ...allowedOriginHeaders }
  return headers
}

export const handler: Handler = async (
  event: APIGatewayEvent,
  context: Context
) => {
  const dirs = event.path.split("/")
  const isValidPath = dirs.length <= 5
  const headers = getAllowHeaders(event)

  const convert = (res: { statusCode: number; body: any }) =>
    res.statusCode === 204
      ? { ...res, headers }
      : {
        ...res,
        body: JSON.stringify(res.body),
        headers
      }

  if (!isValidPath)
    return convert({ ...error404NotFound, body: `${event.path} is not valid` })

  const isBearer = hasBearerScheme(event.headers)
  const hasCookie = hasTokenCookie(event.headers)

  if (!isBearer && !hasCookie) {
    return convert({
      ...error401UserNotAuthenticated,
      body: "No Cookie header 'simple-comment-token' value"
    })
  }

  const handleMethod = (
    method
  ): Promise<Success<TokenClaim> | Success | Error> => {
    // This is going to throw an error. q.v. https://github.com/auth0/node-jsonwebtoken#errors--codes
    const token = hasCookie
      ? getCookieToken(event.headers)
      : getAuthCredentials(getAuthHeaderValue(event.headers))

    switch (method) {
      case "GET":
        return service.verifyGET(token)
      case "OPTION":
        return new Promise<Success>(resolve =>
          resolve({ ...success204NoContent, headers })
        )
      default:
        return new Promise<Error>(resolve => resolve(error405MethodNotAllowed))
    }
  }


  try {
    const response = await handleMethod(event.httpMethod)
    return convert(response)
  } catch (error) {
    return error
  }
}
