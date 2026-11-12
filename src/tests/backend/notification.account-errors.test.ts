import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import type { ClientResponse, MailService } from "@sendgrid/mail"
import { MongoClient } from "mongodb"
import type { Db } from "mongodb"
import { inspect } from "node:util"
import { SendGridNotificationService } from "../../lib/SendGridNotificationService"
import { MongodbService } from "../../lib/MongodbService"
import type {
  Comment,
  Discussion,
  Error,
  Success,
  User,
} from "../../lib/simple-comment-types"

declare const global: { __MONGO_URI__: string; __MONGO_DB_NAME__: string }

type SendResponse = [ClientResponse, object]
const originalEnv = process.env
const recipients = [
  "first-moderator@example.com",
  "second-moderator@example.com",
]
const privateDetails = [
  "synthetic-private-api-key",
  "synthetic-private-provider-data",
  "synthetic-private-password",
]
const authFailure = {
  name: "invalid or revoked credentials",
  statusCode: 401,
  message: "The provided authorization grant is invalid, expired, or revoked",
  explanation: "Notification provider authentication failed",
  action: "Check the API key and account.",
}
const permissionFailure = {
  name: "forbidden sending",
  statusCode: 403,
  message: "Access Forbidden",
  explanation: "Notification provider refused sending",
  action: "Check permissions, sender verification, and account status.",
}
const allowanceFailure = {
  name: "exhausted sending allowance",
  statusCode: 401,
  message: "Maximum credits exceeded",
  explanation: "Notification provider sending allowance exhausted",
  action: "Check usage limits and billing.",
}

// Representative Web API messages documented by the provider:
// https://help.twilio.com/articles/47452217511195
// https://www.twilio.com/en-us/blog/developers/community/alert-system-twilio-sendgrid-nodejs
const accountFailures = [
  authFailure,
  {
    ...permissionFailure,
    name: "authenticated user without permission",
    statusCode: 401,
    message: "Authenticated user is not authorized",
  },
  permissionFailure,
  {
    ...permissionFailure,
    name: "unverified sender identity",
    message: "The from address does not match a verified Sender Identity",
  },
  allowanceFailure,
]
type AccountFailure = (typeof accountFailures)[number]

const accepted: SendResponse = [
  { statusCode: 202, body: {}, headers: undefined },
  {},
]
const responseBody = (message: string) => ({
  errors: [{ message, field: null, help: null }],
  diagnostic: privateDetails[1],
})
const responseFor = (statusCode: number, body: unknown): SendResponse => [
  {
    statusCode,
    // Exercise missing/malformed runtime payloads despite the SDK's object type.
    body: body as ClientResponse["body"],
    headers: { "x-private-diagnostic": privateDetails[1] },
  },
  {},
]
const rejectionFor = (statusCode: number, body: unknown) =>
  Object.assign(new globalThis.Error("Provider request failed"), {
    code: statusCode,
    response: { body, headers: { "x-private-diagnostic": privateDetails[1] } },
    config: {
      headers: { Authorization: `Bearer ${privateDetails[0]}` },
      password: privateDetails[2],
    },
  })

