import { Context, APIGatewayEvent } from "aws-lambda"
import { success200OK } from "../lib/messages"
import { getAllowedOrigins, getAllowOriginHeaders } from "../lib/utilities"

const getAllowHeaders = (event: APIGatewayEvent) => {
  const allowedMethods = { "Access-Control-Allow-Methods": "POST,GET,OPTION" }
  const allowedOriginHeaders = getAllowOriginHeaders(
    event.headers,
    getAllowedOrigins()
  )
  const headers = { ...allowedMethods, ...allowedOriginHeaders }
  return headers
}

export const handler = async (event: APIGatewayEvent, context: Context) => {
  const headers = getAllowHeaders(event)
  const message = `Hello world ${Math.floor(Math.random() * 10)}`
  try {
    return ({ ...success200OK, body: JSON.stringify({ message, event, context }), headers })
  } catch (error) {
    return error
  }
} // simple hello world to ensure that the endpoint is building and
// deploying properly
