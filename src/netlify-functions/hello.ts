import * as dotenv from "dotenv"
import type { APIGatewayEvent, APIGatewayEventRequestContext } from "aws-lambda"
import { error404CommentNotFound, success200OK } from "../lib/messages"
import { MongodbService } from "../lib/MongodbService"
import { UserId } from "../lib/simple-comment"
import { getNewUserInfo, getTargetId, getUserId } from "../lib/utilities"
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

  const userInfo = getNewUserInfo(event.body)

  const convert = (res: { statusCode: number; body: any }) => ({
    ...res,
    body: JSON.stringify(res.body)
  })

  try {
    return convert({ ...success200OK, body: userInfo })
  } catch (error) {
    return error
  }
}
