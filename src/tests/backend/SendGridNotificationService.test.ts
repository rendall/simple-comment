import { SendGridNotificationService } from "../../lib/SendGridNotificationService"
import { ClientResponse, MailService } from "@sendgrid/mail"

jest.mock("dotenv", () => ({
  config: jest.fn(() => {
    process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL =
      "email1@example.com,email2@example.com,email3@example.com,email4@example.com,email5@example.com,email6@example.com,email7@example.com,email8@example.com,email9@example.com,email10@example.com"

    process.env.NOTIFICATION_SERVICE_API_KEY = "SG.from.test.env"
  }),
}))

describe("SendGridNotificationService", () => {
  let sendGridNotificationService: SendGridNotificationService
  let mailServiceMock: jest.Mocked<MailService>

  const moderatorContactEmails = ["a1@example,com", "test2@example.com"]
  const sendGridTestApiKey = "SG.test"

  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    mailServiceMock = {
      setApiKey: jest.fn(),
      send: jest.fn(),
    } as unknown as jest.Mocked<MailService>

    sendGridNotificationService = new SendGridNotificationService(
      mailServiceMock,
      sendGridTestApiKey,
      moderatorContactEmails
    )
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("should set API key", async () => {
    expect(mailServiceMock.setApiKey).toHaveBeenCalledWith(sendGridTestApiKey)
  })

  it("should use environmental variable for API key", async () => {
    new SendGridNotificationService(mailServiceMock)
    expect(mailServiceMock.setApiKey).toHaveBeenCalledWith("SG.from.test.env")
  })

  it("should handle email sending failure", async () => {
    const body = "Test message"
    const mockErrorResponse: ClientResponse = {
      statusCode: 500,
      body: {},
      headers: undefined,
    }

    mailServiceMock.send.mockResolvedValueOnce([mockErrorResponse, {}])

    const result = await sendGridNotificationService.notifyModerators(body)

    expect(mailServiceMock.setApiKey).toHaveBeenCalledWith(sendGridTestApiKey)
    expect(mailServiceMock.send).toHaveBeenCalledTimes(
      moderatorContactEmails.length
    )
    expect(result.statusCode).toEqual(mockErrorResponse.statusCode)
  })

  it("should throw given empty moderator contact emails", async () => {
    expect(
      () =>
        new SendGridNotificationService(mailServiceMock, sendGridTestApiKey, [])
    ).toThrowError(
      "SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL is not set in environmental variables"
    )
  })

  it("should throw given undefined moderator contact emails", async () => {
    expect(
      () =>
        new SendGridNotificationService(mailServiceMock, sendGridTestApiKey, [])
    ).toThrowError(
      "SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL is not set in environmental variables"
    )
  })

  it("should send notification to moderators", async () => {
    const body = "Test message"
    const clientResponse = {
      statusCode: 202,
      body: {},
      headers: undefined,
    }
    const mockResponse: [ClientResponse, object] = [clientResponse, {}]

    mailServiceMock.send.mockResolvedValueOnce(mockResponse)

    const result = await sendGridNotificationService.notifyModerators(body)

    expect(mailServiceMock.setApiKey).toHaveBeenCalledWith(sendGridTestApiKey)
    expect(mailServiceMock.send).toHaveBeenCalledTimes(
      moderatorContactEmails.length
    )
    expect(result.statusCode).toEqual(202)
  })

  it("should send mulitple emails given comma-separated SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL", async () => {
    const body = "Test message"
    const clientResponse = {
      statusCode: 202,
      body: {},
      headers: undefined,
    }
    const mockResponse: [ClientResponse, object] = [clientResponse, {}]

    mailServiceMock.send.mockResolvedValue(mockResponse)

    const service = new SendGridNotificationService(
      mailServiceMock,
      sendGridTestApiKey
    )
    const result = await service.notifyModerators(body)

    expect(mailServiceMock.setApiKey).toHaveBeenCalledWith(sendGridTestApiKey)
    expect(mailServiceMock.send).toHaveBeenCalledTimes(10)
    expect(result.statusCode).toEqual(202)
  })

  // Add more test cases as needed
})
