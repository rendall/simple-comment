import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import { AbstractNotificationService } from "../../lib/AbstractNotificationService"
import type { NotificationConfiguration } from "../../lib/env"
import { ResendNotificationService } from "../../lib/ResendNotificationService"
import type { CreateEmailResponse, Resend } from "resend"

jest.mock("dotenv", () => ({ config: jest.fn() }))
jest.mock("resend", () => ({ Resend: jest.fn() }))

type ResendMailService = NonNullable<
  ConstructorParameters<typeof ResendNotificationService>[1]
>
type SendEmail = ResendMailService["emails"]["send"]

const sdk = jest.requireMock<{
  Resend: jest.Mock<
    (...args: ConstructorParameters<typeof Resend>) => ResendMailService
  >
}>("resend")

const configuration: NotificationConfiguration = {
  provider: "resend",
  apiKey: "re_synthetic_explicit_key",
  from: "explicit-sender@example.com",
  moderatorContactEmails: ["explicit-moderator@example.com"],
}
// Resend's SDK returns { data, error }, rather than SendGrid's response tuple.
// https://resend.com/docs/api-reference/emails/send-email
const accepted = {
  data: { id: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794" },
  error: null,
  headers: null,
} satisfies CreateEmailResponse
const success = { statusCode: 202, body: "Emails sent successfully" }
const message = "New comment posted by Example Author (author@example.com)"
const notificationEnvironmentKeys = [
  "RESEND_API_KEY",
  "RESEND_FROM",
  "SENDGRID_API_KEY",
  "NOTIFICATION_SERVICE_API_KEY",
  "SENDGRID_VERIFIED_SENDER",
  "SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL",
] as const

describe("Resend construction and successful sending", () => {
  const originalEnv = process.env
  let defaultSend: jest.MockedFunction<SendEmail>
  let injectedSend: jest.MockedFunction<SendEmail>
  let defaultMailService: ResendMailService
  let injectedMailService: ResendMailService
  let fetchSpy: jest.SpiedFunction<typeof fetch>

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: "production" }
    notificationEnvironmentKeys.forEach(key => delete process.env[key])
    defaultSend = jest.fn<SendEmail>().mockResolvedValue(accepted)
    injectedSend = jest.fn<SendEmail>().mockResolvedValue(accepted)
    defaultMailService = { emails: { send: defaultSend } }
    injectedMailService = { emails: { send: injectedSend } }
    sdk.Resend.mockImplementation(() => defaultMailService)
    fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new globalThis.Error("Tests must not make real HTTP requests")
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = originalEnv
  })

  it("implements AbstractNotificationService", () => {
    expect(
      new ResendNotificationService(configuration, injectedMailService)
    ).toBeInstanceOf(AbstractNotificationService)
  })

  it("initializes the default SDK client with the supplied key without sending email", () => {
    new ResendNotificationService(configuration)

    expect(sdk.Resend).toHaveBeenCalledTimes(1)
    expect(sdk.Resend).toHaveBeenCalledWith(configuration.apiKey, {
      baseUrl: "https://api.resend.com",
    })
    expect(defaultSend).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("uses the default SDK client when the optional mail service is explicitly undefined", async () => {
    const service = new ResendNotificationService(configuration, undefined)

    await expect(service.notifyModerators(message)).resolves.toEqual(success)
    expect(sdk.Resend).toHaveBeenCalledWith(configuration.apiKey, {
      baseUrl: "https://api.resend.com",
    })
    expect(defaultSend).toHaveBeenCalledTimes(1)
    expect(injectedSend).not.toHaveBeenCalled()
  })

  it("uses an injected mail service without constructing a default client or sending during construction", () => {
    new ResendNotificationService(configuration, injectedMailService)

    expect(sdk.Resend).not.toHaveBeenCalled()
    expect(injectedSend).not.toHaveBeenCalled()
    expect(defaultSend).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it.each(["default", "injected"] as const)(
    "constructs and sends with notification environment settings absent using the %s client",
    async client => {
      const service =
        client === "default"
          ? new ResendNotificationService(configuration)
          : new ResendNotificationService(configuration, injectedMailService)
      const send = client === "default" ? defaultSend : injectedSend

      await expect(service.notifyModerators(message)).resolves.toEqual(success)

      expect(send).toHaveBeenCalledTimes(1)
      expect(send).toHaveBeenCalledWith({
        from: configuration.from,
        to: configuration.moderatorContactEmails[0],
        subject: "Simple Comment Notification",
        text: message,
      })
      expect(fetchSpy).not.toHaveBeenCalled()
    }
  )

  describe.each(["default", "injected"] as const)(
    "environment independence with the %s client",
    client => {
      it.each([
        {
          name: "different and conflicting provider settings",
          settings: {
            RESEND_API_KEY: "re_synthetic_environment_key",
            RESEND_FROM: "environment-sender@example.com",
            SENDGRID_API_KEY: "SG.synthetic-environment-key",
            NOTIFICATION_SERVICE_API_KEY: "SG.synthetic-legacy-key",
            SENDGRID_VERIFIED_SENDER: "sendgrid-sender@example.com",
            SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL:
              "environment-moderator@example.com",
          },
        },
        {
          name: "empty and malformed provider settings",
          settings: {
            RESEND_API_KEY: "",
            RESEND_FROM: "not-an-address",
            SENDGRID_API_KEY: " ",
            NOTIFICATION_SERVICE_API_KEY: "",
            SENDGRID_VERIFIED_SENDER: "not-an-address",
            SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL: "not-an-address",
          },
        },
      ])("uses supplied configuration despite $name", async ({ settings }) => {
        Object.assign(process.env, settings)
        const service =
          client === "default"
            ? new ResendNotificationService(configuration)
            : new ResendNotificationService(configuration, injectedMailService)
        const send = client === "default" ? defaultSend : injectedSend

        await expect(service.notifyModerators(message)).resolves.toEqual(
          success
        )

        if (client === "default") {
          expect(sdk.Resend).toHaveBeenCalledTimes(1)
          expect(sdk.Resend).toHaveBeenCalledWith(configuration.apiKey, {
            baseUrl: "https://api.resend.com",
          })
        } else {
          expect(sdk.Resend).not.toHaveBeenCalled()
        }
        expect(send).toHaveBeenCalledTimes(1)
        expect(send).toHaveBeenCalledWith({
          from: configuration.from,
          to: configuration.moderatorContactEmails[0],
          subject: "Simple Comment Notification",
          text: message,
        })
      })
    }
  )

  it.each([
    "notifications@example.com",
    "first.last+moderation@sub.example.com",
    "Simple Comment <notifications@example.com>",
    '"Doe, Jane" <notifications@example.com>',
  ])("preserves the validated sender exactly (%s)", async from => {
    const service = new ResendNotificationService(
      { ...configuration, from },
      injectedMailService
    )

    await expect(service.notifyModerators(message)).resolves.toEqual(success)

    expect(injectedSend).toHaveBeenCalledTimes(1)
    expect(injectedSend).toHaveBeenCalledWith({
      from,
      to: configuration.moderatorContactEmails[0],
      subject: "Simple Comment Notification",
      text: message,
    })
  })

  it.each([
    message,
    "First line\n\nSecond line\r\nLast line",
    'A comment containing <tags>, an ampersand &, and "quotes"',
    "A comment with Unicode: café, 日本語, and 🙂",
  ])("sends the supplied message as unchanged plain text (%s)", async text => {
    const service = new ResendNotificationService(
      configuration,
      injectedMailService
    )

    await expect(service.notifyModerators(text)).resolves.toEqual(success)

    expect(injectedSend).toHaveBeenCalledTimes(1)
    expect(injectedSend).toHaveBeenCalledWith({
      from: configuration.from,
      to: configuration.moderatorContactEmails[0],
      subject: "Simple Comment Notification",
      text,
    })
  })

  it("returns the notification success result rather than the SDK response or credentials", async () => {
    const service = new ResendNotificationService(configuration)

    const result = await service.notifyModerators(message)

    expect(result).toEqual(success)
    expect(JSON.stringify(result)).not.toContain(accepted.data.id)
    expect(JSON.stringify(result)).not.toContain(configuration.apiKey)
  })

  it("waits for the single recipient's acceptance before reporting success", async () => {
    const service = new ResendNotificationService(
      configuration,
      injectedMailService
    )
    let resolveSend!: (value: typeof accepted) => void
    const pendingSend = new Promise<typeof accepted>(resolve => {
      resolveSend = resolve
    })
    injectedSend.mockReturnValueOnce(pendingSend)
    let finished = false
    const completion = Promise.resolve(service.notifyModerators(message)).then(
      result => {
        finished = true
        return result
      }
    )

    await new Promise<void>(resolve => setImmediate(resolve))
    const finishedBeforeAcceptance = finished
    // Settle before asserting so a failure cannot leave a send pending.
    resolveSend(accepted)
    const result = await completion

    expect(injectedSend).toHaveBeenCalledTimes(1)
    expect(finishedBeforeAcceptance).toBe(false)
    expect(result).toEqual(success)
  })

  it("reuses its default client for successive notification calls", async () => {
    const service = new ResendNotificationService(configuration)

    await expect(
      service.notifyModerators("First notification")
    ).resolves.toEqual(success)
    await expect(
      service.notifyModerators("Second notification")
    ).resolves.toEqual(success)

    expect(sdk.Resend).toHaveBeenCalledTimes(1)
    expect(defaultSend).toHaveBeenCalledTimes(2)
    expect(defaultSend).toHaveBeenNthCalledWith(1, {
      from: configuration.from,
      to: configuration.moderatorContactEmails[0],
      subject: "Simple Comment Notification",
      text: "First notification",
    })
    expect(defaultSend).toHaveBeenNthCalledWith(2, {
      from: configuration.from,
      to: configuration.moderatorContactEmails[0],
      subject: "Simple Comment Notification",
      text: "Second notification",
    })
  })

  it("keeps separately configured instances' clients and message settings independent", async () => {
    const secondConfiguration: NotificationConfiguration = {
      provider: "resend",
      apiKey: "re_second_synthetic_key",
      from: "second-sender@example.com",
      moderatorContactEmails: ["second-moderator@example.com"],
    }
    sdk.Resend.mockReturnValueOnce(defaultMailService).mockReturnValueOnce(
      injectedMailService
    )
    const firstService = new ResendNotificationService(configuration)
    const secondService = new ResendNotificationService(secondConfiguration)

    await expect(
      firstService.notifyModerators("First account")
    ).resolves.toEqual(success)
    await expect(
      secondService.notifyModerators("Second account")
    ).resolves.toEqual(success)

    expect(sdk.Resend).toHaveBeenCalledTimes(2)
    expect(sdk.Resend).toHaveBeenNthCalledWith(1, configuration.apiKey, {
      baseUrl: "https://api.resend.com",
    })
    expect(sdk.Resend).toHaveBeenNthCalledWith(2, secondConfiguration.apiKey, {
      baseUrl: "https://api.resend.com",
    })
    expect(defaultSend).toHaveBeenCalledTimes(1)
    expect(defaultSend).toHaveBeenCalledWith({
      from: configuration.from,
      to: configuration.moderatorContactEmails[0],
      subject: "Simple Comment Notification",
      text: "First account",
    })
    expect(injectedSend).toHaveBeenCalledTimes(1)
    expect(injectedSend).toHaveBeenCalledWith({
      from: secondConfiguration.from,
      to: secondConfiguration.moderatorContactEmails[0],
      subject: "Simple Comment Notification",
      text: "Second account",
    })
  })
})
