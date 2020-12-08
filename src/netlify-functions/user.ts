import * as dotenv from "dotenv"
import type { APIGatewayEvent, APIGatewayEventRequestContext } from "aws-lambda"
import {
  error404CommentNotFound,
  error405MethodNotAllowed,
  success204NoContent
} from "../lib/messages"
import { MongodbService } from "../lib/MongodbService"
import {
  AdminSafeUser,
  PublicSafeUser,
  Success,
  UserId,
  Error
} from "../lib/simple-comment"
import {
  getAllowedOrigins,
  getAllowOriginHeaders,
  getNewUserInfo,
  getTargetId,
  getUpdatedUserInfo,
  getUserId
} from "../lib/utilities"
dotenv.config()

const service: MongodbService = new MongodbService(
  process.env.DB_CONNECTION_STRING,
  process.env.DATABASE_NAME
)

const getAllowHeaders = (event: APIGatewayEvent) => {
  const allowedMethods = {
    "Access-Control-Allow-Methods": "POST,GET,PUT,DELETE,OPTION"
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
  const convert = (res: { statusCode: number; body: any }) =>
    res.statusCode === 204
      ? { ...res, headers }
      : {
        ...res,
        body: JSON.stringify(res.body),
        headers
      }


  if (!isValidPath)
    return convert({
      ...error404CommentNotFound,
      body: `${event.path} is not valid`
    })

  const authUserId = getUserId(event.headers)
  const targetId = getTargetId(event.path, "user") as UserId

  const handleMethod = (
    method
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
        return service.userPOST(getNewUserInfo(event.body), authUserId)
      case "PUT":
        return service.userPUT(
          targetId,
          getUpdatedUserInfo(event.body),
          authUserId
        )
      case "DELETE":
        return service.userDELETE(targetId, authUserId)
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
