import { v4 } from "uuid";
import * as bcrypt from "bcrypt" 
import * as jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'

dotenv.config()

const saltRounds = 10
const DAY = 60 * 24

// Rounds down to the nearest second before adding `minutes`
const getExpirationTime = (minutes:number):number => new Date(Math.floor(new Date().valueOf() / 10000) * 10000 + minutes * 60 * 1000).valueOf()

export const hashPassword = (plainTextPassword: string) => bcrypt
  .genSalt(saltRounds)
  .then(salt => bcrypt.hash(plainTextPassword, salt))

export const comparePassword = (plainTextPassword: string, hash: string) => bcrypt
  .compare(plainTextPassword, hash)

export const getAuthToken = (user:string, exp:number = getExpirationTime(DAY)) => jwt.sign({user, exp}, process.env.JWT_SECRET)

export const uuidv4 = () => v4()
