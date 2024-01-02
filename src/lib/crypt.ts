import { hash, compare } from "bcryptjs"
import * as jwt from "jsonwebtoken"
import * as dotenv from "dotenv"

dotenv.config()

const YEAR_SECONDS = 60 * 60 * 24 * 365 // 60s * 1 hour * 24 hours * 365 days

/** Return a date in *seconds from epoch*
 * some number of (input) seconds in the future
 * This is the format JWT wants */
export const getExpirationTime = (secondsFromNow: number): number =>
  new Date(
    // Expiration date is set at 10s intervals by dividing, then multiplying, by 10,000ms
    // Also, "now" is in milliseconds and output must be seconds, so we are also dividing by 1000
    // While we could just divide by 10,000 and multiply by 10, let's make
    // each step explicit, so we can reason about what's happening:
    Math.floor((new Date().valueOf() + secondsFromNow * 1000) / 10000) * 10000
  ).valueOf() / 1000

/** Get a password hash from the plaintext password */
export const hashPassword = async (password: string) =>
  //TODO: sha-512 pre-hash per https://dropbox.tech/security/how-dropbox-securely-stores-your-passwords
  await hash(password, 13)

export const comparePassword = async (
  plainTextPassword: string,
  hash: string
) => await compare(plainTextPassword, hash).catch(() => false)

export const getAuthToken = (
  user: string,
  exp: number = getExpirationTime(YEAR_SECONDS)
): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined")
  }
  return jwt.sign({ user, exp }, process.env.JWT_SECRET)
}