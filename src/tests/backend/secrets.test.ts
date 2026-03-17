import * as fs from "fs"
import {
  isSensitiveEnvKey,
  parseExampleEnvText,
  readExampleEnvText,
} from "./env-utils"

let exampleEnvEntries: { key: string; value: string }[]

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

  // These are all the entries in `example.env`
  exampleEnvEntries = parseExampleEnvText(readExampleEnvText())

  // Are there any entries at all in `example.env`?
  test("example.env has information", () => {
    expect(exampleEnvEntries.length).toBeGreaterThan(0)
  })

  // Each entry in example.env has a corresponding defined process.env variable
  exampleEnvEntries.forEach(({ key, value }) => {
    test(`${key} is defined as an environmental variable`, () => {
      expect(process.env[key]).toBeDefined()
    })

    // The value of each SECRET or PASSWORD in 'example.env' is not the same as in process.env
    if (isSensitiveEnvKey(key))
      test(`${key} is not ${value}`, () => {
        expect(process.env[key]).not.toBe(value)
      })
  })
})
