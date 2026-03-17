import {
  getDeterministicSecretValue,
  isSensitiveEnvKey,
  parseExampleEnvText,
} from "./env-utils"

describe("backend env utils", () => {
  describe("parseExampleEnvText", () => {
    test("ignores blank lines and full-line comments while preserving entry order", () => {
      expect(
        parseExampleEnvText(`

          # comment
          PUBLIC_VALUE=first
          SECRET_VALUE=second
        `)
      ).toEqual([
        { key: "PUBLIC_VALUE", value: "first" },
        { key: "SECRET_VALUE", value: "second" },
      ])
    })

    test("uses the first equals sign as the key/value separator", () => {
      expect(parseExampleEnvText("TOKEN_VALUE=part=still-value")).toEqual([
        { key: "TOKEN_VALUE", value: "part=still-value" },
      ])
    })

    test('fails fast when a non-comment line is missing "="', () => {
      expect(() => parseExampleEnvText("MALFORMED_LINE")).toThrow(
        'expected "="'
      )
    })

    test("fails fast when a key is blank", () => {
      expect(() => parseExampleEnvText(" =value")).toThrow("blank key")
    })

    test("fails fast on duplicate keys", () => {
      expect(() => parseExampleEnvText("PUBLIC_VALUE=first\nPUBLIC_VALUE=second"))
        .toThrow("Duplicate example.env key: PUBLIC_VALUE")
    })
  })

  describe("sensitive env helpers", () => {
    test("classifies SECRET and PASSWORD keys as sensitive", () => {
      expect(isSensitiveEnvKey("JWT_SECRET")).toBe(true)
      expect(isSensitiveEnvKey("MODERATOR_PASSWORD")).toBe(true)
      expect(isSensitiveEnvKey("API_TOKEN")).toBe(false)
    })

    test("builds deterministic secret replacement values", () => {
      expect(getDeterministicSecretValue("JWT_SECRET")).toBe(
        "test-jwt_secret-value"
      )
    })
  })
})
