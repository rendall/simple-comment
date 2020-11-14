import * as dotenv from "dotenv";
import type { APIGatewayEvent, Callback, Context } from "aws-lambda"
import { TopicId, Success, Error, Topic } from "../lib/simple-comment";
import { MongodbService } from "../lib/MongodbService";
import { error404TopicNotFound, error405MethodNotAllowed } from "./../lib/messages";
import { getNewTopicInfo, getTargetId, getUpdateTopicInfo, getUserId } from "./modules/helpers"
dotenv.config()

const service: MongodbService = new MongodbService(process.env.DB_CONNECTION_STRING, process.env.DATABASE_NAME)

export const handler = async (event: APIGatewayEvent, context: Context) => {

  const dirs = event.path.split("/")
  const isValidPath = dirs.length <= 5

  if (!isValidPath) return ({ ...error404TopicNotFound, body: `${event.path} is not valid` })

  const authUserId = getUserId(event.headers)
  const targetId = getTargetId(event.path, "topic") as TopicId

  const handleMethod = (method): Promise<Success<Topic> | Error> => {

    switch (method) {
      case "GET": return service.topicGET(targetId, authUserId)
      case "POST": return service.topicPOST(getNewTopicInfo(event.body), authUserId)
      case "PUT": return service.topicPUT(targetId, getUpdateTopicInfo(event.body), authUserId)
      case "DELETE": return service.topicDELETE(targetId, authUserId)
      default: return new Promise<Error>((resolve) => resolve(error405MethodNotAllowed))
    }
  }

  const convert = (res: { statusCode: number, body: any }) => ({ ...res, body: JSON.stringify(res.body) })

  try {
    const response = await handleMethod(event.httpMethod)
    return convert(response)
  } catch (error) {
    return error
  }
}
