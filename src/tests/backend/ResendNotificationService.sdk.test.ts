import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import { inspect } from "node:util"
import { ResendNotificationService } from "../../lib/ResendNotificationService"
import { EnvContractError, getNotificationConfiguration } from "../../lib/env"
import type { NotificationConfiguration } from "../../lib/env"

const configuration: NotificationConfiguration = {
  provider: "resend",
  apiKey: "re_synthetic_explicit_key",
  from: "sender@example.com",
  moderatorContactEmails: ["moderator@example.com"],
}

// Keep the SDK real and stub fetch so its environment defaults are exercised
// without sending email or making any network requests.
describe("Resend default SDK client", () => {
  const originalEnv = process.env
  let fetchSpy: jest.SpiedFunction<typeof fetch>

  beforeEach(() => {
    process.env = { ...originalEnv, RESEND_DEBUG: "false" }
    delete process.env.RESEND_BASE_URL
    fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(JSON.stringify({ id: "synthetic-provider-id" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = originalEnv
  })

  it.each([
    { name: "absent", baseUrl: undefined },
    {
      name: "set to another origin",
      baseUrl: "https://synthetic-override.invalid/api",
    },
  ])(
    "sends only to Resend's official API when RESEND_BASE_URL is $name",
    async ({ baseUrl }) => {
      if (baseUrl !== undefined) process.env.RESEND_BASE_URL = baseUrl

      const service = new ResendNotificationService(configuration)
      expect(fetchSpy).not.toHaveBeenCalled()

      await expect(
        service.notifyModerators("Synthetic comment text")
      ).resolves.toEqual({
        statusCode: 202,
        body: "Emails sent successfully",
      })

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const [url, options] = fetchSpy.mock.calls[0]
      expect(url).toBe("https://api.resend.com/emails")
      expect(options?.method).toBe("POST")
      expect(new Headers(options?.headers).get("Authorization")).toBe(
        `Bearer ${configuration.apiKey}`
      )
      expect(JSON.parse(String(options?.body))).toEqual({
        from: configuration.from,
        to: configuration.moderatorContactEmails[0],
        subject: "Simple Comment Notification",
        text: "Synthetic comment text",
      })
      expect(process.env.RESEND_BASE_URL).toBe(baseUrl)
    }
  )

  it.each([
    { name: "newline", separator: "\n" },
    { name: "carriage return", separator: "\r" },
    { name: "unsupported header character", separator: "\u0100" },
  ])(
    "reports a safe initialization error for a configured key containing $name",
    ({ separator }) => {
      const privatePrefix = "re_synthetic_private_key"
      const privateSuffix = "synthetic_private_suffix"
      const apiKey = `${privatePrefix}${separator}${privateSuffix}`
      const { configuration: configured } = getNotificationConfiguration({
        RESEND_API_KEY: apiKey,
        RESEND_FROM: configuration.from,
        SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL:
          configuration.moderatorContactEmails.join(","),
      })
      expect(configured).toBeDefined()
      if (configured === undefined) {
        throw new globalThis.Error("Expected a Resend configuration")
      }
      expect(configured.apiKey).toBe(apiKey)
      const consoleSpies = (
        ["error", "warn", "info", "log", "debug", "trace"] as const
      ).map(method => jest.spyOn(console, method).mockImplementation(() => {}))
      let failure: unknown

      try {
        new ResendNotificationService(configured)
      } catch (error) {
        failure = error
      }

      expect(failure).toBeInstanceOf(EnvContractError)
      expect(failure).toMatchObject({
        key: "RESEND_API_KEY",
        message: "Unable to initialize Resend. Check RESEND_API_KEY.",
      })
      expect(failure).not.toHaveProperty("cause")
      // Check both pieces because inspection escapes newlines and other characters.
      const diagnostics = inspect(
        { failure, logs: consoleSpies.map(spy => spy.mock.calls) },
        { depth: null }
      )
      expect(diagnostics).not.toContain(privatePrefix)
      expect(diagnostics).not.toContain(privateSuffix)
      consoleSpies.forEach(spy => expect(spy).not.toHaveBeenCalled())
      expect(fetchSpy).not.toHaveBeenCalled()
    }
  )

  it.each([
    {
      gatewayStatus: 502,
      expected: {
        statusCode: 503,
        body: "Notification service unavailable: 0 accepted, 1 failed. Check network access and Resend's service status, then try again later.",
      },
      logsGuidance: true,
    },
    {
      gatewayStatus: 504,
      expected: {
        statusCode: 504,
        body: "Notification timed out: 0 accepted, 1 failed.",
      },
      logsGuidance: false,
    },
  ])(
    "classifies a non-JSON HTTP $gatewayStatus response through the real SDK",
    async ({ gatewayStatus, expected, logsGuidance }) => {
      const message = "Synthetic private comment body"
      const privateValues = [
        configuration.apiKey,
        configuration.from,
        ...configuration.moderatorContactEmails,
        message,
        "synthetic-private-gateway-detail",
        "synthetic-private-provider-header",
      ]
      fetchSpy.mockImplementationOnce(
        async () =>
          new Response(`<html>${privateValues.join(" | ")}</html>`, {
            status: gatewayStatus,
            headers: {
              "Content-Type": "text/html",
              "X-Provider-Detail": "synthetic-private-provider-header",
            },
          })
      )
      const consoleSpies = (
        ["error", "warn", "info", "log", "debug", "trace"] as const
      ).map(method => jest.spyOn(console, method).mockImplementation(() => {}))
      const service = new ResendNotificationService(configuration)

      const result = await service.notifyModerators(message)

      expect(result).toEqual(expected)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(consoleSpies.flatMap(spy => spy.mock.calls)).toEqual(
        logsGuidance ? [["Notification provider error", expected]] : []
      )
      const diagnostics = inspect(
        { result, logs: consoleSpies.map(spy => spy.mock.calls) },
        { depth: null }
      )
      privateValues.forEach(value => expect(diagnostics).not.toContain(value))
    }
  )
})
