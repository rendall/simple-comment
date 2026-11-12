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
import type { APIGatewayEvent } from "aws-lambda"
import type { ClientResponse, MailService } from "@sendgrid/mail"
import { Collection, MongoClient, ObjectId } from "mongodb"
import type { Db } from "mongodb"
import * as jwt from "jsonwebtoken"
import type { Comment, Discussion, User } from "../../lib/simple-comment-types"
import policy from "../../policy.json"

declare const global: { __MONGO_URI__: string; __MONGO_DB_NAME__: string }

type Handler = (typeof import("../../functions/comment"))["handler"]
type SendResponse = [ClientResponse, object]
const originalEnv = process.env
const actualMongo = jest.requireActual<typeof import("mongodb")>("mongodb")
const connect = MongoClient.connect.bind(MongoClient)
const databaseName = `${global.__MONGO_DB_NAME__}-comment-wiring`
const origin = "https://notifications.example.com"
const apiKey = "SG.synthetic-notification-test-key"
const verifiedSender = "sender@example.com"
const recipient = "moderator@example.com"
const jwtSecret = "synthetic-comment-endpoint-jwt-secret"
const author: User = {
  id: "endpoint-notification-author",
  name: "Endpoint Author",
  email: "author@example.com",
  isAdmin: false,
}
const topic: Discussion = {
  id: "endpoint-notification-topic",
  title: "Endpoint notification wiring",
  isLocked: false,
  dateCreated: new Date("2026-01-01T00:00:00Z"),
}
const commentText = "A comment submitted through the real endpoint"
const accepted: SendResponse = [
  { statusCode: 202, body: {}, headers: undefined },
  {},
]
const tokenFor = (userId: string) =>
  jwt.sign({ user: userId }, jwtSecret, { expiresIn: "1h" })

const eventFor = (
  overrides: Partial<APIGatewayEvent> = {}
): APIGatewayEvent => ({
  resource: "/comment/{id}",
  path: `/.netlify/functions/comment/${topic.id}`,
  httpMethod: "POST",
  headers: { Authorization: `Bearer ${tokenFor(author.id)}`, Origin: origin },
  multiValueHeaders: {},
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  pathParameters: null,
  stageVariables: null,
  body: commentText,
  isBase64Encoded: false,
  requestContext: {
    accountId: "test",
    apiId: "test",
    authorizer: null,
    protocol: "HTTP/1.1",
    httpMethod: "POST",
    path: "/comment/{id}",
    stage: "test",
    requestId: "notification-test-request",
    requestTimeEpoch: 0,
    resourceId: "test",
    resourcePath: "/comment/{id}",
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      clientCert: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: "127.0.0.1",
      user: null,
      userAgent: "notification-test",
      userArn: null,
    },
  },
  ...overrides,
})

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(res => {
    resolve = res
  })
  return { promise, resolve }
}

