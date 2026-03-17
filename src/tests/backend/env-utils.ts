import { readFileSync } from "fs"

export type ExampleEnvEntry = {
  key: string
  value: string
}

export const exampleEnvPath = `${process.cwd()}/example.env`

export const isSensitiveEnvKey = (key: string) =>
  key.includes("SECRET") || key.includes("PASSWORD")

export const getDeterministicSecretValue = (key: string) =>
  `test-${key.toLowerCase()}-value`

export const readExampleEnvText = (path = exampleEnvPath) =>
  readFileSync(path, "utf8")

export const parseExampleEnvText = (text: string) => {
  const seenKeys = new Set<string>()

  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .reduce<ExampleEnvEntry[]>((entries, rawLine) => {
      const line = rawLine.trim()

      if (line.length === 0 || line.startsWith("#")) {
        return entries
      }

      const separatorIndex = line.indexOf("=")

      if (separatorIndex < 0) {
        throw new Error(`Invalid example.env entry, expected "=": ${rawLine}`)
      }

      const key = line.slice(0, separatorIndex).trim()

      if (key.length === 0) {
        throw new Error(`Invalid example.env entry, blank key: ${rawLine}`)
      }

      if (seenKeys.has(key)) {
        throw new Error(`Duplicate example.env key: ${key}`)
      }

      seenKeys.add(key)

      return [...entries, { key, value: line.slice(separatorIndex + 1).trim() }]
    }, [])
}
