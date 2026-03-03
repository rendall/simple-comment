import { readFileSync } from "fs"

const exampleEnvPath = `${process.cwd()}/example.env`

const deterministicSecretValue = (key: string) =>
  `test-${key.toLowerCase()}-value`

const isSecretOrPassword = (key: string) =>
  key.includes("SECRET") || key.includes("PASSWORD")

const parseExampleEnv = () =>
  readFileSync(exampleEnvPath, "utf8")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .filter(line => !line.startsWith("#"))
    .map(line => {
      const separatorIndex = line.indexOf("=")
      if (separatorIndex < 1) return undefined
      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim()
      return { key, value }
    })
    .filter(entry => entry !== undefined)

parseExampleEnv().forEach(({ key, value }) => {
  if (isSecretOrPassword(key)) {
    if (process.env[key] === undefined || process.env[key] === value) {
      process.env[key] = deterministicSecretValue(key)
    }
    return
  }

  if (process.env[key] === undefined) {
    process.env[key] = value
  }
})
