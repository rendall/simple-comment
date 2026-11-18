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
import type { Resend } from "resend"
import { inspect } from "node:util"
import { Collection, MongoClient, ObjectId } from "mongodb"
import type { Db } from "mongodb"
import * as jwt from "jsonwebtoken"
import type { Comment, Discussion, User } from "../../lib/simple-comment-types"
import policy from "../../policy.json"

declare const global: { __MONGO_URI__: string; __MONGO_DB_NAME__: string }

type Handler = (typeof import("../../functions/comment"))["handler"]
type GetNotificationService =
  (typeof import("../../lib/getNotificationService"))["getNotificationService"]
type ResendSend = Resend["emails"]["send"]
type ResendMail = { emails: Pick<Resend["emails"], "send"> }
type SendResponse = [ClientResponse, object]
const providers = ["sendgrid", "resend"] as const
type Provider = (typeof providers)[number]
const originalEnv = process.env
const actualMongo = jest.requireActual<typeof import("mongodb")>("mongodb")
const connect = MongoClient.connect.bind(MongoClient)
const databaseName = `${global.__MONGO_DB_NAME__}-comment-wiring`
const origin = "https://notifications.example.com"
const apiKey = "SG.synthetic-notification-test-key"
const verifiedSender = "sender@example.com"
const resendApiKey = "re_synthetic_endpoint_key"
const resendSender = "Simple Comment <resend-sender@example.com>"
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
const resendAccepted = {
  data: { id: "synthetic-resend-email-id" },
  error: null,
  headers: null,
} satisfies Awaited<ReturnType<ResendSend>>
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
  let resendSend: jest.MockedFunction<ResendSend>
  let resendConstructor: jest.Mock<
    (...args: ConstructorParameters<typeof Resend>) => ResendMail
  >
  let resolveService: jest.SpiedFunction<GetNotificationService>
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
    // Isolate provider selection from any developer or CI notification settings.
    ;["SENDGRID_API_KEY", "RESEND_API_KEY", "RESEND_FROM"].forEach(
      key => delete process.env[key]
    )
    send = jest.fn<MailService["send"]>().mockResolvedValue(accepted)
    setApiKey = jest.fn<MailService["setApiKey"]>()
    const mail = { send, setApiKey }
    resendSend = jest.fn<ResendSend>().mockResolvedValue(resendAccepted)
    resendConstructor = jest
      .fn<(...args: ConstructorParameters<typeof Resend>) => ResendMail>()
      .mockReturnValue({ emails: { send: resendSend } })
    jest.resetModules()
    // Only provider SDK boundaries are stubbed. The handler, resolver, DB service,
    // adapters, environment validation, and JWT verification are real.
    jest.doMock("@sendgrid/mail", () => ({
      ...mail,
      MailService: jest.fn(() => mail),
    }))
    jest.doMock("resend", () => ({ Resend: resendConstructor }))
    jest.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new globalThis.Error("Endpoint tests must not make HTTP requests")
    })
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
      jest.dontMock("resend")
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
      const resolver = await import("../../lib/getNotificationService")
      // Observe the real resolver without replacing its behavior.
      resolveService = jest.spyOn(resolver, "getNotificationService")
      handler = (await import("../../functions/comment")).handler
    })
    return handler
  }

  const configureProvider = (provider: Provider) => {
    if (provider === "sendgrid") return send
    delete process.env.NOTIFICATION_SERVICE_API_KEY
    delete process.env.SENDGRID_VERIFIED_SENDER
    process.env.RESEND_API_KEY = resendApiKey
    process.env.RESEND_FROM = resendSender
    return resendSend
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

  it.each(["SENDGRID_API_KEY", "NOTIFICATION_SERVICE_API_KEY"])(
    "uses the resolver to send through SendGrid configured with %s after saving",
    async keyName => {
      delete process.env.NOTIFICATION_SERVICE_API_KEY
      process.env[keyName] = apiKey
      let savedAtSend: Comment | null = null
      send.mockImplementation(async () => {
        savedAtSend = await db
          .collection<Comment>("comments")
          .findOne({ text: commentText })
        return accepted
      })
      const handler = await loadHandler()

      await expectSavedComment(await handler(eventFor()))

      expect(resolveService).toHaveBeenCalledTimes(1)
      expect(savedAtSend).toMatchObject({
        text: commentText,
        userId: author.id,
      })
      expect(setApiKey).toHaveBeenCalledWith(apiKey)
      expect(resendConstructor).not.toHaveBeenCalled()
      expect(resendSend).not.toHaveBeenCalled()
      expect(send).toHaveBeenCalledTimes(1)
      expect(send).toHaveBeenCalledWith({
        to: recipient,
        from: verifiedSender,
        subject: "Simple Comment Notification",
        text: `New comment posted by ${author.name} (${author.email})`,
      })
      expect(errorLog).not.toHaveBeenCalled()
    }
  )

  it("uses the resolver to send through Resend after the endpoint saves a comment", async () => {
    configureProvider("resend")
    let savedAtSend: Comment | null = null
    resendSend.mockImplementation(async () => {
      savedAtSend = await db
        .collection<Comment>("comments")
        .findOne({ text: commentText })
      return resendAccepted
    })
    const handler = await loadHandler()

    await expectSavedComment(await handler(eventFor()))

    expect(resolveService).toHaveBeenCalledTimes(1)
    expect(savedAtSend).toMatchObject({ text: commentText, userId: author.id })
    expect(resendConstructor).toHaveBeenCalledTimes(1)
    expect(resendConstructor.mock.calls[0][0]).toBe(resendApiKey)
    expect(resendSend).toHaveBeenCalledTimes(1)
    expect(resendSend).toHaveBeenCalledWith({
      to: recipient,
      from: resendSender,
      subject: "Simple Comment Notification",
      text: `New comment posted by ${author.name} (${author.email})`,
    })
    expect(setApiKey).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
    expect(errorLog).not.toHaveBeenCalled()
  })

  it.each(providers)(
    "sends through %s to every configured moderator",
    async provider => {
      const providerSend = configureProvider(provider)
      const recipients = [recipient, "second@example.com", "third@example.com"]
      process.env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL = ` ${recipient}, second@example.com, , third@example.com `
      const handler = await loadHandler()

      await expectSavedComment(await handler(eventFor()))

      expect(providerSend).toHaveBeenCalledTimes(3)
      recipients.forEach(to => {
        expect(providerSend).toHaveBeenCalledWith(
          expect.objectContaining({
            to,
            from: provider === "resend" ? resendSender : verifiedSender,
          })
        )
      })
    }
  )

  it("uses the resolver to keep notifications disabled when no provider is configured", async () => {
    delete process.env.NOTIFICATION_SERVICE_API_KEY
    delete process.env.SENDGRID_VERIFIED_SENDER
    // The required moderator contact address alone must not enable notifications.
    const handler = await loadHandler()

    await expectSavedComment(await handler(eventFor()))

    expect(resolveService).toHaveBeenCalledTimes(1)
    expect(setApiKey).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
    expect(resendConstructor).not.toHaveBeenCalled()
    expect(resendSend).not.toHaveBeenCalled()
    expect(errorLog).not.toHaveBeenCalled()
  })

  it("rejects a partially configured second provider before initializing either client", async () => {
    // Any setting for a second provider must prevent silent provider selection.
    process.env.RESEND_FROM = resendSender

    await expect(loadHandler()).rejects.toMatchObject({
      name: "EnvContractError",
      key: "NOTIFICATION_PROVIDERS",
      message: expect.stringContaining("Multiple notification providers"),
    })

    expect(resolveService).toHaveBeenCalledTimes(1)
    expect(setApiKey).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
    expect(resendConstructor).not.toHaveBeenCalled()
    expect(resendSend).not.toHaveBeenCalled()
  })

  it.each([
    {
      missing: "NOTIFICATION_SERVICE_API_KEY",
      expectedKey: "SENDGRID_API_KEY",
    },
    {
      missing: "SENDGRID_VERIFIED_SENDER",
      expectedKey: "SENDGRID_VERIFIED_SENDER",
    },
  ])(
    "fails initialization with an actionable error when $missing is missing",
    async ({ missing, expectedKey }) => {
      delete process.env[missing]

      await expect(loadHandler()).rejects.toMatchObject({
        name: "EnvContractError",
        key: expectedKey,
        message: expect.stringContaining(expectedKey),
      })
      expect(setApiKey).not.toHaveBeenCalled()
      expect(send).not.toHaveBeenCalled()
    }
  )

  it.each(providers)(
    "reuses the %s client for successive submissions",
    async provider => {
      const providerSend = configureProvider(provider)
      const handler = await loadHandler()
      await expectSavedComment(await handler(eventFor()))
      const secondText = "Another comment through the same warm handler"

      await expectSavedComment(
        await handler(eventFor({ body: secondText })),
        secondText
      )

      expect(resolveService).toHaveBeenCalledTimes(1)
      expect(setApiKey).toHaveBeenCalledTimes(provider === "sendgrid" ? 1 : 0)
      expect(resendConstructor).toHaveBeenCalledTimes(
        provider === "resend" ? 1 : 0
      )
      expect(providerSend).toHaveBeenCalledTimes(2)
      expect(
        await db.collection("comments").countDocuments({ userId: author.id })
      ).toBe(2)
    }
  )

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

  it.each(["provider error", "rejected promise", "synchronous throw"])(
    "preserves the saved comment and safe diagnostics after a Resend %s",
    async outcome => {
      configureProvider("resend")
      const privateValues = [
        resendApiKey,
        resendSender,
        recipient,
        "private-provider-trace",
        "private-provider-header",
      ]
      const detail = privateValues.join(" | ")
      const otherLogs = (
        ["warn", "info", "log", "debug", "trace"] as const
      ).map(method => jest.spyOn(console, method).mockImplementation(() => {}))
      if (outcome === "provider error") {
        resendSend.mockResolvedValue({
          data: null,
          error: {
            name: "application_error",
            statusCode: 503,
            message: detail,
          },
          headers: { authorization: detail },
        })
      } else if (outcome === "rejected promise") {
        resendSend.mockRejectedValue(new globalThis.Error(detail))
      } else {
        resendSend.mockImplementation(() => {
          throw new TypeError(detail)
        })
      }
      const handler = await loadHandler()

      const response = await handler(eventFor())

      await expectSavedComment(response)
      expect(resendSend).toHaveBeenCalledTimes(1)
      expect(send).not.toHaveBeenCalled()
      expect(setApiKey).not.toHaveBeenCalled()
      expect(errorLog).toHaveBeenCalledWith("Comment notification failed", {
        commentId: (JSON.parse(response.body as string) as Comment).id,
        statusCode: outcome === "provider error" ? 503 : 502,
      })
      if (outcome === "provider error") {
        expect(errorLog).toHaveBeenCalledWith(
          "Notification provider error",
          expect.objectContaining({
            statusCode: 503,
            body: expect.stringContaining("Check network access"),
          })
        )
      }
      const diagnostics = inspect(
        [errorLog.mock.calls, ...otherLogs.map(spy => spy.mock.calls)],
        { depth: null }
      )
      privateValues.forEach(value => {
        expect(inspect(response)).not.toContain(value)
        expect(diagnostics).not.toContain(value)
      })
      expect(diagnostics).not.toContain(commentText)
    }
  )

  it("completes the saved submission when Resend delivery times out", async () => {
    configureProvider("resend")
    const entered = deferred<void>()
    const delivery = deferred<Awaited<ReturnType<ResendSend>>>()
    resendSend.mockImplementation(() => {
      // Persistence uses real timers; fake only the notification wait that follows.
      jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] })
      entered.resolve()
      return delivery.promise
    })
    const handler = await loadHandler()
    let completed: Awaited<ReturnType<Handler>> | undefined
    const request = handler(eventFor()).then(response => {
      completed = response
      return response
    })

    try {
      await Promise.race([entered.promise, request.then(() => {})])
      const completedBeforeDeadline = completed
      // Exercise timeout handling without sleeping or asserting its duration.
      await jest.runOnlyPendingTimersAsync()
      const completedAtDeadline = completed
      // Also release the SDK promise if a regression removes the deadline.
      delivery.resolve(resendAccepted)
      const response = await request

      expect(resendSend).toHaveBeenCalledTimes(1)
      expect(completedBeforeDeadline).toBeUndefined()
      expect(completedAtDeadline).toBe(response)
    } finally {
      delivery.resolve(resendAccepted)
      jest.useRealTimers()
    }

    const response = await request
    await expectSavedComment(response)
    expect(errorLog).toHaveBeenCalledTimes(1)
    expect(errorLog).toHaveBeenCalledWith("Comment notification failed", {
      commentId: (JSON.parse(response.body as string) as Comment).id,
      statusCode: 504,
    })
    expect(send).not.toHaveBeenCalled()
  })

  it("does not notify Resend when authentication rejects a submission", async () => {
    configureProvider("resend")
    const handler = await loadHandler()

    const response = await handler(eventFor({ headers: { Origin: origin } }))

    expect(response.statusCode).toBe(401)
    expect(resendSend).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
    expect(
      await db.collection("comments").countDocuments({ userId: author.id })
    ).toBe(0)
  })

  it("does not notify Resend when comment insertion fails", async () => {
    configureProvider("resend")
    const handler = await loadHandler()
    jest
      .spyOn(Collection.prototype, "insertOne")
      .mockRejectedValueOnce(
        new globalThis.Error("Synthetic insertion failure")
      )

    const response = await handler(eventFor())

    expect(response.statusCode).toBe(500)
    expect(resendSend).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
    expect(
      await db.collection("comments").countDocuments({ userId: author.id })
    ).toBe(0)
  })

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

  it.each(providers)(
    "does not notify %s again for a rejected duplicate",
    async provider => {
      const providerSend = configureProvider(provider)
      const handler = await loadHandler()
      await expectSavedComment(await handler(eventFor()))
      providerSend.mockClear()

      const response = await handler(eventFor())

      expect(response.statusCode).toBe(409)
      expect(providerSend).not.toHaveBeenCalled()
      expect(
        await db.collection("comments").countDocuments({ text: commentText })
      ).toBe(1)
    }
  )

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

  describe.each(providers)("%s request methods", provider => {
    it.each([
      { method: "GET", statusCode: 200 },
      { method: "PUT", statusCode: 204 },
      { method: "DELETE", statusCode: 202 },
      { method: "OPTIONS", statusCode: 200 },
      { method: "PATCH", statusCode: 405 },
    ])(
      "does not send email for $method requests",
      async ({ method, statusCode }) => {
        const providerSend = configureProvider(provider)
        await db
          .collection<Comment>("comments")
          .insertOne({ ...existingComment })
        const handler = await loadHandler()

        const response = await handler(
          eventFor({
            httpMethod: method,
            path: `/.netlify/functions/comment/${existingComment.id}`,
            body: "Updated existing comment",
          })
        )

        expect(response.statusCode).toBe(statusCode)
        expect(providerSend).not.toHaveBeenCalled()
        expect(
          await db.collection("comments").countDocuments({ text: commentText })
        ).toBe(0)
      }
    )
  })
})
