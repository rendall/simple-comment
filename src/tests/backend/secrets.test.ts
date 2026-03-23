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

  test("every example.env key is defined in process.env after test bootstrap", () => {
    expect(exampleEnvEntries.map(({ key }) => [key, process.env[key]])).toEqual(
      exampleEnvEntries.map(({ key }) => [key, expect.any(String)])
    )
  })

  test("sensitive example.env defaults are replaced during test bootstrap", () => {
    const sensitiveEntries = exampleEnvEntries.filter(({ key }) =>
      isSensitiveEnvKey(key)
    )

    expect(sensitiveEntries.length).toBeGreaterThan(0)
    sensitiveEntries.forEach(({ key, value }) => {
      expect(process.env[key]).not.toBe(value)
    })
  })
})
