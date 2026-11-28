import type { NetlifyRequest } from "../lib/backend-utilities"
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
  getCookieWriteError,
  getAllowOriginHeaders,
  getNewUserInfo,
  getTargetId,
  getUpdatedUserInfo,
  getUserId,
  isApiError,
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

const getAllowHeaders = (event: NetlifyRequest) => {
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

export const handler = async (event: NetlifyRequest) => {
  const eventHeaders = toDefinedHeaders(event.headers)
  const headers = getAllowHeaders(event)
  const blocked = getCookieWriteError(event, eventHeaders)
  if (blocked) return addHeaders(blocked, headers)
  const authUserId = getUserId(eventHeaders) ?? undefined
  const targetId = getTargetId(event.path, "user") as UserId

  const handleMethod = (
    method: NetlifyRequest["httpMethod"]
  ): Promise<
    | Success<
        (PublicSafeUser | AdminSafeUser) | (AdminSafeUser[] | PublicSafeUser[])
      >
    | Error
  > => {
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
    if (!isApiError(error)) console.error({ error })
    return addHeaders(toApiError(error, error500InternalServerError), headers)
  }
}
