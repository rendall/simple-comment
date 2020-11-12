import { Handler, Context, Callback } from "aws-lambda"
import * as jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'
import { getAuthCredentials, getAuthHeaderValue, hasBearerScheme, Event, REALM } from "./modules/helpers";

dotenv.config() 

export const handler: Handler = ( event: Event, context: Context, callback: Callback) => {
  switch (event.httpMethod.toUpperCase()) {
    case "GET": handleGet(event, callback); break; 
    default: callback(null, buildResponse( `Method ${event.httpMethod} not supported`, 405)); break
  }
}

const handleGet = (event:Event, callback:Callback) => {
  const isBearer = hasBearerScheme(event.headers)

  if (!isBearer) callback(null, buildResponse( `Unauthenticated`, 401, {...HEADERS, ...{ "WWW-Authenticate":`Basic realm="${REALM}", charset="UTF-8"` }} ))
  else {
    const authHeaderValue = getAuthHeaderValue(event.headers) 
    const token = getAuthCredentials(authHeaderValue)

    try {
      callback( null, buildResponse( JSON.stringify(jwt.verify(token, process.env.JWT_SECRET)), 200)
      );
    } catch (error) {
      console.error(error)
      switch (error.name) {
        case "TokenExpiredError":
          const EXPIRED_AUTHENTICATE_HEADER = { "WWW-Authenticate":`Basic realm="${REALM}", error="invalid_token", error_description="The access token expired at ${error.expiredAt}", charset="UTF-8"` }
          callback(null, buildResponse(`token expired at ${error.expiredAt}`, 403, {...HEADERS, ...EXPIRED_AUTHENTICATE_HEADER} ))
          break;
      
        default:
          callback(null, buildResponse(error.message, 500))
          break;
      }
    }
  }
}

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
}

export const buildResponse = ( body: string, statusCode: number = 200, headers = HEADERS) => ({ body, statusCode, headers })