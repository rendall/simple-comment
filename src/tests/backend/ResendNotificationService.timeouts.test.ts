import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import { ResendNotificationService } from "../../lib/ResendNotificationService"
import type { NotificationConfiguration } from "../../lib/env"
import type { Error, Success } from "../../lib/simple-comment-types"

jest.mock("resend", () => ({ Resend: jest.fn() }))

type MailService = NonNullable<
  ConstructorParameters<typeof ResendNotificationService>[1]
>
type SendEmail = MailService["emails"]["send"]
type SendResponse = Awaited<ReturnType<SendEmail>>
type Completion =
  | { kind: "fulfilled"; result: Success | Error }
  | { kind: "rejected"; error: unknown }

const configuration: NotificationConfiguration = {
  provider: "resend",
  apiKey: "re_synthetic_key",
  from: "sender@example.com",
  moderatorContactEmails: ["first@example.com", "second@example.com"],
}
const accepted = {
  data: { id: "synthetic-email-id" },
  error: null,
  headers: null,
} satisfies SendResponse
const providerError = {
  data: null,
  error: {
    name: "validation_error",
    statusCode: 400,
    message: "Synthetic private provider explanation",
  },
  headers: null,
} satisfies SendResponse

const deferredSend = () => {
  let resolve!: (value: SendResponse) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<SendResponse>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const observe = (operation: Promise<Success | Error>) => {
  let current: Completion | undefined
  const completion = operation.then(
    result => (current = { kind: "fulfilled", result }),
    (error: unknown) => (current = { kind: "rejected", error })
  )
  return { completion, current: () => current }
}

const timeoutResult = (acceptedCount: number, failedCount: number) => ({
  kind: "fulfilled",
  result: {
    statusCode: 504,
    body: `Notification timed out: ${acceptedCount} accepted, ${failedCount} failed.`,
  },
})

describe("Resend notification deadlines", () => {
  let send: jest.MockedFunction<SendEmail>
  let service: ResendNotificationService

  beforeEach(() => {
    jest.useFakeTimers()
    send = jest.fn<SendEmail>().mockResolvedValue(accepted)
    service = new ResendNotificationService(configuration, { emails: { send } })
    jest.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new globalThis.Error("Tests must not make real HTTP requests")
    })
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it("starts every recipient immediately and finishes at five seconds, not before", async () => {
    const sends = [deferredSend(), deferredSend()]
    sends.forEach(pending => send.mockReturnValueOnce(pending.promise))
    const observed = observe(service.notifyModerators("Comment text"))
    const startedImmediately = send.mock.calls.length

    await jest.advanceTimersByTimeAsync(4999)
    const beforeDeadline = observed.current()
    await jest.advanceTimersByTimeAsync(1)
    const atDeadline = observed.current()
    const timersAtDeadline = jest.getTimerCount()
    // Settle the SDK promises even when the deadline implementation is missing.
    sends.forEach(pending => pending.resolve(accepted))
    await observed.completion

    expect(startedImmediately).toBe(2)
    expect(beforeDeadline).toBeUndefined()
    expect(atDeadline).toEqual(timeoutResult(0, 2))
    expect(timersAtDeadline).toBe(0)
  })

  it("accepts delivery before the deadline and clears all timers", async () => {
    const sends = [deferredSend(), deferredSend()]
    sends.forEach(pending => send.mockReturnValueOnce(pending.promise))
    const observed = observe(service.notifyModerators("Comment text"))

    await jest.advanceTimersByTimeAsync(4999)
    sends.forEach(pending => pending.resolve(accepted))
    expect(await observed.completion).toEqual({
      kind: "fulfilled",
      result: { statusCode: 202, body: "Emails sent successfully" },
    })
    expect(jest.getTimerCount()).toBe(0)
  })

  it("counts acceptance separately from a recipient that times out", async () => {
    const pending = deferredSend()
    send.mockReturnValueOnce(pending.promise)
    const observed = observe(service.notifyModerators("Comment text"))

    await jest.advanceTimersByTimeAsync(5000)
    const atDeadline = observed.current()
    pending.resolve(accepted)
    await observed.completion

    expect(atDeadline).toEqual(timeoutResult(1, 1))
    expect(jest.getTimerCount()).toBe(0)
  })

  it("reports both a provider failure and a timeout in a mixed failure summary", async () => {
    const pending = deferredSend()
    send
      .mockResolvedValueOnce(providerError)
      .mockReturnValueOnce(pending.promise)
    const observed = observe(service.notifyModerators("Comment text"))

    await jest.advanceTimersByTimeAsync(5000)
    const atDeadline = observed.current()
    pending.resolve(accepted)
    await observed.completion

    expect(atDeadline).toEqual({
      kind: "fulfilled",
      result: {
        statusCode: 502,
        body: "Notification failed: 0 accepted, 2 failed (1 upstream failure, 1 timed out).",
      },
    })
    expect(jest.getTimerCount()).toBe(0)
  })

  it.each(["acceptance", "rejection"] as const)(
    "ignores late SDK %s after reporting a timeout",
    async outcome => {
      const pending = deferredSend()
      send.mockReturnValueOnce(pending.promise)
      const observed = observe(service.notifyModerators("Comment text"))

      await jest.advanceTimersByTimeAsync(5000)
      const atDeadline = observed.current()
      if (outcome === "acceptance") {
        pending.resolve(accepted)
      } else {
        pending.reject(new globalThis.Error("Synthetic late rejection"))
      }
      // Flush late settlement. Jest also fails the test on unhandled rejections.
      await jest.advanceTimersByTimeAsync(0)
      const completion = await observed.completion

      expect(atDeadline).toEqual(timeoutResult(1, 1))
      expect(completion).toBe(atDeadline)
      expect(jest.getTimerCount()).toBe(0)
    }
  )

  it.each(["provider error", "rejection", "synchronous throw"] as const)(
    "clears deadlines after a %s without waiting for the timeout",
    async outcome => {
      if (outcome === "provider error") {
        send.mockResolvedValueOnce(providerError)
      } else if (outcome === "rejection") {
        send.mockRejectedValueOnce(new globalThis.Error("Synthetic rejection"))
      } else {
        send.mockImplementationOnce(() => {
          throw new globalThis.Error("Synthetic synchronous failure")
        })
      }
      const observed = observe(service.notifyModerators("Comment text"))
      expect(await observed.completion).toEqual({
        kind: "fulfilled",
        result: {
          statusCode: 502,
          body: "Notification failed: 1 accepted, 1 failed.",
        },
      })
      expect(send).toHaveBeenCalledTimes(2)
      expect(jest.getTimerCount()).toBe(0)
    }
  )
})
