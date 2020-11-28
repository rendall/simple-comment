import { v4, validate as isValidUuid } from "uuid"
import * as crypto from "crypto"
import * as jwt from "jsonwebtoken"
import * as dotenv from "dotenv"

dotenv.config()

const DAY = 60 * 24

/** Returns a date value some minutes from "now" */
const getExpirationTime = (minutes: number): number =>
  new Date(
    Math.floor(new Date().valueOf() / 10000) * 10000 + minutes * 60 * 1000
  ).valueOf()

/** Get a password hash from the plaintext password */
export const hashPassword = (password: string) =>
  crypto
    //TODO: change this to bcrypt - but bcrypt causes an error for now
    .createHmac("sha256", process.env.HASH_SECRET)
    .update(`${password}${process.env.SALT_SECRET}`)
    .digest("hex")

export const comparePassword = (plainTextPassword: string, hash: string) =>
  hashPassword(plainTextPassword) === hash

export const getAuthToken = (
  user: string,
  exp: number = getExpirationTime(DAY)
) => jwt.sign({ user, exp }, process.env.JWT_SECRET)

export const uuidv4 = () => v4()

export const isUuid = isValidUuid
