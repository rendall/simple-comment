import * as dotenv from "dotenv"
import * as fs from "fs"
dotenv.config()

let exampleLines: string[]

/**
 * Simple Comment uses a .env file to keep secrets
 * It is not tracked in git
 * example.env is tracked in git and shows the
 * environmental variables expected in git
 * 
 * This test file ensures that:
 * - `example.env` exists
 * - `.env` exists
 * - every variable in `example.env` is an environmental variable
 * - each value is not the default value given in `example.env`
 **/

describe("Ensures secrets are secret", () => {

  test("example.env exists", () => {
    const exampleEnvExists = fs.existsSync(`${process.cwd()}/example.env`)
    expect(exampleEnvExists).toBe(true)
  })
  
  const exampleEnv = fs.readFileSync(`${process.cwd()}/example.env`, "utf8")

  exampleLines = exampleEnv
    .replace(/\r/g, "\n")
    .replace(/\n{2}/g, "/n")
    .split("\n")
    .map(l => l.trim())
    .filter(l => !l.startsWith("#"))

  test(".env exists", () => {
    const envExists = fs.existsSync(`${process.cwd()}/.env`)
    expect(envExists).toBe(true)
  })

  test("example.env has information", () => {
    expect(exampleLines.length).toBeGreaterThan(0)
  })

  exampleLines.forEach(line => {
    const [varName, varValue] = line.split("=")
    test(`${varName} is defined as an environmental variable`, () => { expect(process.env[varName]).toBeDefined() })
    test(`${varName} is not ${varValue}`, () => { expect(process.env[varName]).not.toBe(varValue) })
  })
})

