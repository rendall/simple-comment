import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import type { ClientResponse, MailService } from "@sendgrid/mail"
import sendGridMail from "@sendgrid/mail"
import { SendGridNotificationService } from "../../lib/SendGridNotificationService"
import type { NotificationConfiguration } from "../../lib/env"

jest.mock("dotenv", () => ({ config: jest.fn() }))
jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}))

const configuration: NotificationConfiguration = {
  provider: "sendgrid",
  apiKey: "SG.synthetic-explicit-key",
  from: "explicit-sender@example.com",
  moderatorContactEmails: [
    "first-explicit-moderator@example.com",
    "second-explicit-moderator@example.com",
  ],
}

const notificationEnvironmentKeys = [
  "RESEND_API_KEY",
  "RESEND_FROM",
  "SENDGRID_API_KEY",
  "NOTIFICATION_SERVICE_API_KEY",
  "SENDGRID_VERIFIED_SENDER",
  "SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL",
] as const

const accepted: [ClientResponse, object] = [
  { statusCode: 202, body: {}, headers: undefined },
  {},
]

describe("SendGrid explicit constructor configuration", () => {
  const originalEnv = process.env
  let setApiKey: jest.MockedFunction<MailService["setApiKey"]>
  let send: jest.MockedFunction<MailService["send"]>
  let mailService: MailService

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: "production" }
    notificationEnvironmentKeys.forEach(key => delete process.env[key])
    // A valid legacy setup lets failures expose the old constructor contract,
    // rather than unrelated missing backend settings or developer configuration.
    Object.assign(process.env, {
      NOTIFICATION_SERVICE_API_KEY: "SG.synthetic-environment-key",
      SENDGRID_VERIFIED_SENDER: "environment-sender@example.com",
      SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL:
        "environment-moderator@example.com",
    })
    setApiKey = jest.fn<MailService["setApiKey"]>()
    send = jest.fn<MailService["send"]>().mockResolvedValue(accepted)
    mailService = { setApiKey, send } as unknown as MailService
    jest.mocked(sendGridMail.send).mockResolvedValue(accepted)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("initializes the injected mail service with the supplied API key", () => {
    new SendGridNotificationService(configuration, mailService)

    expect(setApiKey).toHaveBeenCalledTimes(1)
    expect(setApiKey).toHaveBeenCalledWith(configuration.apiKey)
    expect(sendGridMail.setApiKey).not.toHaveBeenCalled()
  })

  it("defaults to the SendGrid client when the mail service is omitted", async () => {
    const service = new SendGridNotificationService(configuration)

    expect(sendGridMail.setApiKey).toHaveBeenCalledTimes(1)
    expect(sendGridMail.setApiKey).toHaveBeenCalledWith(configuration.apiKey)
    expect(sendGridMail.send).not.toHaveBeenCalled()
    expect(setApiKey).not.toHaveBeenCalled()

    const message = "A notification sent through the default client"
    const result = await service.notifyModerators(message)

    expect(result.statusCode).toBe(202)
    expect(sendGridMail.send).toHaveBeenCalledTimes(
      configuration.moderatorContactEmails.length
    )
    configuration.moderatorContactEmails.forEach((recipient, index) => {
      expect(sendGridMail.send).toHaveBeenNthCalledWith(index + 1, {
        to: recipient,
        from: configuration.from,
        subject: "Simple Comment Notification",
        text: message,
      })
    })
    expect(send).not.toHaveBeenCalled()
  })

  it("sends from the supplied sender to every supplied moderator", async () => {
    const service = new SendGridNotificationService(configuration, mailService)
    const message = "A notification supplied by the caller"

    const result = await service.notifyModerators(message)

    expect(result.statusCode).toBe(202)
    expect(send).toHaveBeenCalledTimes(
      configuration.moderatorContactEmails.length
    )
    configuration.moderatorContactEmails.forEach((recipient, index) => {
      expect(send).toHaveBeenNthCalledWith(index + 1, {
        to: recipient,
        from: configuration.from,
        subject: "Simple Comment Notification",
        text: message,
      })
    })
    expect(sendGridMail.send).not.toHaveBeenCalled()
  })

  it("constructs successfully with all notification environment settings absent", () => {
    notificationEnvironmentKeys.forEach(key => delete process.env[key])

    expect(
      () => new SendGridNotificationService(configuration, mailService)
    ).not.toThrow()
    expect(setApiKey).toHaveBeenCalledWith(configuration.apiKey)
  })

  it.each([
    {
      name: "different environment values",
      settings: {
        SENDGRID_API_KEY: "SG.another-synthetic-environment-key",
        NOTIFICATION_SERVICE_API_KEY: "SG.synthetic-environment-key",
        SENDGRID_VERIFIED_SENDER: "environment-sender@example.com",
        SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL:
          "environment-moderator@example.com",
        RESEND_API_KEY: "synthetic-unrelated-resend-key",
        RESEND_FROM: "unrelated-resend-sender@example.com",
      },
    },
    {
      name: "incomplete and malformed environment values",
      settings: {
        SENDGRID_API_KEY: "",
        NOTIFICATION_SERVICE_API_KEY: " ",
        SENDGRID_VERIFIED_SENDER: "not-an-email",
        SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL: "not-an-email",
        RESEND_API_KEY: "synthetic-unrelated-resend-key",
        RESEND_FROM: "",
      },
    },
  ])("uses supplied configuration despite $name", async ({ settings }) => {
    Object.assign(process.env, settings)

    const service = new SendGridNotificationService(configuration, mailService)
    const message = "Explicit settings take precedence over the environment"
    await service.notifyModerators(message)

    expect(setApiKey).toHaveBeenCalledTimes(1)
    expect(setApiKey).toHaveBeenCalledWith(configuration.apiKey)
    expect(send).toHaveBeenCalledTimes(
      configuration.moderatorContactEmails.length
    )
    configuration.moderatorContactEmails.forEach((recipient, index) => {
      expect(send).toHaveBeenNthCalledWith(index + 1, {
        to: recipient,
        from: configuration.from,
        subject: "Simple Comment Notification",
        text: message,
      })
    })
  })

  it("initializes the client without sending email during construction", () => {
    new SendGridNotificationService(configuration, mailService)

    expect(setApiKey).toHaveBeenCalledTimes(1)
    expect(setApiKey).toHaveBeenCalledWith(configuration.apiKey)
    expect(send).not.toHaveBeenCalled()
    expect(sendGridMail.setApiKey).not.toHaveBeenCalled()
    expect(sendGridMail.send).not.toHaveBeenCalled()
  })
})
