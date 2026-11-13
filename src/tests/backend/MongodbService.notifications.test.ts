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
import { Collection, MongoClient, ObjectId } from "mongodb"
import type { Db, Document, InsertOneResult } from "mongodb"
import { inspect } from "node:util"
import type { AbstractNotificationService } from "../../lib/AbstractNotificationService"
import { MongodbService } from "../../lib/MongodbService"
import * as policyEnforcement from "../../lib/policyEnforcement"
import type {
  Comment,
  Discussion,
  Error,
  Success,
  User,
} from "../../lib/simple-comment-types"
import policy from "../../policy.json"

declare const global: { __MONGO_URI__: string; __MONGO_DB_NAME__: string }

const author: User = {
  id: "notification-author",
  name: "Notification Author",
  email: "author@example.com",
  isAdmin: false,
}
const topic: Discussion = {
  id: "notification-topic",
  title: "Notification lifecycle",
  isLocked: false,
  dateCreated: new Date("2026-01-01T00:00:00Z"),
}
const commentText = "A comment that should notify moderators"
const notificationAccepted: Success = {
  statusCode: 202,
  body: "Notification accepted",
}
const databaseName = `${global.__MONGO_DB_NAME__}-notification-lifecycle`

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe("commentPOST notification lifecycle", () => {
  let client: MongoClient
  let db: Db
  let service: MongodbService
  let notifyModerators: jest.MockedFunction<
    AbstractNotificationService["notifyModerators"]
  >
  let errorLog: jest.SpiedFunction<typeof console.error>

  beforeAll(async () => {
    client = await MongoClient.connect(global.__MONGO_URI__)
    // Keep these deterministic fixtures separate from other Mongo test suites.
    db = client.db(databaseName)
  })

  beforeEach(async () => {
    await db.collection("users").deleteMany({})
    await db.collection("comments").deleteMany({})
    await db.collection<User>("users").insertOne({ ...author })
    await db.collection<Discussion>("comments").insertOne({ ...topic })

    notifyModerators =
      jest.fn<AbstractNotificationService["notifyModerators"]>()
    notifyModerators.mockReturnValue(Promise.resolve(notificationAccepted))
    service = new MongodbService(global.__MONGO_URI__, databaseName, {
      notifyModerators,
    })
    // Exercise real persistence while sharing one connection across this suite.
    jest.spyOn(service, "getDb").mockResolvedValue(db)
    errorLog = jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  afterAll(async () => {
    await db.dropDatabase()
    await client.close()
  })

  const expectCreatedAndPersisted = async (
    response: Success<Comment> | Error
  ) => {
    expect(response.statusCode).toBe(201)
    expect(response.body).toMatchObject({
      text: commentText,
      parentId: topic.id,
      userId: author.id,
      user: { id: author.id, name: author.name },
    })
    const saved = await db
      .collection<Comment>("comments")
      .findOne({ text: commentText })
    expect(saved).toMatchObject({
      id: (response.body as Comment).id,
      text: commentText,
      parentId: topic.id,
      userId: author.id,
    })
    expect(
      await db.collection("comments").countDocuments({ text: commentText })
    ).toBe(1)
  }

  const expectSanitizedDiagnostic = (privateDetails: string[]) => {
    expect(errorLog).toHaveBeenCalled()
    // inspect also sees Error messages, stacks, nested objects, and circular values.
    const diagnostic = inspect(errorLog.mock.calls, { depth: null })
    expect(diagnostic).toMatch(/notif/i)
    privateDetails.forEach(detail => expect(diagnostic).not.toContain(detail))
  }

  const privateDetails = [
    "synthetic-api-key",
    "synthetic-password",
    "synthetic-provider-detail",
  ]
  const sensitiveProviderError = () =>
    Object.assign(new globalThis.Error(privateDetails[2]), {
      config: {
        headers: { Authorization: `Bearer ${privateDetails[0]}` },
        password: privateDetails[1],
      },
      response: { body: privateDetails[2] },
    })

  it("does not notify until insertion has been acknowledged", async () => {
    const entered = deferred<Document>()
    const insertion = deferred<InsertOneResult>()
    const insertSpy = jest
      .spyOn(Collection.prototype, "insertOne")
      .mockImplementationOnce(document => {
        entered.resolve(document)
        return insertion.promise
      })
    const request = service.commentPOST(topic.id, commentText, author.id)

    const document = await entered.promise
    const callsBeforeInsertion = notifyModerators.mock.calls.length
    const savedBeforeInsertion = await db
      .collection("comments")
      .countDocuments({ text: commentText })

    // Release the controlled insert through the real database before asserting.
    insertSpy.mockRestore()
    insertion.resolve(await db.collection("comments").insertOne(document))
    const response = await request

    expect(callsBeforeInsertion).toBe(0)
    expect(savedBeforeInsertion).toBe(0)
    await expectCreatedAndPersisted(response)
    expect(notifyModerators).toHaveBeenCalledTimes(1)
  })

  it.each(["accepted", "failed"] as const)(
    "persists before notifying and waits for a deferred %s result before returning 201",
    async outcome => {
      const entered = deferred<void>()
      const delivery = deferred<Success | Error>()
      notifyModerators.mockImplementation(() => {
        entered.resolve()
        return delivery.promise
      })
      let requestFinished = false
      const request = service
        .commentPOST(topic.id, commentText, author.id)
        .then(response => {
          requestFinished = true
          return response
        })

      await entered.promise
      const savedWhilePending = await db
        .collection("comments")
        .findOne({ text: commentText })
      await new Promise<void>(resolve => setImmediate(resolve))
      const finishedBeforeDelivery = requestFinished
      // Release the request before asserting, including when running against broken code.
      delivery.resolve(
        outcome === "accepted"
          ? notificationAccepted
          : { statusCode: 503, body: "Notification service unavailable" }
      )
      const response = await request

      expect(savedWhilePending).toMatchObject({
        text: commentText,
        userId: author.id,
      })
      await expectCreatedAndPersisted(response)
      expect(notifyModerators).toHaveBeenCalledTimes(1)
      expect(finishedBeforeDelivery).toBe(false)
      if (outcome === "accepted") expect(errorLog).not.toHaveBeenCalled()
      else expectSanitizedDiagnostic([])
    }
  )

  describe.each([false, true])("author isAdmin=%s", isAdmin => {
    beforeEach(async () => {
      await db
        .collection("users")
        .updateOne({ id: author.id }, { $set: { isAdmin } })
    })

    it.each([500, 502, 503, 504])(
      "preserves the saved comment and 201 response when notification returns %i",
      async statusCode => {
        notifyModerators.mockReturnValue(
          Promise.resolve({
            statusCode,
            body: privateDetails.join(" "),
          })
        )

        const response = await service.commentPOST(
          topic.id,
          commentText,
          author.id
        )

        await expectCreatedAndPersisted(response)
        expect(notifyModerators).toHaveBeenCalledTimes(1)
        expectSanitizedDiagnostic(privateDetails)
      }
    )

    it("handles rejected notification promises without changing the saved-comment response", async () => {
      const entered = deferred<void>()
      const delivery = deferred<Success | Error>()
      // Observe the fixture rejection to keep today's ignored promise from crashing
      // Jest. Awaiting and logging are independently required by assertions below.
      void delivery.promise.catch(() => {})
      notifyModerators.mockImplementation(() => {
        entered.resolve()
        return delivery.promise
      })
      let requestFinished = false
      const request = service
        .commentPOST(topic.id, commentText, author.id)
        .then(response => {
          requestFinished = true
          return response
        })

      await entered.promise
      await new Promise<void>(resolve => setImmediate(resolve))
      const finishedBeforeRejection = requestFinished
      delivery.reject(sensitiveProviderError())
      const response = await request
      // Let notification rejection handlers run even if the caller returned early.
      await new Promise<void>(resolve => setImmediate(resolve))

      await expectCreatedAndPersisted(response)
      expect(finishedBeforeRejection).toBe(false)
      expectSanitizedDiagnostic(privateDetails)
    })

    it("isolates a synchronous notification throw from database error handling", async () => {
      notifyModerators.mockImplementation(() => {
        throw sensitiveProviderError()
      })

      const response = await service.commentPOST(
        topic.id,
        commentText,
        author.id
      )

      await expectCreatedAndPersisted(response)
      expect(notifyModerators).toHaveBeenCalledTimes(1)
      expectSanitizedDiagnostic(privateDetails)
    })
  })

  it("saves a comment and returns 201 when notifications are disabled", async () => {
    const disabledService = new MongodbService(
      global.__MONGO_URI__,
      databaseName
    )
    jest.spyOn(disabledService, "getDb").mockResolvedValue(db)

    await expectCreatedAndPersisted(
      await disabledService.commentPOST(topic.id, commentText, author.id)
    )
    expect(notifyModerators).not.toHaveBeenCalled()
    expect(errorLog).not.toHaveBeenCalled()
  })

  it("preserves compatibility with a notification implementation returning void", async () => {
    notifyModerators.mockReturnValue(undefined)

    await expectCreatedAndPersisted(
      await service.commentPOST(topic.id, commentText, author.id)
    )
    expect(notifyModerators).toHaveBeenCalledTimes(1)
    expect(errorLog).not.toHaveBeenCalled()
  })

  it.each([
    {
      name: "missing authentication",
      parentId: topic.id,
      userId: undefined,
      text: commentText,
      statusCode: 401,
    },
    {
      name: "unknown author",
      parentId: topic.id,
      userId: "unknown-author",
      text: commentText,
      statusCode: 404,
    },
    {
      name: "missing parent",
      parentId: "missing-topic",
      userId: author.id,
      text: commentText,
      statusCode: 404,
    },
    {
      name: "oversized comment",
      parentId: topic.id,
      userId: author.id,
      text: "x".repeat(policy.maxCommentLengthChars + 1),
      statusCode: 413,
    },
  ])(
    "does not notify after $name",
    async ({ parentId, userId, text, statusCode }) => {
      const response = await service.commentPOST(parentId, text, userId)

      expect(response.statusCode).toBe(statusCode)
      expect(notifyModerators).not.toHaveBeenCalled()
      expect(
        await db.collection("comments").countDocuments({ userId: author.id })
      ).toBe(0)
    }
  )

  it("does not notify when posting is forbidden by policy", async () => {
    jest
      .spyOn(policyEnforcement, "isUserAllowedTo")
      .mockReturnValueOnce("Posting forbidden by test policy")

    const response = await service.commentPOST(topic.id, commentText, author.id)

    expect(response.statusCode).toBe(403)
    expect(notifyModerators).not.toHaveBeenCalled()
    expect(
      await db.collection("comments").countDocuments({ text: commentText })
    ).toBe(0)
  })

  it("does not notify when the parent has been deleted", async () => {
    await db
      .collection("comments")
      .updateOne({ id: topic.id }, { $set: { dateDeleted: new Date() } })

    const response = await service.commentPOST(topic.id, commentText, author.id)

    expect(response.statusCode).toBe(404)
    expect(notifyModerators).not.toHaveBeenCalled()
    expect(
      await db.collection("comments").countDocuments({ text: commentText })
    ).toBe(0)
  })

  it("does not notify again when a comment is rejected as a duplicate", async () => {
    await service.commentPOST(topic.id, commentText, author.id)
    notifyModerators.mockClear()

    const response = await service.commentPOST(topic.id, commentText, author.id)

    expect(response.statusCode).toBe(409)
    expect(notifyModerators).not.toHaveBeenCalled()
    expect(
      await db.collection("comments").countDocuments({ text: commentText })
    ).toBe(1)
  })

  it("does not notify when insertion is unacknowledged", async () => {
    jest.spyOn(Collection.prototype, "insertOne").mockResolvedValueOnce({
      acknowledged: false,
      insertedId: new ObjectId(),
    })

    const response = await service.commentPOST(topic.id, commentText, author.id)

    expect(response.statusCode).toBe(500)
    expect(notifyModerators).not.toHaveBeenCalled()
    expect(
      await db.collection("comments").countDocuments({ text: commentText })
    ).toBe(0)
  })

  it("does not notify when insertion throws", async () => {
    jest
      .spyOn(Collection.prototype, "insertOne")
      .mockRejectedValueOnce(
        new globalThis.Error("Synthetic insertion failure")
      )

    const response = await service.commentPOST(topic.id, commentText, author.id)

    expect(response.statusCode).toBe(500)
    expect(notifyModerators).not.toHaveBeenCalled()
    expect(
      await db.collection("comments").countDocuments({ text: commentText })
    ).toBe(0)
  })
})
