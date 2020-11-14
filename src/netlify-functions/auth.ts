import * as dotenv from "dotenv";
import type { APIGatewayEvent, APIGatewayEventRequestContext } from "aws-lambda"
import { MongodbService } from "../lib/MongodbService"
import { Success, Error, AuthToken } from "../lib/simple-comment"
import { error401UserNotAuthenticated, error404CommentNotFound, error405MethodNotAllowed, success200OK } from "../lib/messages"
import { getUserIdPassword, hasBasicScheme, REALM, isError } from "../lib/utilities"
dotenv.config()

const isProduction = process.env.SIMPLE_COMMENT_MODE === "production"
const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,GET",
}

const service: MongodbService = new MongodbService(process.env.DB_CONNECTION_STRING, process.env.DATABASE_NAME)
export const handler = async (event: APIGatewayEvent, context: APIGatewayEventRequestContext) => {

  const dirs = event.path.split("/")
  const isValidPath = dirs.length <= 5

  if (!isValidPath) return ({ ...error404CommentNotFound, body: `${event.path} is not valid` })

  const handleMethod = (method): Promise<Success | Error> => {

    switch (method) {
      case "POST":
      case "GET": return handleAuth(event)
      default: return new Promise<Error>((resolve) => resolve({ ...error405MethodNotAllowed, headers: HEADERS }))
    }
  }

  const convert = (res: (Success | Error)) => ({ ...res, body: JSON.stringify(res.body) })

  try {
    const response = await handleMethod(event.httpMethod)
    return convert(response)
  } catch (error) {
    return error
  }
}

const handleAuth = async (event: APIGatewayEvent) => {
  const isBasicAuth = hasBasicScheme(event.headers)

  if (!isBasicAuth) return {
    // Receiving no basic authorization header, send instructions via WWW-Authenticate header 
    // q.v. RFC7235 https://tools.ietf.org/html/rfc7235#section-4.1
    ...error401UserNotAuthenticated,
    headers: {
      ...HEADERS,
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`
    }
  }
  else {
    const { user, password } = getUserIdPassword(event.headers)
    const authUser = await service.authGET(user, password)

    if (isError(authUser)) {
      return authUser
    }

    const token = authUser.body as AuthToken

    const COOKIE_HEADER = isProduction ? { "Set-Cookie": `token=${token}; path=/; Secure; HttpOnly; SameSite` } : { "Set-Cookie": `token=${token}; path=/; HttpOnly; SameSite` }
    const headers = { ...HEADERS, ...COOKIE_HEADER }

    return { ...success200OK, headers }
  }
}