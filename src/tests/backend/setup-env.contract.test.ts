import type { ExampleEnvEntry } from "./env-utils"
import {
  getDeterministicSecretValue,
  isSensitiveEnvKey,
} from "./env-utils"

const bootstrapWithEntries = (
  entries: ExampleEnvEntry[],
  initialEnv: NodeJS.ProcessEnv = {}
) => {
  const previousEnv = { ...process.env }
  let bootstrappedEnv: NodeJS.ProcessEnv = {}

  process.env = { ...previousEnv, ...initialEnv }
  jest.resetModules()

  jest.doMock("./env-utils", () => ({
    getDeterministicSecretValue,
    isSensitiveEnvKey,
    parseExampleEnvText: () => entries,
    readExampleEnvText: () => "unused",
  }))

  try {
    jest.isolateModules(() => {
      require("./setup-env")
      bootstrappedEnv = entries.reduce<NodeJS.ProcessEnv>((env, { key }) => {
        env[key] = process.env[key]
        return env
      }, {})
    })

    return bootstrappedEnv
  } finally {
    jest.dontMock("./env-utils")
    jest.resetModules()
    process.env = previousEnv
  }
}

describe("backend setup env bootstrap contract", () => {
  test("injects missing non-sensitive keys from example env entries", () => {
    expect(
      bootstrapWithEntries([{ key: "SC_PUBLIC_VALUE", value: "public-default" }])
    ).toEqual({
      SC_PUBLIC_VALUE: "public-default",
    })
  })

  test("injects deterministic non-default values for unset sensitive keys", () => {
    expect(
      bootstrapWithEntries([
        { key: "SC_TEST_SECRET", value: "secret-default" },
      ])
    ).toEqual({
      SC_TEST_SECRET: getDeterministicSecretValue("SC_TEST_SECRET"),
    })
  })

  test("replaces sensitive defaults when process.env still matches example env", () => {
    expect(
      bootstrapWithEntries(
        [{ key: "SC_TEST_PASSWORD", value: "password-default" }],
        { SC_TEST_PASSWORD: "password-default" }
      )
    ).toEqual({
      SC_TEST_PASSWORD: getDeterministicSecretValue("SC_TEST_PASSWORD"),
    })
  })

  test("does not overwrite pre-set non-default values", () => {
    expect(
      bootstrapWithEntries(
        [
          { key: "SC_PUBLIC_VALUE", value: "public-default" },
          { key: "SC_TEST_SECRET", value: "secret-default" },
        ],
        {
          SC_PUBLIC_VALUE: "already-custom",
          SC_TEST_SECRET: "already-secret",
        }
      )
    ).toEqual({
      SC_PUBLIC_VALUE: "already-custom",
      SC_TEST_SECRET: "already-secret",
    })
  })

  test("uses the shared sensitive-key classifier during bootstrap", () => {
    expect(isSensitiveEnvKey("SC_TEST_SECRET")).toBe(true)
    expect(isSensitiveEnvKey("SC_PUBLIC_VALUE")).toBe(false)
  })
})
