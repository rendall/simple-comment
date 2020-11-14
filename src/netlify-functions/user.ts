import * as dotenv from "dotenv"
import type { APIGatewayEvent, APIGatewayEventRequestContext } from "aws-lambda"
import {
  error404CommentNotFound,
  error405MethodNotAllowed
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
export const handler = async (
  event: APIGatewayEvent,
  context: APIGatewayEventRequestContext
) => {
  const dirs = event.path.split("/")
  const isValidPath = dirs.length <= 5

  if (!isValidPath)
    return { ...error404CommentNotFound, body: `${event.path} is not valid` }

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
      default:
        return new Promise<Error>(resolve => resolve(error405MethodNotAllowed))
    }
  }

  const convert = (res: { statusCode: number; body: any }) => ({
    ...res,
    body: JSON.stringify(res.body)
  })

  try {
    const response = await handleMethod(event.httpMethod)
    return convert(response)
  } catch (error) {
    return error
  }
}