const deferredSend = () => {
  let resolve!: (response: SendResponse) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<SendResponse>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe("notification provider account errors", () => {
  let send: jest.MockedFunction<MailService["send"]>
  let mail: MailService
  let service: SendGridNotificationService
  let errorLog: jest.SpiedFunction<typeof console.error>

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SENDGRID_VERIFIED_SENDER: "sender@example.com",
    }
    send = jest.fn<MailService["send"]>().mockResolvedValue(accepted)
    mail = {
      send,
      setApiKey: jest.fn<MailService["setApiKey"]>(),
    } as unknown as MailService
    service = new SendGridNotificationService(
      mail,
      "SG.synthetic-key",
      recipients
    )
    errorLog = jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = originalEnv
  })

  const expectNoPrivateDetails = (value: unknown) => {
    const text = inspect(value, { depth: null })
    const sensitiveValues = [
      ...privateDetails,
      ...recipients,
      "SG.synthetic-key",
    ]
    sensitiveValues.forEach(detail => expect(text).not.toContain(detail))
  }

  describe.each(["response", "rejection"] as const)(
    "provider reports a %s",
    delivery => {
      describe.each([0, 1])("with %i accepted recipients", acceptedCount => {
        it.each(accountFailures)(
          "explains $name with safe wording and counts",
          async failure => {
            if (acceptedCount === 1) send.mockResolvedValueOnce(accepted)
            const body = responseBody(failure.message)
            if (delivery === "response")
              send.mockResolvedValue(responseFor(failure.statusCode, body))
            else send.mockRejectedValue(rejectionFor(failure.statusCode, body))

            const result = await service.notifyModerators(
              "Synthetic comment notification"
            )

            expect(result).toEqual({
              statusCode: 502,
              body: `${failure.explanation}: ${acceptedCount} accepted, ${2 - acceptedCount} failed. ${failure.action}`,
            })
            expect(send).toHaveBeenCalledTimes(2)
            expectNoPrivateDetails(result)
            expectNoPrivateDetails(errorLog.mock.calls)
          }
        )
      })

      it.each([
        {
          name: "unknown authorization response",
          statusCode: 401,
          body: responseBody("Unrecognized authorization rejection"),
        },
        {
          name: "unrecognized payment response",
          statusCode: 402,
          body: responseBody("Payment Required"),
        },
        { name: "missing error body", statusCode: 401, body: undefined },
        {
          name: "malformed errors list",
          statusCode: 401,
          body: { errors: allowanceFailure.message },
        },
        {
          name: "non-string provider message",
          statusCode: 401,
          body: { errors: [{ message: { private: privateDetails[1] } }] },
        },
        {
          name: "allowance wording with an unrelated status",
          statusCode: 400,
          body: responseBody(allowanceFailure.message),
        },
      ])(
        "keeps $name generic without guessing an account diagnosis",
        async ({ statusCode, body }) => {
          if (delivery === "response")
            send.mockResolvedValue(responseFor(statusCode, body))
          else send.mockRejectedValue(rejectionFor(statusCode, body))

          const result = await service.notifyModerators(
            "Synthetic comment notification"
          )

          expect(result).toEqual({
            statusCode: 502,
            body: "Notification failed: 0 accepted, 2 failed.",
          })
          expectNoPrivateDetails(result)
          expectNoPrivateDetails(errorLog.mock.calls)
        }
      )
    }
  )

  it("distinguishes credential and allowance failures sharing provider status 401", async () => {
    send.mockRejectedValue(rejectionFor(401, responseBody(authFailure.message)))
    const credentialResult = await service.notifyModerators(
      "Synthetic comment notification"
    )
    send.mockRejectedValue(
      rejectionFor(401, responseBody(allowanceFailure.message))
    )
    const allowanceResult = await service.notifyModerators(
      "Synthetic comment notification"
    )

    expect(credentialResult.statusCode).toBe(502)
    expect(allowanceResult.statusCode).toBe(502)
    expect(credentialResult.body).toContain(authFailure.action)
    expect(allowanceResult.body).toContain(allowanceFailure.action)
    expect(allowanceResult.body).not.toBe(credentialResult.body)
  })

  it("waits for mixed account failures and reports both explanations independently of completion order", async () => {
    const runWithOrder = async (firstRecipient: number) => {
      const sends = [deferredSend(), deferredSend()]
      send
        .mockReturnValueOnce(sends[0].promise)
        .mockReturnValueOnce(sends[1].promise)
        .mockResolvedValueOnce(accepted)
      const multiRecipientService = new SendGridNotificationService(
        mail,
        "SG.synthetic-key",
        [...recipients, "third-moderator@example.com"]
      )
      let finished = false
      const completion = multiRecipientService
        .notifyModerators("Synthetic comment notification")
        .then(result => {
          finished = true
          return result
        })
      const failures = [authFailure, allowanceFailure]
      const rejectRecipient = (index: number) =>
        sends[index].reject(
          rejectionFor(401, responseBody(failures[index].message))
        )

      rejectRecipient(firstRecipient)
      await new Promise<void>(resolve => setImmediate(resolve))
      const finishedBeforeLast = finished
      rejectRecipient(1 - firstRecipient)
      const result = await completion

      return { result, finishedBeforeLast }
    }

    const firstOrder = await runWithOrder(0)
    const reverseOrder = await runWithOrder(1)

    const completionOrders = [firstOrder, reverseOrder]
    completionOrders.forEach(({ result, finishedBeforeLast }) => {
      expect(finishedBeforeLast).toBe(false)
      expect(result.statusCode).toBe(502)
      expect(result.body).toContain("1 accepted, 2 failed")
      expect(result.body).toContain(authFailure.action)
      expect(result.body).toContain(allowanceFailure.action)
      expectNoPrivateDetails(result)
    })
    expect(reverseOrder.result).toEqual(firstOrder.result)
  })

  describe("saved-comment diagnostics", () => {
    const databaseName = `${global.__MONGO_DB_NAME__}-notify-accounts`
    const author: User = {
      id: "account-error-author",
      name: "Account Error Author",
      email: "author@example.com",
    }
    const topic: Discussion = {
      id: "account-error-topic",
      title: "Provider account diagnostics",
      isLocked: false,
      dateCreated: new Date("2026-01-01T00:00:00Z"),
    }
    const commentText = "A saved comment with a provider account failure"
    let client: MongoClient
    let db: Db

    beforeAll(async () => {
      client = await MongoClient.connect(global.__MONGO_URI__)
      db = client.db(databaseName)
    })

    beforeEach(async () => {
      await db.collection("users").deleteMany({})
      await db.collection("comments").deleteMany({})
      await db.collection<User>("users").insertOne({ ...author })
      await db.collection<Discussion>("comments").insertOne({ ...topic })
    })

    afterAll(async () => {
      try {
        await db.dropDatabase()
      } finally {
        await client.close()
      }
    })

    it.each([authFailure, permissionFailure, allowanceFailure])(
      "logs safe operator guidance for $name while preserving the saved comment and 201",
      async (failure: AccountFailure) => {
        send.mockRejectedValue(
          rejectionFor(failure.statusCode, responseBody(failure.message))
        )
        const dbService = new MongodbService(
          global.__MONGO_URI__,
          databaseName,
          service
        )
        jest.spyOn(dbService, "getDb").mockResolvedValue(db)

        const result: Success<Comment> | Error = await dbService.commentPOST(
          topic.id,
          commentText,
          author.id
        )

        expect(result.statusCode).toBe(201)
        expect(result.body).toMatchObject({
          text: commentText,
          parentId: topic.id,
          userId: author.id,
        })
        expect(
          await db.collection("comments").countDocuments({ text: commentText })
        ).toBe(1)
        expect(send).toHaveBeenCalledTimes(2)
        const diagnostic = inspect(errorLog.mock.calls, { depth: null })
        expect(diagnostic).toContain(failure.explanation)
        expect(diagnostic).toContain(failure.action)
        expectNoPrivateDetails(errorLog.mock.calls)
        expect(diagnostic).not.toContain(failure.message)
        expect(diagnostic).not.toContain(author.email)
        expect(diagnostic).not.toContain(commentText)
      }
    )
  })
})
