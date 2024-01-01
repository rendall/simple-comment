import { hash, compare } from "bcryptjs"
import * as jwt from "jsonwebtoken"
import * as dotenv from "dotenv"

dotenv.config()

const YEAR_SECONDS = 60 * 60 * 24 * 365
const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export const getExpirationTime = (secondsFromNow: number): number => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearSeconds = isLeapYear(currentYear) ? 60 * 60 * 24 * 366 : YEAR_SECONDS;
  
  return new Date(
    Math.floor((now.valueOf() + secondsFromNow * 1000) / 10000) * 10000
  ).valueOf() / 1000;
}
export const hashPassword = async (password: string) =>
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
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign({ user, exp }, process.env.JWT_SECRET);
}
