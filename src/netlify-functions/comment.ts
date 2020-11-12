import * as dotenv from "dotenv";
import type { APIGatewayEvent, Callback, Context } from "aws-lambda"
import { CommentId, Success, Error, Comment } from "../lib/simple-comment";
import { MongodbService } from "../lib/MongodbService";
import { error404CommentNotFound, error405MethodNotAllowed } from "./../lib/messages";
import { getTargetId, getUserId } from "./modules/helpers"
dotenv.config()

const service: MongodbService = new MongodbService(process.env.DB_CONNECTION_STRING, process.env.DATABASE_NAME)

export const handler = async (event: APIGatewayEvent, context: Context) => {

  const dirs = event.path.split("/")
  const isValidPath = dirs.length <= 5
  if (!isValidPath) return ({ ...error404CommentNotFound, body: `${event.path} is not valid` })

  const userId = getUserId(event.headers)
  const commentId = getTargetId(event.path, "comment") as CommentId

  const handleMethod = (method): Promise<Success<Comment> | Error> => {

    switch (method) {
      case "GET": return service.commentGET(commentId, userId)
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