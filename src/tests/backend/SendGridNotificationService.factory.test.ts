import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import type { ClientResponse } from "@sendgrid/mail"
import sendGridMail from "@sendgrid/mail"
import { SendGridNotificationService } from "../../lib/SendGridNotificationService"

jest.mock("dotenv", () => ({ config: jest.fn() }))
jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}))

const apiKey = "SG.synthetic-factory-key"
const sender = "factory-sender@example.com"
const recipient = "factory-moderator@example.com"
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

describe("SendGrid temporary construction factory", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: "production" }
    notificationEnvironmentKeys.forEach(key => delete process.env[key])
    Object.assign(process.env, {
      SENDGRID_API_KEY: apiKey,
      SENDGRID_VERIFIED_SENDER: sender,
      SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL: recipient,
    })
    jest.mocked(sendGridMail.send).mockResolvedValue(accepted)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it.each(["SENDGRID_API_KEY", "NOTIFICATION_SERVICE_API_KEY"])(
    "constructs from environment configuration using %s",
    async keyName => {
      delete process.env.SENDGRID_API_KEY
      process.env[keyName] = apiKey

      const service = SendGridNotificationService.createNotificationService()

      expect(service).toBeInstanceOf(SendGridNotificationService)
      expect(sendGridMail.setApiKey).toHaveBeenCalledTimes(1)
      expect(sendGridMail.setApiKey).toHaveBeenCalledWith(apiKey)
      expect(sendGridMail.send).not.toHaveBeenCalled()

      const result = await service?.notifyModerators("Factory notification")

      expect(result?.statusCode).toBe(202)
      expect(sendGridMail.send).toHaveBeenCalledWith({
        to: recipient,
        from: sender,
        subject: "Simple Comment Notification",
        text: "Factory notification",
      })
    }
  )

  it.each(["", undefined])(
    "rejects empty or absent moderator recipients before initializing a client (%s)",
    value => {
      if (value === undefined) {
        delete process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL
      } else {
        process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL = value
      }

      expect(() =>
        SendGridNotificationService.createNotificationService()
      ).toThrow("SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL")
      expect(sendGridMail.setApiKey).not.toHaveBeenCalled()
      expect(sendGridMail.send).not.toHaveBeenCalled()
    }
  )

  it("sends to comma-separated moderator addresses after trimming and ignoring empty entries", async () => {
    const recipients = Array.from(
      { length: 10 },
      (_, index) => `moderator${index + 1}@example.com`
    )
    process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL = ` , ${recipients.join(" , ")},, `

    const service = SendGridNotificationService.createNotificationService()
    const result = await service?.notifyModerators("Factory notification")

    expect(result?.statusCode).toBe(202)
    expect(sendGridMail.send).toHaveBeenCalledTimes(recipients.length)
    recipients.forEach(to => {
      expect(sendGridMail.send).toHaveBeenCalledWith({
        to,
        from: sender,
        subject: "Simple Comment Notification",
        text: "Factory notification",
      })
    })
  })

  it("returns undefined without initializing a client when provider settings are absent", () => {
    delete process.env.SENDGRID_API_KEY
    delete process.env.SENDGRID_VERIFIED_SENDER

    expect(
      SendGridNotificationService.createNotificationService()
    ).toBeUndefined()
    expect(sendGridMail.setApiKey).not.toHaveBeenCalled()
    expect(sendGridMail.send).not.toHaveBeenCalled()
  })
})
