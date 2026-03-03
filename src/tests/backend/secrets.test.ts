import * as dotenv from "dotenv"
import * as fs from "fs"
dotenv.config()

let exampleEnvEntries: string[]

/**
 * example.env is tracked in git and shows the
 * environmental variables expected at runtime.
 * Test setup injects deterministic values for CI/local tests.
 *
 * This test file ensures that:
 * - `example.env` exists
 * - every variable in `example.env` is an environmental variable
 * - each value is not the default value given in `example.env`
 **/

describe("Ensures secrets are secret", () => {
  test("example.env exists", () => {
    const exampleEnvExists = fs.existsSync(`${process.cwd()}/example.env`)
    expect(exampleEnvExists).toBe(true)
  })

  const exampleEnv = fs.readFileSync(`${process.cwd()}/example.env`, "utf8")

  // These are all the entries in `example.env`
  exampleEnvEntries = exampleEnv
    .replace(/\r/g, "\n")
    .split("\n")
    .map(l => l.trim())
    .filter(l => !l.startsWith("#")) // eliminate comments
    .filter(l => l.length > 0) // eliminate blank lines

  // Are there any entries at all in `example.env`?
  test("example.env has information", () => {
    expect(exampleEnvEntries.length).toBeGreaterThan(0)
  })

  // Each entry in example.env has a corresponding defined process.env variable
  exampleEnvEntries.forEach(line => {
    const [varName, varValue] = line.split("=")
    test(`${varName} is defined as an environmental variable`, () => {
      expect(process.env[varName]).toBeDefined()
    })

    // The value of each SECRET or PASSWORD in 'example.env' is not the same as in process.env
    if (varName.indexOf("SECRET") >= 0 || varName.indexOf("PASSWORD") >= 0)
      test(`${varName} is not ${varValue}`, () => {
        expect(process.env[varName]).not.toBe(varValue)
      })
  })
})
