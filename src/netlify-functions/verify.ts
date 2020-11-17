import { Handler, Context, Callback, APIGatewayEvent } from "aws-lambda"
import * as jwt from "jsonwebtoken"
import * as dotenv from "dotenv"
import {
  getAuthCredentials,
  getAuthHeaderValue,
  getCookieToken,
  hasBearerScheme,
  hasTokenCookie,
  REALM
} from "../lib/utilities"

dotenv.config()

export const handler: Handler = (
  event: APIGatewayEvent,
  context: Context,
  callback: Callback
) => {
  switch (event.httpMethod.toUpperCase()) {
    case "GET":
      handleGet(event, callback)
      break
    default:
      callback(
        null,
        buildResponse(`Method ${event.httpMethod} not supported`, 405)
      )
      break
  }
}

const handleGet = (event: APIGatewayEvent, callback: Callback) => {
  const isBearer = hasBearerScheme(event.headers)
  const hasCookie = hasTokenCookie(event.headers)

  if (!isBearer && !hasCookie)
    callback(
      null,
      buildResponse(`Unauthenticated`, 401, {
        ...HEADERS
        // ...{ "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"` }
      })
    )
  else {
    const token = hasCookie
      ? getCookieToken(event.headers)
      : getAuthCredentials(getAuthHeaderValue(event.headers))

    try {
      callback(
        null,
        buildResponse(
          JSON.stringify(jwt.verify(token, process.env.JWT_SECRET)),
          200
        )
      )
    } catch (error) {
      console.error(error)
      switch (error.name) {
        case "TokenExpiredError":
          const EXPIRED_AUTHENTICATE_HEADER = {
            "WWW-Authenticate": `Basic realm="${REALM}", error="invalid_token", error_description="The access token expired at ${error.expiredAt}", charset="UTF-8"`
          }
          callback(
            null,
            buildResponse(`token expired at ${error.expiredAt}`, 403, {
              ...HEADERS,
              ...EXPIRED_AUTHENTICATE_HEADER
            })
          )
          break

        default:
          callback(null, buildResponse(error.message, 500))
          break
      }
    }
  }
}

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET"
}

export const buildResponse = (
  body: string,
  statusCode: number = 200,
  headers = HEADERS
) => ({ body, statusCode, headers })
