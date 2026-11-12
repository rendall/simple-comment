import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import { SendGridNotificationService } from "../../lib/SendGridNotificationService"
import type { ClientResponse, MailService } from "@sendgrid/mail"
import type { Error, Success } from "../../lib/simple-comment-types"

jest.mock("dotenv", () => ({
  config: jest.fn(() => {
    process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL =
      "email1@example.com,email2@example.com,email3@example.com,email4@example.com,email5@example.com,email6@example.com,email7@example.com,email8@example.com,email9@example.com,email10@example.com"
    process.env.SENDGRID_VERIFIED_SENDER = "email@example.com"
    process.env.NOTIFICATION_SERVICE_API_KEY = "SG.from.test.env"
  }),
}))

describe("SendGridNotificationService", () => {
  let sendGridNotificationService: SendGridNotificationService
  let mailServiceMock: jest.Mocked<MailService>

  const moderatorContactEmails = ["a1@example,com", "test2@example.com"]
  const sendGridTestApiKey = "SG.test"

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
    jest.resetModules()
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
      body: { error: "send failed" },
      headers: undefined,
    }

    mailServiceMock.send.mockResolvedValue([mockErrorResponse, {}])

    const result = await sendGridNotificationService.notifyModerators(body)

    expect(mailServiceMock.setApiKey).toHaveBeenCalledWith(sendGridTestApiKey)
    expect(mailServiceMock.send).toHaveBeenCalledTimes(
      moderatorContactEmails.length
    )
    expect(mailServiceMock.send).toHaveBeenNthCalledWith(1, {
      to: moderatorContactEmails[0],
      from: "email@example.com",
      subject: "Simple Comment Notification",
      text: body,
    })
    expect(result).toEqual({
      statusCode: mockErrorResponse.statusCode,
      body: JSON.stringify(mockErrorResponse.body),
    })
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
    const previousModeratorEmails =
      process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL
    delete process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL

    expect(
      () =>
        new SendGridNotificationService(
          mailServiceMock,
          sendGridTestApiKey,
          undefined
        )
    ).toThrowError(
      "SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL is not set in environmental variables"
    )

    if (previousModeratorEmails === undefined)
      delete process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL
    else
      process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL =
        previousModeratorEmails
  })

  it("should allow moderator contact email override when env value is missing", () => {
    const previousModeratorEmails =
      process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL
    delete process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL

    expect(
      () =>
        new SendGridNotificationService(
          mailServiceMock,
          sendGridTestApiKey,
          moderatorContactEmails
        )
    ).not.toThrow()

    if (previousModeratorEmails === undefined)
      delete process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL
    else
      process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL =
        previousModeratorEmails
  })

  it("should allow API key override when env API key is missing", () => {
    const previousApiKey = process.env.NOTIFICATION_SERVICE_API_KEY
    delete process.env.NOTIFICATION_SERVICE_API_KEY

    expect(
      () =>
        new SendGridNotificationService(
          mailServiceMock,
          sendGridTestApiKey,
          moderatorContactEmails
        )
    ).not.toThrow()
    expect(mailServiceMock.setApiKey).toHaveBeenCalledWith(sendGridTestApiKey)

    if (previousApiKey === undefined)
      delete process.env.NOTIFICATION_SERVICE_API_KEY
    else process.env.NOTIFICATION_SERVICE_API_KEY = previousApiKey
  })

  it("should send notification to moderators", async () => {
    const body = "Test message"
    const clientResponse: ClientResponse = {
      statusCode: 202,
      body: {},
      headers: undefined,
    }
    const mockResponse: [ClientResponse, object] = [clientResponse, {}]

    mailServiceMock.send.mockResolvedValue(mockResponse)

    const result = await sendGridNotificationService.notifyModerators(body)

    expect(mailServiceMock.setApiKey).toHaveBeenCalledWith(sendGridTestApiKey)
    expect(mailServiceMock.send).toHaveBeenCalledTimes(
      moderatorContactEmails.length
    )
    expect(mailServiceMock.send).toHaveBeenNthCalledWith(1, {
      to: moderatorContactEmails[0],
      from: "email@example.com",
      subject: "Simple Comment Notification",
      text: body,
    })
    expect(mailServiceMock.send).toHaveBeenNthCalledWith(2, {
      to: moderatorContactEmails[1],
      from: "email@example.com",
      subject: "Simple Comment Notification",
      text: body,
    })
    expect(result.statusCode).toEqual(202)
  })

  it("should send mulitple emails given comma-separated SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL", async () => {
    const body = "Test message"
    const clientResponse: ClientResponse = {
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

  describe("recipient completion regression (#233)", () => {
    type SendResponse = [ClientResponse, object]
    type SendOutcome = "accepted" | "bad-request" | "server-error" | "rejected"

    const outcomes: SendOutcome[] = [
      "accepted",
      "bad-request",
      "server-error",
      "rejected",
    ]

    const deferredSend = () => {
      let resolve!: (response: SendResponse) => void
      let reject!: (error: globalThis.Error) => void
      const promise = new Promise<SendResponse>((res, rej) => {
        resolve = res
        reject = rej
      })
      return { promise, resolve, reject }
    }

    const settleSend = (
      send: ReturnType<typeof deferredSend>,
      outcome: SendOutcome
    ) => {
      if (outcome === "rejected") {
        send.reject(new globalThis.Error("SendGrid request failed"))
      } else {
        send.resolve([
          {
            statusCode:
              outcome === "accepted"
                ? 202
                : outcome === "bad-request"
                  ? 400
                  : 500,
            body: outcome === "accepted" ? {} : { error: outcome },
            headers: undefined,
          },
          {},
        ])
      }
    }

    const observeCompletion = (operation: Promise<Success | Error>) => {
      let settled = false
      // Observe rejection immediately, including an incorrectly early rejection.
      const completion = operation.then(
        result => {
          settled = true
          return { kind: "fulfilled" as const, result }
        },
        (error: unknown) => {
          settled = true
          return { kind: "rejected" as const, error }
        }
      )
      return { completion, isSettled: () => settled }
    }

    const expectResult = (
      outcome: Awaited<ReturnType<typeof observeCompletion>["completion"]>,
      allAccepted: boolean
    ) => {
      expect(outcome.kind).toBe("fulfilled")
      if (outcome.kind === "fulfilled") {
        if (allAccepted) {
          expect(outcome.result.statusCode).toBe(202)
        } else {
          // Use the existing Error contract; aggregate wording is still undecided.
          expect(outcome.result.statusCode).toBeGreaterThanOrEqual(400)
          expect(outcome.result.statusCode).toBeLessThan(600)
          expect(outcome.result.body).toEqual(expect.any(String))
          expect(outcome.result.body.trim()).not.toBe("")
        }
      }
    }

    // Drain promise continuations without depending on an arbitrary sleep duration.
    const nextTurn = () => new Promise<void>(resolve => setImmediate(resolve))

    const scenarios = outcomes.flatMap(first =>
      outcomes.map(second => ({ first, second }))
    )

    describe.each([0, 1])("recipient %i settles first", firstRecipient => {
      it.each(scenarios)(
        "waits for every send and combines $first / $second",
        async ({ first, second }) => {
          const sends = [deferredSend(), deferredSend()]
          mailServiceMock.send
            .mockReturnValueOnce(sends[0].promise)
            .mockReturnValueOnce(sends[1].promise)

          const observed = observeCompletion(
            sendGridNotificationService.notifyModerators("Test message")
          )
          const startedBeforeFirstCompletion =
            mailServiceMock.send.mock.calls.length

          settleSend(sends[firstRecipient], first)
          await nextTurn()
          const settledBeforeLastRecipient = observed.isSettled()

          // Settle every send before assertions so failures leave no pending work.
          settleSend(sends[1 - firstRecipient], second)
          const outcome = await observed.completion

          expect(startedBeforeFirstCompletion).toBe(2)
          expect(mailServiceMock.send).toHaveBeenCalledTimes(2)
          moderatorContactEmails.forEach(email => {
            expect(mailServiceMock.send).toHaveBeenCalledWith({
              to: email,
              from: "email@example.com",
              subject: "Simple Comment Notification",
              text: "Test message",
            })
          })
          expectResult(outcome, first === "accepted" && second === "accepted")
          expect(settledBeforeLastRecipient).toBe(false)
        }
      )
    })

    it.each(outcomes)(
      "handles one recipient with outcome %s",
      async outcome => {
        const send = deferredSend()
        mailServiceMock.send.mockReturnValueOnce(send.promise)
        const service = new SendGridNotificationService(
          mailServiceMock,
          sendGridTestApiKey,
          [moderatorContactEmails[0]]
        )
        const observed = observeCompletion(
          service.notifyModerators("Test message")
        )
        await nextTurn()
        const settledBeforeSend = observed.isSettled()

        settleSend(send, outcome)
        const result = await observed.completion

        expect(mailServiceMock.send).toHaveBeenCalledTimes(1)
        expect(settledBeforeSend).toBe(false)
        expectResult(result, outcome === "accepted")
      }
    )

    it.each(outcomes)(
      "waits for a third recipient whose outcome is %s",
      async lastOutcome => {
        const sends = [deferredSend(), deferredSend(), deferredSend()]
        sends.forEach(send =>
          mailServiceMock.send.mockReturnValueOnce(send.promise)
        )
        const service = new SendGridNotificationService(
          mailServiceMock,
          sendGridTestApiKey,
          [...moderatorContactEmails, "third@example.com"]
        )
        const observed = observeCompletion(
          service.notifyModerators("Test message")
        )

        settleSend(sends[1], "accepted")
        await nextTurn()
        const settledAfterFirst = observed.isSettled()
        settleSend(sends[0], "accepted")
        await nextTurn()
        const settledAfterSecond = observed.isSettled()
        settleSend(sends[2], lastOutcome)
        const result = await observed.completion

        expect(mailServiceMock.send).toHaveBeenCalledTimes(3)
        expectResult(result, lastOutcome === "accepted")
        expect(settledAfterFirst).toBe(false)
        expect(settledAfterSecond).toBe(false)
      }
    )

    it.each([0, 1])(
      "still attempts and awaits other recipients when send %i throws synchronously",
      async throwingRecipient => {
        const pendingSend = deferredSend()
        const throwOnSend = () => {
          throw new globalThis.Error("SendGrid send threw synchronously")
        }
        if (throwingRecipient === 0) {
          mailServiceMock.send
            .mockImplementationOnce(throwOnSend)
            .mockReturnValueOnce(pendingSend.promise)
        } else {
          mailServiceMock.send
            .mockReturnValueOnce(pendingSend.promise)
            .mockImplementationOnce(throwOnSend)
        }
        const observed = observeCompletion(
          sendGridNotificationService.notifyModerators("Test message")
        )
        await nextTurn()
        const settledBeforeOtherRecipient = observed.isSettled()
        settleSend(pendingSend, "accepted")
        const result = await observed.completion

        expect(mailServiceMock.send).toHaveBeenCalledTimes(2)
        expectResult(result, false)
        expect(settledBeforeOtherRecipient).toBe(false)
      }
    )

    it("reports the same failures independently of completion order", async () => {
      const runWithOrder = async (firstRecipient: number) => {
        const sends = [deferredSend(), deferredSend()]
        mailServiceMock.send
          .mockReturnValueOnce(sends[0].promise)
          .mockReturnValueOnce(sends[1].promise)
        const observed = observeCompletion(
          sendGridNotificationService.notifyModerators("Test message")
        )
        const recipientOutcomes: SendOutcome[] = ["bad-request", "server-error"]
        settleSend(sends[firstRecipient], recipientOutcomes[firstRecipient])
        await nextTurn()
        settleSend(
          sends[1 - firstRecipient],
          recipientOutcomes[1 - firstRecipient]
        )
        return observed.completion
      }

      const firstOrder = await runWithOrder(0)
      const reverseOrder = await runWithOrder(1)

      expectResult(firstOrder, false)
      expectResult(reverseOrder, false)
      expect(reverseOrder).toEqual(firstOrder)
    })
  })
})
