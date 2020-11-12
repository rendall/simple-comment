import { Handler, Context, Callback } from "aws-lambda"
import * as jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'
import * as crypto from 'crypto'
import { hasBasicScheme, getAuthHeaderValue, Event, nowPlusMinutes, REALM } from "./modules/helpers"; 

const VALID_DURATION_MINUTES = 60 * 24
/** determines how many minutes the authorization is valid. 60 * 24 represents 24 hours */

dotenv.config() 
// dotenv.config() extracts secret constants from the .env file
// and exposes them via the global `process.env` object
const isProduction = process.env.mode === "production"

/** receives server request and returns response via `callback`*/
export const handler: Handler = ( event: Event, context: Context, callback: Callback) => {
  switch (event.httpMethod.toUpperCase()) {
    // Handlers for other methods go here.
    case "GET": handleGet(event, callback); break; 
    default: callback(null, buildResponse( `Method ${event.httpMethod} not supported`, 405)); break
  }
}

/** decodeAuthHeader expects a string of the form `Basic someBase64String==` and returns its plaintext decode */
export const decodeAuthHeader = (authHeaderValue) => Buffer.from(authHeaderValue.slice(6), 'base64').toString()

/** parseAuthHeader expects a string of the form `user:password` and returns an object of the form {user, password} Will fail if the : character is in the user name */
export const parseAuthHeader = (plainText:string, colonIndex?:number):{user:string, password:string} => colonIndex === undefined? parseAuthHeader(plainText, plainText.indexOf(':')) : ({user:plainText.slice(0,colonIndex),password:plainText.slice(colonIndex+1)}) 

/** extractUser expects a string of the form `Basic someBase64String==` and returns the user name */
export const extractUser = (authHeaderValue) => [decodeAuthHeader, parseAuthHeader].reduce((acc,func) =>func(acc), authHeaderValue)['user']

/** authenticateUser expects an object {user, password} and returns true if the user exists and the password matches the user. */
const authenticateUser = ({ user, password }): boolean => user === process.env.SIMPLE_COMMENT_MODERATOR_ID && password === process.env.SIMPLE_COMMENT_MODERATOR_PASSWORD; 

/** isUserAuthentic expects authHeaderValue and returns true if the user exists and the password matches the user */
export const isUserAuthentic = (authHeaderValue) => [decodeAuthHeader, parseAuthHeader, authenticateUser].reduce((acc,func) => func(acc), authHeaderValue)

/**
 * Return 200 and Bearer token if the basic auth is correct and valid
 * 401 without basic credentials
 * 403 with invalid credentials
 * @param event 
 * @param callback 
 */
const handleGet = (event:Event, callback:Callback) => {

  const isBasicAuth = hasBasicScheme(event.headers) 

  // Receiving no basic authorization header, send instructions via WWW-Authenticate header
  // q.v. RFC7235 https://tools.ietf.org/html/rfc7235#section-4.1
  if (!isBasicAuth) callback(null, buildResponse( `Unauthenticated`, 401, {...HEADERS, ...AUTHENTICATE_HEADER}))
  else {
    const authHeaderValue =  getAuthHeaderValue(event.headers)
    const isAuthentic = isUserAuthentic(authHeaderValue)

    if (isAuthentic) {
      const user = extractUser(authHeaderValue)
      const exp = nowPlusMinutes(VALID_DURATION_MINUTES)
      const token = jwt.sign({user, exp}, process.env.JWT_SECRET)

      // There are two approaches to transferring the token to 
      // the front-end client.
      // 1) Cookie
      // 2) Body content

      // https://gist.github.com/soulmachine/b368ce7292ddd7f91c15accccc02b8df
      // To secure tokens for browsers "... use HttpOnly and Secure 
      // cookies. The HttpOnly flag protects the cookies from being 
      // accessed by JavaScript and prevents XSS attack. The Secure 
      // flag will only allow cookies to be sent to servers over HTTPS
      // connection." However, this obviates using Bearer authentication

      // const COOKIE_HEADER = 
      const COOKIE_HEADER = isProduction? { "Set-Cookie": `token=${token}; path=/; Secure; HttpOnly; SameSite`} : { "Set-Cookie": `token=${token}; path=/; HttpOnly; SameSite`}
      callback(null, buildResponse("OK", 200, {...HEADERS, ...COOKIE_HEADER}))
    }
    else callback(null, buildResponse( `Invalid username / password combination`, 403, {...HEADERS}))
  }
}

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
}

const AUTHENTICATE_HEADER = { "WWW-Authenticate":`Basic realm="${REALM}", charset="UTF-8"` }

const hash = (password:string) => crypto.createHmac('sha256', process.env.HASH_KEY).update(password).digest('hex')

export const buildResponse = ( body: string, statusCode: number = 200, headers = HEADERS) => ({ statusCode, headers, body })