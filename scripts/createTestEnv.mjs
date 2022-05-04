#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "fs"
import { exit } from "process"

const envExists = existsSync(`${process.cwd()}/.env`)

if (envExists) {
  console.error("Error: file .env already exists")
  exit(1)
}

const randomString = (
  length = 10,
  chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",
  str = ""
) => {
  if (length === 0) return str
  return randomString(
    length - 1,
    chars,
    str + chars[Math.floor(Math.random() * chars.length)]
  )
}

const exampleEnv = readFileSync(`${process.cwd()}/example.env`, "utf8")
const newEnv = exampleEnv
  .replace(/\r/g, "\n")
  .split("\n")
  .map(l => l.trim())
  .filter(l => !l.startsWith("#")) // eliminate comments
  .filter(l => l.length > 0) // eliminate blank lines
  .map(line => line.split("="))
  .map(([key, value]) =>
    /PASSWORD/.test(key) | /SECRET/.test(key)
      ? [key, randomString()]
      : [key, value]
  ) // replace secrets
  .map(keyVal => keyVal.join("=")) // make it a string
  .join("\n")

writeFileSync(`${process.cwd()}/.env`, newEnv)

console.info("Success: file .env created")

exit(0)
