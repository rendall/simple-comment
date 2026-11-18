import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import { ResendNotificationService } from "../../lib/ResendNotificationService"
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
})
