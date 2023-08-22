import * as dotenv from "dotenv"
import type { APIGatewayEvent } from "aws-lambda"
import {
  error400BadRequest,
  error405MethodNotAllowed,
  error500InternalServerError,
  success200OK,
} from "../lib/messages"
import { MongodbService } from "../lib/MongodbService"
import type {
  AdminSafeUser,
  PublicSafeUser,
  Success,
  UserId,
  Error,
} from "../lib/simple-comment-types"
import {
  addHeaders,
  getAllowedOrigins,
  getAllowOriginHeaders,
  getNewUserInfo,
  getTargetId,
  getUpdatedUserInfo,
  getUserId,
  isDefined,
  toDefinedHeaders,
} from "../lib/backend-utilities"
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
  const allowedMethods = {
    "Access-Control-Allow-Methods": "POST,GET,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Cookie",
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
  const eventHeaders = toDefinedHeaders(event.headers)
  const headers = getAllowHeaders(event)
  const authUserId = getUserId(eventHeaders) ?? undefined
  const targetId = getTargetId(event.path, "user") as UserId

  const handleMethod = (
    method
  ): Promise<
    | Success<
        (PublicSafeUser | AdminSafeUser) | (AdminSafeUser[] | PublicSafeUser[])
      >
    | Error
  > => {
    // TODO: create an identicon for users based on their username. consider https://github.com/dmester/jdenticon
    switch (method) {
      case "GET": {
        if (targetId) return service.userGET(targetId, authUserId)
        else return service.userListGET(authUserId)
      }
      case "POST":
        if (isDefined(event.body))
          return service.userPOST(getNewUserInfo(event.body), authUserId)
        else return new Promise<Error>(resolve => resolve(error400BadRequest))
      case "PUT":
        if (isDefined(event.body))
          return service.userPUT(
            targetId,
            getUpdatedUserInfo(event.body),
            authUserId
          )
        else return new Promise<Error>(resolve => resolve(error400BadRequest))
      case "DELETE":
        return service.userDELETE(targetId, authUserId)
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
    console.error({ error })
    return addHeaders(error500InternalServerError, headers)
  }
}
