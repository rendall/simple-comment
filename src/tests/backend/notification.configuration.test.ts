import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import { inspect } from "node:util"
import {
  EnvContractError,
  getBackendEnv,
  getNotificationConfiguration,
  type NotificationConfiguration,
} from "../../lib/env"

jest.mock("dotenv", () => ({ config: jest.fn() }))
jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
  MailService: jest.fn(),
}))
jest.mock("../../lib/SendGridNotificationService", () => ({
  SendGridNotificationService: jest.fn(),
}))
jest.mock(
  "../../lib/ResendNotificationService",
  () => ({ ResendNotificationService: jest.fn() }),
  { virtual: true }
)

const recipients = ["alice@example.com", "bob@example.com"]
const contact = { SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL: recipients.join(",") }
const resend = {
  RESEND_API_KEY: "synthetic-resend-secret",
  RESEND_FROM: "resend-sender@example.com",
}
const sendgrid = {
  SENDGRID_API_KEY: "synthetic-sendgrid-secret",
  SENDGRID_VERIFIED_SENDER: "sendgrid-sender@example.com",
}
const legacy = {
  NOTIFICATION_SERVICE_API_KEY: "synthetic-legacy-secret",
  SENDGRID_VERIFIED_SENDER: sendgrid.SENDGRID_VERIFIED_SENDER,
}
const providerCases: {
  provider: NotificationConfiguration["provider"]
  settings: NodeJS.ProcessEnv
  apiKeyName: string
  senderName: string
  expected: NotificationConfiguration
}[] = [
  {
    provider: "resend",
    settings: resend,
    apiKeyName: "RESEND_API_KEY",
    senderName: "RESEND_FROM",
    expected: {
      provider: "resend",
      apiKey: resend.RESEND_API_KEY,
      from: resend.RESEND_FROM,
      moderatorContactEmails: recipients,
    },
  },
  {
    provider: "sendgrid",
    settings: sendgrid,
    apiKeyName: "SENDGRID_API_KEY",
    senderName: "SENDGRID_VERIFIED_SENDER",
    expected: {
      provider: "sendgrid",
      apiKey: sendgrid.SENDGRID_API_KEY,
      from: sendgrid.SENDGRID_VERIFIED_SENDER,
      moderatorContactEmails: recipients,
    },
  },
]

const expectPrivateValuesAbsent = (
  diagnostic: unknown,
  source: NodeJS.ProcessEnv
) => {
  const text = inspect(diagnostic, { depth: null })
  const values = Object.values(source).flatMap(value =>
    value && value.trim() ? [value, value.trim()] : []
  )
  values.forEach(value => expect(text).not.toContain(value))
}

const expectConfigurationError = (
  source: NodeJS.ProcessEnv,
  keys: string[] = []
) => {
  let failure: unknown
  try {
    getNotificationConfiguration(source)
  } catch (error) {
    failure = error
  }
  expect(failure).toBeInstanceOf(EnvContractError)
  if (!(failure instanceof EnvContractError)) {
    throw new Error(
      "Expected an EnvContractError from the configuration reader"
    )
  }
  keys.forEach(key => expect(failure.message).toContain(key))
  expectPrivateValuesAbsent(failure, source)
  return failure
}

