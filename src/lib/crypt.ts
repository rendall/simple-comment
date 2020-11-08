import * as bcrypt from "bcrypt" 
import * as jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'

dotenv.config()

const saltRounds = 10
const DAY = 60 * 24

// Rounds down to the nearest second before adding `minutes`
const getExpirationTime = (minutes:number):number => new Date(Math.floor(new Date().valueOf() / 1000) * 1000 + minutes * 60 * 1000).valueOf()

export const hashPassword = (plainTextPassword: string) => bcrypt
  .genSalt(saltRounds)
  .then(salt => bcrypt.hash(plainTextPassword, salt))

export const comparePassword = (plainTextPassword: string, hash: string) => bcrypt
  .compare(plainTextPassword, hash)

export const getAuthToken = (user:string, exp:number = getExpirationTime(DAY)) => jwt.sign({user, exp}, process.env.JWT_SECRET)

//@ts-ignore
export const uuidv4 = () => ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)); // https://gist.github.com/LeverOne/1308368
