import { v4, validate as isValidUuid } from "uuid"
import { hash, compare } from "bcryptjs"
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
export const hashPassword = async (password: string) =>
  //TODO: sha-512 pre-hash per https://dropbox.tech/security/how-dropbox-securely-stores-your-passwords
  await hash(password, 13)

export const comparePassword = async (
  plainTextPassword: string,
  hash: string
) => await compare(plainTextPassword, hash)

export const getAuthToken = (
  user: string,
  exp: number = getExpirationTime(DAY)
) => jwt.sign({ user, exp }, process.env.JWT_SECRET)

export const uuidv4 = () => v4()

export const isUuid = isValidUuid
