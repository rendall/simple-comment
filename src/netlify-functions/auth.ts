import type { APIGatewayEvent, APIGatewayEventRequestContext } from "aws-lambda"
export const handler = async (event: APIGatewayEvent, context: APIGatewayEventRequestContext) => ({
  statusCode: 200,
  body: JSON.stringify({ message: "Hello World" })

})