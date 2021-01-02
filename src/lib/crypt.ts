import { v4, validate as isValidUuid } from "uuid"
import { hash, compare } from "bcryptjs"
import * as jwt from "jsonwebtoken"
import * as dotenv from "dotenv"

dotenv.config()

const DAY_SECONDS = 60 * 60 * 24 // 60s * 1 hour * 24 hours

/** Return a date in *seconds from epoch*
 * some number of (input) seconds in the future
 * This is the format JWT wants */
const getExpirationTime = (secondsFromNow: number): number =>
  new Date(
    // Expiration date is set at 10s intervals by dividing, then multiplying, by 10,000ms
    // Also, "now" is in milliseconds and output must be seconds, so we are also dividing by 1000
    // While we could just divide by 10,000 and multiply by 10, let's make
    // each step explicit, so we can reason about what's happening:
    (Math.floor(new Date().valueOf() / 10000) * 10000) / 1000 + secondsFromNow
  ).valueOf()

/** Get a password hash from the plaintext password */
export const hashPassword = async (password: string) =>
  //TODO: sha-512 pre-hash per https://dropbox.tech/security/how-dropbox-securely-stores-your-passwords
  await hash(password, 13)

export const comparePassword = async (
  plainTextPassword: string,
  hash: string
) => await compare(plainTextPassword, hash)

export const getAuthToken = (
  user: string,
  exp: number = getExpirationTime(DAY_SECONDS)
) => jwt.sign({ user, exp }, process.env.JWT_SECRET)

export const uuidv4 = () => v4()

export const isUuid = isValidUuid
