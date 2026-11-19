import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import { inspect } from "node:util"
import { ResendNotificationService } from "../../lib/ResendNotificationService"
import type { NotificationConfiguration } from "../../lib/env"
import type { Error, Success } from "../../lib/simple-comment-types"

jest.mock("resend", () => ({ Resend: jest.fn() }))

type MailService = NonNullable<
  ConstructorParameters<typeof ResendNotificationService>[1]
>
type SendEmail = MailService["emails"]["send"]
type SendResponse = Awaited<ReturnType<SendEmail>>
type Outcome = "accepted" | "provider-error" | "rejected" | "malformed"

const recipients = [
  "first-moderator@example.com",
  "second-moderator@example.com",
]
const configuration: NotificationConfiguration = {
  provider: "resend",
  apiKey: "re_synthetic_private_key",
  from: "sender@example.com",
  moderatorContactEmails: recipients,
}
const message = "Synthetic comment text that belongs only in the email"
const accepted = {
  data: { id: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794" },
  error: null,
  headers: null,
} satisfies SendResponse
// Use a general request error here. Account guidance and deadlines are slice 3.
// https://resend.com/docs/api-reference/errors
const providerError = {
  data: null,
  error: {
    name: "validation_error",
    statusCode: 400,
    message: "Synthetic private provider explanation",
  },
  headers: null,
} satisfies SendResponse
// Exercise untrusted runtime values despite the SDK's declared response type.
const asSdkResponse = (value: unknown): SendResponse => value as SendResponse

const deferredSend = () => {
  let resolve!: (value: unknown) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<SendResponse>((res, rej) => {
    resolve = value => res(asSdkResponse(value))
    reject = rej
  })
  return { promise, resolve, reject }
}

const settle = (send: ReturnType<typeof deferredSend>, outcome: Outcome) => {
  if (outcome === "rejected") {
    send.reject(new globalThis.Error("Synthetic transport rejection"))
  } else {
    send.resolve(
      outcome === "accepted"
        ? accepted
        : outcome === "provider-error"
          ? providerError
          : null
    )
  }
}

const observe = (operation: Promise<Success | Error>) => {
  let settled = false
  // Attach rejection handling immediately, including incorrectly early failures.
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

const expectSummary = (
  completion: Awaited<ReturnType<typeof observe>["completion"]>,
  acceptedCount: number,
  failedCount: number
) => {
  expect(completion.kind).toBe("fulfilled")
  if (completion.kind !== "fulfilled") {
    throw new globalThis.Error(
      "Notification failures must return a safe result"
    )
  }
  expect(completion.result).toEqual(
    failedCount === 0
      ? { statusCode: 202, body: "Emails sent successfully" }
      : {
          statusCode: 502,
          body: `Notification failed: ${acceptedCount} accepted, ${failedCount} failed.`,
        }
  )
  return completion.result
}

const nextTurn = () => new Promise<void>(resolve => setImmediate(resolve))

describe("Resend recipient completion and basic failures", () => {
  let send: jest.MockedFunction<SendEmail>
  let service: ResendNotificationService
  let consoleSpies: jest.SpiedFunction<typeof console.error>[]

  beforeEach(() => {
    send = jest.fn<SendEmail>().mockResolvedValue(accepted)
    service = new ResendNotificationService(configuration, { emails: { send } })
    consoleSpies = (
      ["error", "warn", "info", "log", "debug", "trace"] as const
    ).map(method => jest.spyOn(console, method).mockImplementation(() => {}))
    jest.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new globalThis.Error("Tests must not make real HTTP requests")
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // Each failure path is exercised before and after the other recipient settles.
  // The final pair also checks a total failure involving different failure paths.
  const scenarios: { first: Outcome; second: Outcome }[] = [
    { first: "accepted", second: "accepted" },
    { first: "provider-error", second: "accepted" },
    { first: "rejected", second: "accepted" },
    { first: "malformed", second: "accepted" },
    { first: "provider-error", second: "rejected" },
  ]

  describe.each([0, 1])("recipient %i settles first", firstRecipient => {
    it.each(scenarios)(
      "attempts both recipients and waits for $first / $second before summarizing",
      async ({ first, second }) => {
        const sends = [deferredSend(), deferredSend()]
        sends.forEach(pending => send.mockReturnValueOnce(pending.promise))
        const observed = observe(service.notifyModerators(message))
        const startedBeforeAnySettlement = send.mock.calls.length
        const recipientOutcomes = [first, second]

        settle(sends[firstRecipient], recipientOutcomes[firstRecipient])
        await nextTurn()
        const finishedBeforeLastRecipient = observed.isSettled()
        // Settle all sends before assertions, even when the operation rejects early.
        settle(sends[1 - firstRecipient], recipientOutcomes[1 - firstRecipient])
        const completion = await observed.completion

        expect(startedBeforeAnySettlement).toBe(2)
        expect(send).toHaveBeenCalledTimes(2)
        expect(finishedBeforeLastRecipient).toBe(false)
        const acceptedCount = recipientOutcomes.filter(
          outcome => outcome === "accepted"
        ).length
        expectSummary(completion, acceptedCount, 2 - acceptedCount)
      }
    )
  })

  it("sends separately to every moderator and waits for a third recipient's rejection", async () => {
    const moderatorContactEmails = [
      ...recipients,
      "third-moderator@example.com",
    ]
    const sends = [deferredSend(), deferredSend(), deferredSend()]
    sends.forEach(pending => send.mockReturnValueOnce(pending.promise))
    const threeRecipientService = new ResendNotificationService(
      {
        ...configuration,
        moderatorContactEmails,
      },
      { emails: { send } }
    )
    const observed = observe(threeRecipientService.notifyModerators(message))
    const startedBeforeAnySettlement = send.mock.calls.length

    settle(sends[1], "accepted")
    await nextTurn()
    const finishedAfterFirst = observed.isSettled()
    settle(sends[0], "accepted")
    await nextTurn()
    const finishedAfterSecond = observed.isSettled()
    settle(sends[2], "rejected")
    const completion = await observed.completion

    expect(startedBeforeAnySettlement).toBe(3)
    expect(send).toHaveBeenCalledTimes(3)
    moderatorContactEmails.forEach((to, index) => {
      expect(send).toHaveBeenNthCalledWith(index + 1, {
        from: configuration.from,
        to,
        subject: "Simple Comment Notification",
        text: message,
      })
    })
    expect(finishedAfterFirst).toBe(false)
    expect(finishedAfterSecond).toBe(false)
    expectSummary(completion, 2, 1)
  })

  it.each([0, 1, 2])(
    "attempts every recipient and waits for pending work when send %i throws synchronously",
    async throwingRecipient => {
      const pending = deferredSend()
      const pendingRecipient = (throwingRecipient + 1) % 3
      ;[0, 1, 2].forEach(index => {
        if (index === throwingRecipient) {
          send.mockImplementationOnce(() => {
            throw new globalThis.Error("Synthetic synchronous client exception")
          })
        } else {
          send.mockReturnValueOnce(
            index === pendingRecipient
              ? pending.promise
              : Promise.resolve(accepted)
          )
        }
      })
      const threeRecipientService = new ResendNotificationService(
        {
          ...configuration,
          moderatorContactEmails: [
            ...recipients,
            "third-moderator@example.com",
          ],
        },
        { emails: { send } }
      )
      const observed = observe(threeRecipientService.notifyModerators(message))

      await nextTurn()
      const finishedBeforePendingSend = observed.isSettled()
      pending.resolve(accepted)
      const completion = await observed.completion

      expect(send).toHaveBeenCalledTimes(3)
      expect(finishedBeforePendingSend).toBe(false)
      expectSummary(completion, 2, 1)
    }
  )

  it.each([
    {
      name: "Error",
      reason: new globalThis.Error("Synthetic transport rejection"),
    },
    { name: "string", reason: "Synthetic transport rejection" },
    {
      name: "plain object",
      reason: { message: "Synthetic transport rejection" },
    },
    { name: "null", reason: null },
    { name: "undefined", reason: undefined },
  ])(
    "returns a safe counted failure for a rejected $name",
    async ({ reason }) => {
      send.mockRejectedValueOnce(reason).mockResolvedValueOnce(accepted)

      const completion = await observe(service.notifyModerators(message))
        .completion

      expect(send).toHaveBeenCalledTimes(2)
      expectSummary(completion, 1, 1)
    }
  )

  it.each([
    { name: "undefined", value: undefined },
    { name: "null", value: null },
    { name: "string", value: "Unexpected SDK response" },
    { name: "array", value: [] },
    { name: "empty object", value: {} },
    { name: "no data or error", value: { data: null, error: null } },
    { name: "missing ID", value: { data: {}, error: null } },
    { name: "empty ID", value: { data: { id: "" }, error: null } },
    { name: "whitespace ID", value: { data: { id: " \t " }, error: null } },
    { name: "numeric ID", value: { data: { id: 123 }, error: null } },
    { name: "missing error field", value: { data: accepted.data } },
    {
      name: "contradictory success and error",
      value: { data: accepted.data, error: providerError.error },
    },
  ])(
    "counts a malformed SDK response ($name) as a failure",
    async ({ value }) => {
      send.mockResolvedValueOnce(asSdkResponse(value))
      const recipientConfiguration: NotificationConfiguration = {
        ...configuration,
        moderatorContactEmails: [recipients[0]],
      }
      const configuredService = new ResendNotificationService(
        recipientConfiguration,
        { emails: { send } }
      )

      const completion = await observe(
        configuredService.notifyModerators(message)
      ).completion

      expect(send).toHaveBeenCalledTimes(1)
      expectSummary(completion, 0, 1)
    }
  )

  it.each(["provider-error", "rejected", "thrown", "malformed"] as const)(
    "keeps sensitive provider information out of results and logs for %s",
    async failure => {
      const privateValues = [
        configuration.apiKey,
        configuration.from,
        ...recipients,
        message,
        accepted.data.id,
        "synthetic-private-provider-payload",
        "synthetic-private-authorization-header",
      ]
      const privateMessage = privateValues.join(" | ")
      const privatePayload = {
        headers: { authorization: privateValues[privateValues.length - 1] },
        config: {
          headers: { Authorization: `Bearer ${configuration.apiKey}` },
        },
        privateDiagnostic: privateMessage,
      }
      if (failure === "provider-error") {
        send.mockResolvedValueOnce(
          asSdkResponse({
            ...providerError,
            ...privatePayload,
            error: { ...providerError.error, message: privateMessage },
          })
        )
      } else if (failure === "malformed") {
        send.mockResolvedValueOnce(
          asSdkResponse({
            ...privatePayload,
            data: { id: { privateMessage } },
            error: null,
          })
        )
      } else {
        const error = Object.assign(
          new globalThis.Error(privateMessage),
          privatePayload
        )
        if (failure === "rejected") {
          send.mockRejectedValueOnce(error)
        } else {
          send.mockImplementationOnce(() => {
            throw error
          })
        }
      }

      const completion = await observe(service.notifyModerators(message))
        .completion

      const diagnostics = inspect(
        { completion, logs: consoleSpies.map(spy => spy.mock.calls) },
        { depth: null }
      )
      privateValues.forEach(value => expect(diagnostics).not.toContain(value))
      expect(completion.kind).toBe("fulfilled")
      if (completion.kind === "fulfilled") {
        expect(completion.result.statusCode).toBeGreaterThanOrEqual(400)
        expect(completion.result.statusCode).toBeLessThan(600)
      }
    }
  )
})
