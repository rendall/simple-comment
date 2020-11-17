import { Context, APIGatewayEvent, APIGatewayEventRequestContext } from "aws-lambda"
import { error404CommentNotFound, success200OK } from "../lib/messages"
import { MongodbService } from "../lib/MongodbService"
import { UserId } from "../lib/simple-comment"
import { getAllowedOrigins, getAllowOriginHeaders, getNewUserInfo, getTargetId, getUserId } from "../lib/utilities"

const getAllowHeaders = (event: APIGatewayEvent) => {
  const allowedMethods = { "Access-Control-Allow-Methods": "POST,GET,OPTION" }
  const allowedOriginHeaders = getAllowOriginHeaders(
    event.headers,
    getAllowedOrigins()
  )
  const headers = { ...allowedMethods, ...allowedOriginHeaders }
  return headers
}
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
    return {
      ...error404CommentNotFound,
      body: `${event.path} is not valid`
    }

  const headers = getAllowHeaders(event)
  const message = `Hello world ${Math.floor(Math.random() * 10)}`
  try {
    return ({ ...success200OK, body: JSON.stringify({ message, event, context }), headers })
  } catch (error) {
    return error
  }
} // simple hello world to ensure that the endpoint is building and
// deploying properly
