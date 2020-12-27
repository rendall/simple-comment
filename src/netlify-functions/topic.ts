import * as dotenv from "dotenv"
import type { APIGatewayEvent, Callback, Context } from "aws-lambda"
import {
  TopicId,
  Success,
  Error,
  Topic,
  Discussion
} from "../lib/simple-comment"
import { MongodbService } from "../lib/MongodbService"
import {
  error404TopicNotFound,
  error405MethodNotAllowed,
  success204NoContent
} from "./../lib/messages"
import {
  getAllowedOrigins,
  getAllowOriginHeaders,
  getHeaderValue,
  getNewTopicInfo,
  getTargetId,
  getUpdateTopicInfo,
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

export const handler = async (event: APIGatewayEvent, context: Context) => {
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
      ...error404TopicNotFound,
      body: `${event.path} is not valid`
    })

  const authUserId = getUserId(event.headers)
  const targetId = getTargetId(event.path, "topic") as TopicId

  const handleMethod = (
    method
  ): Promise<Success<Discussion> | Success<Topic[]> | Error> => {
    switch (method) {
      case "GET":
        if (targetId) return service.topicGET(targetId, authUserId)
        else return service.topicListGET(authUserId)
      case "POST":
        if (targetId)
          return new Promise<Error>(resolve =>
            resolve({
              ...error404TopicNotFound,
              body: `${event.path} is not valid`
            })
          )
        const referer = getHeaderValue(event.headers, "Referer")
        const newTopic = { ...getNewTopicInfo(event.body), referer }
        return service.topicPOST(newTopic, authUserId)
      case "PUT":
        return service.topicPUT(
          targetId,
          getUpdateTopicInfo(event.body),
          authUserId
        )
      case "DELETE":
        return service.topicDELETE(targetId, authUserId)
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