describe("notification configuration", () => {
  const originalEnv = process.env
  let consoleSpies: jest.SpiedFunction<typeof console.error>[]
  let fetchSpy: jest.SpiedFunction<typeof fetch>

  beforeEach(() => {
    // Deliberately conflict with every valid explicit source. A reader falling
    // back to process.env would select the wrong provider or reject valid input.
    process.env = {
      ...originalEnv,
      ...contact,
      ...resend,
      ...sendgrid,
      ...legacy,
    }
    consoleSpies = (
      ["error", "warn", "info", "log", "debug", "trace"] as const
    ).map(method => jest.spyOn(console, method).mockImplementation(() => {}))
    fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("Configuration validation must not make network requests")
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = originalEnv
  })

  describe("provider combinations", () => {
    const states = ["absent", "complete", "incomplete"] as const
    const matrix = states.flatMap(resendState =>
      states.map(sendgridState => ({ resendState, sendgridState }))
    )

    it.each(matrix)(
      "handles Resend=$resendState and SendGrid=$sendgridState",
      ({ resendState, sendgridState }) => {
        const source = {
          ...contact,
          ...(resendState === "complete" ? resend : {}),
          ...(resendState === "incomplete"
            ? { RESEND_API_KEY: resend.RESEND_API_KEY }
            : {}),
          ...(sendgridState === "complete" ? sendgrid : {}),
          ...(sendgridState === "incomplete"
            ? { SENDGRID_API_KEY: sendgrid.SENDGRID_API_KEY }
            : {}),
        }
        if (resendState === "absent" && sendgridState === "absent") {
          expect(getNotificationConfiguration(source)).toEqual({
            configuration: undefined,
            warnings: [],
          })
        } else if (resendState === "complete" && sendgridState === "absent") {
          expect(getNotificationConfiguration(source)).toEqual({
            configuration: providerCases[0].expected,
            warnings: [],
          })
        } else if (resendState === "absent" && sendgridState === "complete") {
          expect(getNotificationConfiguration(source)).toEqual({
            configuration: providerCases[1].expected,
            warnings: [],
          })
        } else {
          expectConfigurationError(source)
        }
      }
    )

    it("explains that only one provider can be configured", () => {
      const failure = expectConfigurationError({
        ...contact,
        ...resend,
        ...sendgrid,
      })
      expect(failure.message).toMatch(/resend/i)
      expect(failure.message).toMatch(/sendgrid/i)
      expect(failure.message).toMatch(/only one|exactly one|remove/i)
    })

    it("does not require unrelated backend settings to validate notification configuration", () => {
      expect(getNotificationConfiguration({ ...contact, ...resend })).toEqual({
        configuration: providerCases[0].expected,
        warnings: [],
      })
    })

    it("does not let the moderator contact setting enable notifications", () => {
      expect(getNotificationConfiguration(contact)).toEqual({
        configuration: undefined,
        warnings: [],
      })
    })

    it("leaves the required backend contact check in getBackendEnv when notifications are off", () => {
      expect(() =>
        getBackendEnv({
          DB_CONNECTION_STRING: "synthetic-db-connection",
          DATABASE_NAME: "synthetic-database",
          JWT_SECRET: "synthetic-jwt-secret",
          ALLOW_ORIGIN: "https://example.com",
          SIMPLE_COMMENT_MODERATOR_ID: "synthetic-moderator",
          SIMPLE_COMMENT_MODERATOR_PASSWORD: "synthetic-password",
        })
      ).toThrow("SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL")
    })
  })

  describe.each(providerCases)(
    "$provider settings",
    ({ settings, apiKeyName, senderName, expected }) => {
      it.each(["key", "sender"])(
        "rejects a missing %s with a named, useful error",
        missing => {
          const source: NodeJS.ProcessEnv = { ...contact, ...settings }
          const missingKey = missing === "key" ? apiKeyName : senderName
          delete source[missingKey]
          const failure = expectConfigurationError(source, [missingKey])
          expect(failure.message).toMatch(/required|missing|provide|set/i)
        }
      )

      it.each([
        { field: "key", value: "" },
        { field: "key", value: " \t " },
        { field: "sender", value: "" },
        { field: "sender", value: " \t " },
      ])(
        "rejects an empty or whitespace-only $field ($value)",
        ({ field, value }) => {
          const key = field === "key" ? apiKeyName : senderName
          expectConfigurationError({ ...contact, ...settings, [key]: value }, [
            key,
          ])
        }
      )

      it("accepts an opaque nonblank API key without guessing its validity from a prefix", () => {
        const apiKey = "opaque-synthetic-provider-token"
        expect(
          getNotificationConfiguration({
            ...contact,
            ...settings,
            [apiKeyName]: apiKey,
          })
        ).toEqual({
          configuration: { ...expected, apiKey },
          warnings: [],
        })
      })

      it.each([
        "missing-at-sign",
        "@example.com",
        "sender@",
        "sender@example.com\n",
        "sender@example.com\r\nBcc: hidden@example.com",
      ])("rejects a malformed sender (%s)", from => {
        expectConfigurationError(
          { ...contact, ...settings, [senderName]: from },
          [senderName]
        )
      })

      it.each([
        { name: "missing", value: undefined },
        { name: "empty", value: "" },
        { name: "whitespace", value: " \t " },
        { name: "empty CSV entries", value: " , , " },
      ])("requires recipients when enabled: $name", ({ value }) => {
        expectConfigurationError(
          { ...settings, SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL: value },
          ["SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL"]
        )
      })

      it.each([
        { value: "moderator@example.com", emails: ["moderator@example.com"] },
        { value: " alice@example.com, bob@example.com ", emails: recipients },
        {
          value: " ,alice@example.com,, bob@example.com, ",
          emails: recipients,
        },
        {
          value: "first.last+moderation@sub.example.com",
          emails: ["first.last+moderation@sub.example.com"],
        },
      ])("parses plain moderator addresses ($value)", ({ value, emails }) => {
        expect(
          getNotificationConfiguration({
            ...settings,
            SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL: value,
          })
        ).toEqual({
          configuration: { ...expected, moderatorContactEmails: emails },
          warnings: [],
        })
      })

      it.each([
        "missing-at-sign",
        "@example.com",
        "moderator@",
        "alice@example.com,private-invalid-recipient",
        "Alice <alice@example.com>",
        "<alice@example.com>",
        "alice@example.com,Bob <bob@example.com>",
        "alice@example.com\n",
        "alice@example.com\r\nBcc: hidden@example.com",
      ])("rejects an invalid moderator list (%s)", value => {
        expectConfigurationError(
          { ...settings, SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL: value },
          ["SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL"]
        )
      })
    }
  )

  describe("Resend display names", () => {
    it.each([
      "Simple Comment <notifications@example.com>",
      '"Doe, Jane" <notifications@example.com>',
    ])("accepts a single sender with a display name (%s)", from => {
      expect(
        getNotificationConfiguration({
          ...contact,
          ...resend,
          RESEND_FROM: from,
        })
      ).toEqual({
        configuration: { ...providerCases[0].expected, from },
        warnings: [],
      })
    })

    it.each([
      "alice@example.com,bob@example.com",
      "Alice <alice@example.com>,Bob <bob@example.com>",
      "Alice <alice@example.com>,bob@example.com",
      "alice@example.com,Bob <bob@example.com>",
      "Simple Comment <notifications@example.com",
      "Simple Comment notifications@example.com>",
      "Simple Comment <>",
      " <notifications@example.com>",
    ])("rejects multiple or malformed senders (%s)", from => {
      expectConfigurationError({ ...contact, ...resend, RESEND_FROM: from }, [
        "RESEND_FROM",
      ])
    })
  })

  describe("legacy SendGrid configuration", () => {
    it("selects SendGrid and returns a safe deprecation warning for CI", () => {
      const source = { ...contact, ...legacy }
      const result = getNotificationConfiguration(source)
      expect(result.configuration).toEqual({
        ...providerCases[1].expected,
        apiKey: legacy.NOTIFICATION_SERVICE_API_KEY,
      })
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toMatch(/deprecat/i)
      expect(result.warnings[0]).toContain("NOTIFICATION_SERVICE_API_KEY")
      expect(result.warnings[0]).toContain("SENDGRID_API_KEY")
      expectPrivateValuesAbsent(result.warnings, source)
    })

    it("requires the verified sender for the old key name", () => {
      expectConfigurationError(
        {
          ...contact,
          NOTIFICATION_SERVICE_API_KEY: legacy.NOTIFICATION_SERVICE_API_KEY,
        },
        ["SENDGRID_VERIFIED_SENDER"]
      )
    })

    it.each(["", " \t "])("rejects an invalid legacy key (%s)", key => {
      expectConfigurationError(
        { ...contact, ...legacy, NOTIFICATION_SERVICE_API_KEY: key },
        ["NOTIFICATION_SERVICE_API_KEY"]
      )
    })

    it.each(["same", "different", "empty"])(
      "rejects both key names with %s values and says to remove the old name",
      values => {
        const newKey =
          values === "same"
            ? legacy.NOTIFICATION_SERVICE_API_KEY
            : values === "empty"
              ? ""
              : sendgrid.SENDGRID_API_KEY
        const failure = expectConfigurationError(
          { ...contact, ...legacy, SENDGRID_API_KEY: newKey },
          ["NOTIFICATION_SERVICE_API_KEY", "SENDGRID_API_KEY"]
        )
        expect(failure.message).toMatch(
          /remove\s+[`'"]?NOTIFICATION_SERVICE_API_KEY/i
        )
      }
    )

    it("rejects Resend alongside a complete legacy SendGrid setup", () => {
      expectConfigurationError({ ...contact, ...resend, ...legacy })
    })

    it("does not use an old SendGrid key as a Resend credential", () => {
      expectConfigurationError({
        ...contact,
        RESEND_FROM: resend.RESEND_FROM,
        NOTIFICATION_SERVICE_API_KEY: legacy.NOTIFICATION_SERVICE_API_KEY,
      })
    })
  })

  describe("isolation and diagnostics", () => {
    it("does not fill absent explicit settings from process.env", () => {
      expect(getNotificationConfiguration({})).toEqual({
        configuration: undefined,
        warnings: [],
      })
      expectConfigurationError(
        { ...contact, RESEND_API_KEY: resend.RESEND_API_KEY },
        ["RESEND_FROM"]
      )
    })

    it.each(providerCases)(
      "does not mutate $provider input",
      ({ settings, expected }) => {
        const source = Object.freeze({ ...contact, ...settings })
        const snapshot = { ...source }
        expect(getNotificationConfiguration(source)).toEqual({
          configuration: expected,
          warnings: [],
        })
        expect(source).toEqual(snapshot)
      }
    )

    it("does not mutate invalid input", () => {
      const source = Object.freeze({ ...contact, ...resend, ...sendgrid })
      const snapshot = { ...source }
      expectConfigurationError(source)
      expect(source).toEqual(snapshot)
    })

    it("does not log valid configurations, errors, or deprecation warnings", () => {
      getNotificationConfiguration({ ...contact, ...resend })
      getNotificationConfiguration({ ...contact, ...legacy })
      expectConfigurationError({ ...contact, ...resend, ...sendgrid })
      consoleSpies.forEach(spy => expect(spy).not.toHaveBeenCalled())
    })

    it("keeps unrelated environment values out of errors", () => {
      expectConfigurationError({
        ...contact,
        ...resend,
        ...sendgrid,
        UNRELATED_PRIVATE_VALUE: "synthetic-unrelated-private-detail",
      })
    })

    it("does not construct providers, initialize clients, or make HTTP requests", () => {
      const sdk = jest.requireMock<{
        setApiKey: jest.Mock
        send: jest.Mock
        MailService: jest.Mock
      }>("@sendgrid/mail")
      const sendGridProvider = jest.requireMock<{
        SendGridNotificationService: jest.Mock
      }>("../../lib/SendGridNotificationService")
      const resendProvider = jest.requireMock<{
        ResendNotificationService: jest.Mock
      }>("../../lib/ResendNotificationService")
      getNotificationConfiguration({ ...contact, ...resend })
      getNotificationConfiguration({ ...contact, ...sendgrid })
      expect(
        sendGridProvider.SendGridNotificationService
      ).not.toHaveBeenCalled()
      expect(resendProvider.ResendNotificationService).not.toHaveBeenCalled()
      expect(sdk.setApiKey).not.toHaveBeenCalled()
      expect(sdk.send).not.toHaveBeenCalled()
      expect(sdk.MailService).not.toHaveBeenCalled()
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })
})
