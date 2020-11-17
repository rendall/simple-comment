import * as dotenv from "dotenv";
import { Context, APIGatewayEvent } from "aws-lambda"
import { getOrigin } from "../lib/utilities";
dotenv.config()

export const handler = async (event: APIGatewayEvent, context: Context) => {

  const rawAllowOrigin = process.env.ALLOW_ORIGIN
  const allowedOrigins = rawAllowOrigin.split(",")
  const allowAll = allowedOrigins.includes("*")
  const requestingOrigin = getOrigin(event.headers)

  const isAllowed = allowAll || allowedOrigins.includes(requestingOrigin)

  const headers = isAllowed ? {
    "Access-Control-Allow-Origin": requestingOrigin,
    Vary: "Origin"
  } : {}





  const message = `Hello world ${Math.floor(Math.random() * 10)}`
  return {
    headers,
    statusCode: 200,
    body: JSON.stringify({ message, event, context })
  };
}// simple hello world to ensure that the endpoint is building and
// deploying properly
