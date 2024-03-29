import type { APIGatewayEvent } from "aws-lambda"
import * as dotenv from "dotenv"
import {
  addHeaders,
  getAllowedOrigins,
  getAllowOriginHeaders,
  getHeaderValue,
  getNewTopicInfo,
  getTargetId,
  getUpdateTopicInfo,
  getUserId,
  isDefined,
  toDefinedHeaders,
} from "../lib/backend-utilities"
import type {
  Discussion,
  Error,
  Success,
  Topic,
  TopicId,
} from "../lib/simple-comment-types"
import {
  error400BadRequest,
  error404TopicNotFound,
  error405MethodNotAllowed,
  success200OK,
} from "./../lib/messages"
import { MongodbService } from "../lib/MongodbService"

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
  const allowHeaders = {
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Cookie,Referrer-Policy",
  }
  const eventHeaders = toDefinedHeaders(event.headers)
  const allowedOriginHeaders = getAllowOriginHeaders(
    eventHeaders,
    getAllowedOrigins()
  )
  const headers = { ...allowHeaders, ...allowedOriginHeaders }
  return headers
}

export const handler = async (event: APIGatewayEvent) => {
  const dirs = event.path.split("/")
  const isValidPath = dirs.length <= 5
  const headers = getAllowHeaders(event)

  if (!isValidPath)
    return addHeaders(
      { ...error404TopicNotFound, body: `${event.path} is not valid` },
      headers
    )

  const eventHeaders = toDefinedHeaders(event.headers)
  const authUserId = getUserId(eventHeaders) ?? undefined
  const targetId = getTargetId(event.path, "topic") as TopicId

  const handleMethod = (
    method
  ): Promise<Success<Discussion> | Success<Topic[]> | Error> => {
    switch (method) {
      case "GET":
        if (targetId) return service.topicGET(targetId, authUserId)
        else return service.topicListGET(authUserId)
      case "POST": {
        if (targetId)
          return new Promise<Error>(resolve =>
            resolve({
              ...error404TopicNotFound,
              body: `${event.path} is not valid`,
            })
          )
        if (isDefined(event.body)) {
          const referer = getHeaderValue(eventHeaders, "Referer")
          const newTopic = { ...getNewTopicInfo(event.body), referer }
          return service.topicPOST(newTopic, authUserId)
        } else return new Promise<Error>(resolve => resolve(error400BadRequest))
      }
      case "PUT":
        if (isDefined(event.body))
          return service.topicPUT(
            targetId,
            getUpdateTopicInfo(event.body),
            authUserId
          )
        else return new Promise<Error>(resolve => resolve(error400BadRequest))
      case "DELETE":
        return service.topicDELETE(targetId, authUserId)
      case "OPTIONS":
        return new Promise<Success>(resolve => resolve(success200OK))
      default:
        return new Promise<Error>(resolve => resolve(error405MethodNotAllowed))
    }
  }

  try {
    const ret = await handleMethod(event.httpMethod)
    const response = addHeaders(ret, headers)
    return response
  } catch (error) {
    const retError = addHeaders(error, headers)
    return retError
  }
}
