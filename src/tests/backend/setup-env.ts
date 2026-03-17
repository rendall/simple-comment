import {
  getDeterministicSecretValue,
  isSensitiveEnvKey,
  parseExampleEnvText,
  readExampleEnvText,
} from "./env-utils"

parseExampleEnvText(readExampleEnvText()).forEach(({ key, value }) => {
  if (isSensitiveEnvKey(key)) {
    if (process.env[key] === undefined || process.env[key] === value) {
      process.env[key] = getDeterministicSecretValue(key)
    }
    return
  }

  if (process.env[key] === undefined) {
    process.env[key] = value
  }
})