describe("comment endpoint notification wiring", () => {
  let client: MongoClient
  let db: Db
  let endpointClients: MongoClient[]
  let send: jest.MockedFunction<MailService["send"]>
  let setApiKey: jest.MockedFunction<MailService["setApiKey"]>
  let errorLog: jest.SpiedFunction<typeof console.error>

  beforeAll(async () => {
    client = await connect(global.__MONGO_URI__)
    db = client.db(databaseName)
  })

  beforeEach(async () => {
    endpointClients = []
    await db.collection("users").deleteMany({})
    await db.collection("comments").deleteMany({})
    await db.collection<User>("users").insertOne({ ...author })
    await db.collection<Discussion>("comments").insertOne({ ...topic })
    process.env = {
      ...originalEnv,
      NODE_ENV: "production", // Prevent dotenv from loading developer settings.
      DB_CONNECTION_STRING: global.__MONGO_URI__,
      DATABASE_NAME: databaseName,
      JWT_SECRET: jwtSecret,
      ALLOW_ORIGIN: origin,
      SIMPLE_COMMENT_MODERATOR_ID: "endpoint-moderator",
      SIMPLE_COMMENT_MODERATOR_PASSWORD: "synthetic-moderator-password",
      SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL: recipient,
      NOTIFICATION_SERVICE_API_KEY: apiKey,
      SENDGRID_VERIFIED_SENDER: verifiedSender,
    }
    send = jest.fn<MailService["send"]>().mockResolvedValue(accepted)
    setApiKey = jest.fn<MailService["setApiKey"]>()
    const mail = { send, setApiKey }
    jest.resetModules()
    // Only the SendGrid SDK boundary is stubbed. The handler, DB service,
    // notification adapter, environment validation, and JWT verification are real.
    jest.doMock("@sendgrid/mail", () => ({
      ...mail,
      MailService: jest.fn(() => mail),
    }))
    // Keep one real MongoDB module identity while isolating application modules.
    jest.doMock("mongodb", () => actualMongo)
    jest
      .spyOn(MongoClient, "connect")
      .mockImplementation(async (url, options) => {
        const endpointClient = await connect(url, options)
        endpointClients.push(endpointClient)
        return endpointClient
      })
    errorLog = jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(async () => {
    try {
      await Promise.all(endpointClients.map(connection => connection.close()))
    } finally {
      jest.restoreAllMocks()
      jest.dontMock("@sendgrid/mail")
      jest.dontMock("mongodb")
      jest.resetModules()
      process.env = originalEnv
    }
  })

  afterAll(async () => {
    try {
      await db.dropDatabase()
    } finally {
      await client.close()
    }
  })

  const loadHandler = async (): Promise<Handler> => {
    let handler!: Handler
    await jest.isolateModulesAsync(async () => {
      handler = (await import("../../functions/comment")).handler
    })
    return handler
  }

  const expectSavedComment = async (
    response: Awaited<ReturnType<Handler>>,
    text = commentText
  ) => {
    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body as string) as Comment
    expect(body).toMatchObject({
      text,
      parentId: topic.id,
      userId: author.id,
      user: { id: author.id },
    })
    expect(
      await db.collection("comments").findOne({ id: body.id })
    ).toMatchObject({ text, userId: author.id })
    expect(await db.collection("comments").countDocuments({ text })).toBe(1)
    expect(response.headers).toMatchObject({
      "Access-Control-Allow-Origin": origin,
      "Content-Type": "application/json",
    })
  }

  const existingComment: Comment = {
    id: "existing-endpoint-comment",
    parentId: topic.id,
    userId: author.id,
    text: "An existing comment",
    dateCreated: new Date("2026-01-02T00:00:00Z"),
  }

  it("sends an email through the configured adapter after the endpoint saves a comment", async () => {
    let savedAtSend: Comment | null = null
    send.mockImplementation(async () => {
      savedAtSend = await db
        .collection<Comment>("comments")
        .findOne({ text: commentText })
      return accepted
    })
    const handler = await loadHandler()

    await expectSavedComment(await handler(eventFor()))

    expect(savedAtSend).toMatchObject({ text: commentText, userId: author.id })
    expect(setApiKey).toHaveBeenCalledWith(apiKey)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith({
      to: recipient,
      from: verifiedSender,
      subject: "Simple Comment Notification",
      text: `New comment posted by ${author.name} (${author.email})`,
    })
    expect(errorLog).not.toHaveBeenCalled()
  })

  it("supports comma-separated moderator addresses from environment configuration", async () => {
    const recipients = [recipient, "second@example.com", "third@example.com"]
    process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL = ` ${recipient}, second@example.com, , third@example.com `
    const handler = await loadHandler()

    await expectSavedComment(await handler(eventFor()))

    expect(send).toHaveBeenCalledTimes(3)
    recipients.forEach(to => {
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({ to, from: verifiedSender })
      )
    })
  })

  it("keeps notifications disabled when both SendGrid settings are absent", async () => {
    delete process.env.NOTIFICATION_SERVICE_API_KEY
    delete process.env.SENDGRID_VERIFIED_SENDER
    // The required moderator contact address alone must not enable SendGrid.
    const handler = await loadHandler()

    await expectSavedComment(await handler(eventFor()))

    expect(setApiKey).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
    expect(errorLog).not.toHaveBeenCalled()
  })

  it.each(["NOTIFICATION_SERVICE_API_KEY", "SENDGRID_VERIFIED_SENDER"])(
    "fails initialization with an actionable error when %s is missing",
    async missing => {
      delete process.env[missing]

      await expect(loadHandler()).rejects.toMatchObject({
        name: "EnvContractError",
        key: missing,
        message: expect.stringContaining(missing),
      })
      expect(setApiKey).not.toHaveBeenCalled()
      expect(send).not.toHaveBeenCalled()
    }
  )

  it("reuses the configured handler for successive successful submissions", async () => {
    const handler = await loadHandler()
    await expectSavedComment(await handler(eventFor()))
    const secondText = "Another comment through the same warm handler"

    await expectSavedComment(
      await handler(eventFor({ body: secondText })),
      secondText
    )

    expect(send).toHaveBeenCalledTimes(2)
    expect(
      await db.collection("comments").countDocuments({ userId: author.id })
    ).toBe(2)
  })

  it("awaits delivery through the real adapter before completing the endpoint request", async () => {
    const entered = deferred<void>()
    const delivery = deferred<SendResponse>()
    send.mockImplementation(() => {
      entered.resolve()
      return delivery.promise
    })
    const handler = await loadHandler()
    let finished = false
    const request = handler(eventFor()).then(response => {
      finished = true
      return response
    })

    // A missing connection must fail assertions rather than hang this regression test.
    await Promise.race([entered.promise, request.then(() => {})])
    await new Promise<void>(resolve => setImmediate(resolve))
    const finishedBeforeDelivery = finished
    delivery.resolve(accepted)
    const response = await request

    await expectSavedComment(response)
    expect(send).toHaveBeenCalledTimes(1)
    expect(finishedBeforeDelivery).toBe(false)
  })

  it.each(["non-success response", "rejected promise", "synchronous throw"])(
    "preserves the endpoint's 201 response when SendGrid reports a %s",
    async outcome => {
      if (outcome === "non-success response") {
        send.mockResolvedValue([
          {
            statusCode: 503,
            body: { error: "Synthetic provider detail" },
            headers: undefined,
          },
          {},
        ])
      } else if (outcome === "rejected promise") {
        send.mockRejectedValue(
          Object.assign(new globalThis.Error("Synthetic provider detail"), {
            code: 503,
          })
        )
      } else {
        send.mockImplementation(() => {
          throw new TypeError("Synthetic provider detail")
        })
      }
      const handler = await loadHandler()

      await expectSavedComment(await handler(eventFor()))

      expect(send).toHaveBeenCalledTimes(1)
      expect(errorLog).toHaveBeenCalledWith(
        "Comment notification failed",
        expect.objectContaining({ commentId: expect.any(String) })
      )
    }
  )

  it.each([
    {
      name: "missing authentication",
      overrides: { headers: { Origin: origin } },
      statusCode: 401,
    },
    { name: "missing body", overrides: { body: null }, statusCode: 400 },
    {
      name: "oversized comment",
      overrides: { body: "x".repeat(policy.maxCommentLengthChars + 1) },
      statusCode: 413,
    },
    {
      name: "unknown author",
      overrides: {
        headers: {
          Origin: origin,
          Authorization: `Bearer ${tokenFor("missing-user")}`,
        },
      },
      statusCode: 404,
    },
    {
      name: "missing parent",
      overrides: { path: "/.netlify/functions/comment/missing-topic" },
      statusCode: 404,
    },
  ])("does not send email after $name", async ({ overrides, statusCode }) => {
    const handler = await loadHandler()

    const response = await handler(eventFor(overrides))

    expect(response.statusCode).toBe(statusCode)
    expect(send).not.toHaveBeenCalled()
    expect(
      await db.collection("comments").countDocuments({ userId: author.id })
    ).toBe(0)
  })

  it("does not send another email for a rejected duplicate submission", async () => {
    const handler = await loadHandler()
    await expectSavedComment(await handler(eventFor()))
    send.mockClear()

    const response = await handler(eventFor())

    expect(response.statusCode).toBe(409)
    expect(send).not.toHaveBeenCalled()
    expect(
      await db.collection("comments").countDocuments({ text: commentText })
    ).toBe(1)
  })

  it.each(["unacknowledged", "thrown"])(
    "does not send email when insertion is %s",
    async outcome => {
      const handler = await loadHandler()
      const insert = jest.spyOn(Collection.prototype, "insertOne")
      if (outcome === "unacknowledged")
        insert.mockResolvedValueOnce({
          acknowledged: false,
          insertedId: new ObjectId(),
        })
      else
        insert.mockRejectedValueOnce(
          new globalThis.Error("Synthetic insertion failure")
        )

      const response = await handler(eventFor())

      expect(response.statusCode).toBe(500)
      expect(send).not.toHaveBeenCalled()
      expect(
        await db.collection("comments").countDocuments({ text: commentText })
      ).toBe(0)
    }
  )

  it.each([
    { method: "GET", statusCode: 200 },
    { method: "PUT", statusCode: 204 },
    { method: "DELETE", statusCode: 202 },
    { method: "OPTIONS", statusCode: 200 },
    { method: "PATCH", statusCode: 405 },
  ])(
    "does not send email for $method requests",
    async ({ method, statusCode }) => {
      await db.collection<Comment>("comments").insertOne({ ...existingComment })
      const handler = await loadHandler()

      const response = await handler(
        eventFor({
          httpMethod: method,
          path: `/.netlify/functions/comment/${existingComment.id}`,
          body: "Updated existing comment",
        })
      )

      expect(response.statusCode).toBe(statusCode)
      expect(send).not.toHaveBeenCalled()
      expect(
        await db.collection("comments").countDocuments({ text: commentText })
      ).toBe(0)
    }
  )
})
