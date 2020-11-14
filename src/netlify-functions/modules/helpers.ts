import * as jwt from 'jsonwebtoken'
import { stringify } from 'querystring';
import { NewUser, UpdateUser, UserId } from "./../../lib/simple-comment";

const AUTHORIZATION_HEADER = "Authorization";
const BEARER_SCHEME = "Bearer";
const BASIC_SCHEME = "Basic";

const hasHeader = (headers: { [header: string]: string }, header: string) =>
    Object.keys(headers).some((h) => h.toLowerCase() === header.toLowerCase() && headers[h] !== undefined);

const getHeader = (headers: { [header: string]: string }, header: string) =>
    Object.keys(headers).find((h) => h.toLowerCase() === header.toLowerCase());

const getHeaderValue = (headers: { [header: string]: string }, header: string) =>
    headers[getHeader(headers, header)];

const parseAuthHeaderValue = (authHeaderValue: string, spaceIndex?: number): { scheme: string; credentials: string } =>
    spaceIndex === undefined
        ? parseAuthHeaderValue(authHeaderValue, authHeaderValue.indexOf(" "))
        : { scheme: authHeaderValue.slice(0, spaceIndex), credentials: authHeaderValue.slice(spaceIndex + 1), };

export const REALM = "Access to restricted resources";
/** nowPlusMinutes returns the numericDate `minutes` from now */
export const nowPlusMinutes = (minutes: number): number =>
    new Date(new Date().valueOf() + minutes * 60 * 1000).valueOf();

export const getAuthHeaderValue = (headers: {
    [header: string]: string;
}): string | undefined => getHeaderValue(headers, AUTHORIZATION_HEADER);

export const getAuthCredentials = (authHeaderValue: string) =>
    parseAuthHeaderValue(authHeaderValue).credentials;

export const hasBasicScheme = (headers: { [header: string]: string }, parse?: { scheme: string; credentials: string }) =>
    parse === undefined
        ? hasHeader(headers, AUTHORIZATION_HEADER)
            ? hasBasicScheme(
                headers,
                parseAuthHeaderValue(getHeaderValue(headers, AUTHORIZATION_HEADER))
            )
            : false
        : parse.scheme.toLowerCase() === BASIC_SCHEME.toLowerCase();

export const hasBearerScheme = (headers: { [header: string]: string }, parse?: { scheme: string; credentials: string }) =>
    parse === undefined
        ? hasHeader(headers, AUTHORIZATION_HEADER)
            ? hasBearerScheme(
                headers,
                parseAuthHeaderValue(getHeaderValue(headers, AUTHORIZATION_HEADER))
            )
            : false
        : parse.scheme.toLowerCase() === BEARER_SCHEME.toLowerCase();

export const getUserId = (headers: { [key: string]: string }): UserId | null => {

    const isBearer = hasBearerScheme(headers)

    if (!isBearer) return null

    const authHeaderValue = getAuthHeaderValue(headers)
    const token = getAuthCredentials(authHeaderValue)
    const claim: { user: UserId, exp: number } = jwt.verify(token, process.env.JWT_SECRET) as { user: UserId, exp: number }
    const isExpired = claim.exp <= new Date().valueOf()

    if (isExpired) return null

    return claim.user

}

/** 
 * return the path directory after endpoint or null if none
 * /dir1/endpoint/somestring/anotherstring returns somestring
 * /dir1/endpoint/somestring returns somestring
 * /dir1/endpoint returns null
 * /dir1/somestring/anotherstring returns null
 **/
export const getTargetId = (path: string, endpoint: string, dirs?: string[]): (string | null) => {

    if (dirs === undefined) return getTargetId(path, endpoint, path.split("/"))

    if (dirs.length <= 1) return null // this means dirs[0] is endpoint or endpoint does not exist

    if (dirs[0] === endpoint) return dirs[1]

    return getTargetId(path, endpoint, dirs.splice(1))
}

type GenericObj = { [key: string]: (string | number | boolean) }

const parseBody = (body: string): GenericObj => body.split("&")
    .map(i => i.split("="))
    .map(([key, value]: [string, string]) => [key, decodeURI(value)])
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})

const narrowType = <T>(obj:GenericObj, keys:(keyof T)[]) => Object.entries(obj)
    .reduce((narrowType, [key, value]) => keys.includes(key as keyof T) ? ({ [key]: value }) : narrowType, {}) as T


const newUserKeys: (keyof NewUser)[] = ["id", "isAdmin", "email", "isVerified", "name"]
export const getNewUserInfo = (body: string): NewUser => narrowType<NewUser>(parseBody(body), newUserKeys) 
const updatedUserKeys: (keyof UpdateUser)[] = ["isAdmin", "email", "isVerified", "name"]
export const getUpdatedUserInfo = (body: string): UpdateUser => narrowType<UpdateUser>( parseBody(body), updatedUserKeys ) as UpdateUser

export interface Event {
    path: string;
    httpMethod: string;
    queryStringParameters: { [parameter: string]: string };
    headers: { [header: string]: string };
    body: string;
    isBase64Encoded: boolean;
}
