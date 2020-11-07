import * as dotenv from "dotenv"
import * as fs from "fs"
dotenv.config()

let lines: string[]

/**
 * These tests ensure that secrets are handled properly
 * There should be a file .env that contains simple-comment secrets
 * such as ADMIN_PASSWORD and MONGO_DB_KEY
 * 
 * See example.env for an example 
 * BUT! and this is important: do not use the same values
 * as in example.env
 **/

describe("check each line", () => {
  const exampleEnv = fs.readFileSync(`${process.cwd()}/example.env`, "utf8")
  lines = exampleEnv.replace(/\r/g, "\n").replace(/\n{2}/g, "/n").split("\n")

  test(".env exists", () => {
    const envExists = fs.existsSync(`${process.cwd()}/.env`)
    expect(envExists).toBe(true)
  })

  test("example.env has information", () => {
    expect(lines.length).toBeGreaterThan(0)
  })

  lines.forEach(line => {
    const [varName, varValue] = line.split("=")
    test(`${varName} is defined as an environmental variable`, () => { expect(process.env[varName]).toBeDefined() })
    test(`${varName} is not ${varValue}`, () => { expect(process.env[varName]).not.toBe(varValue) })
  })
})

