import { Context, APIGatewayEvent } from "aws-lambda"

export const handler = async (event: APIGatewayEvent, context: Context) => {
  const message = `Hello world ${Math.floor(Math.random() * 10)}`
  return {
    statusCode: 200,
    body: JSON.stringify({ message, event, context })
  };
}// simple hello world to ensure that the endpoint is building and
// deploying properly
