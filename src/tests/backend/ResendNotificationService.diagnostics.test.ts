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

jest.mock("resend", () => ({ Resend: jest.fn() }))

type MailService = NonNullable<
  ConstructorParameters<typeof ResendNotificationService>[1]
>
type SendEmail = MailService["emails"]["send"]
type SendResponse = Awaited<ReturnType<SendEmail>>

const configuration: NotificationConfiguration = {
  provider: "resend",
  apiKey: "re_synthetic_private_key",
  from: "private-sender@example.com",
  moderatorContactEmails: ["private-moderator@example.com"],
}
const message = "Synthetic private comment body"
const privateValues = [
  configuration.apiKey,
  configuration.from,
  ...configuration.moderatorContactEmails,
  message,
  "private-provider-email-id",
  "private-provider-header",
  "private-provider-trace",
  "private-domain.example",
]
const accepted = {
  data: { id: privateValues[4] },
  error: null,
  headers: null,
} satisfies SendResponse
const asSdkResponse = (value: unknown) => value as SendResponse
const providerResponse = (
  name: string,
  statusCode: number | null,
  detail = privateValues.join(" | ")
) =>
  asSdkResponse({
    data: null,
    error: {
      name,
      statusCode,
      message: detail,
      trace: privateValues.join(" | "),
    },
    headers: { authorization: `Bearer ${configuration.apiKey}` },
    request: { from: configuration.from, text: message },
  })

const authentication = {
  statusCode: 502,
  body: "Notification provider authentication failed",
  guidance: "Check RESEND_API_KEY and your Resend account status.",
}
const sending = {
  statusCode: 502,
  body: "Notification provider refused sending",
  guidance:
    "Check RESEND_FROM, domain verification, and API key permissions in Resend.",
}
const quota = {
  statusCode: 502,
  body: "Notification provider sending allowance exhausted",
  guidance:
    "Check Resend usage limits and wait for the quota to reset or adjust your plan.",
}
const rate = {
  statusCode: 503,
  body: "Notification provider rate limit exceeded",
  guidance: "Reduce the sending rate and try again later.",
}
const unavailable = {
  statusCode: 503,
  body: "Notification service unavailable",
  guidance:
    "Check network access and Resend's service status, then try again later.",
}

// Public API error names can be newer than the SDK's error-name union.
// https://resend.com/docs/api-reference/errors
const recognizedCases = [
  { name: "missing_api_key", status: 401, expected: authentication },
  {
    name: "validation_error",
    status: 400,
    detail: "API key is invalid",
    expected: authentication,
  },
  {
    name: "validation_error",
    status: 401,
    detail: "API key is invalid",
    expected: authentication,
  },
  { name: "restricted_api_key", status: 403, expected: authentication },
  { name: "suspended_api_key", status: 403, expected: authentication },
  { name: "restricted_api_key", status: 401, expected: sending },
  { name: "invalid_permission", status: 403, expected: sending },
  {
    name: "validation_error",
    status: 403,
    detail:
      "The `private-domain.example` domain is not verified. Please, add and verify your domain.",
    expected: sending,
  },
  {
    name: "validation_error",
    status: 403,
    detail:
      "You can only send testing emails to your own email address (private-moderator@example.com). To send emails to other recipients, please verify a domain at resend.com/domains, and change the from address to an email using this domain.",
    expected: sending,
  },
  { name: "daily_quota_exceeded", status: 429, expected: quota },
  { name: "monthly_quota_exceeded", status: 429, expected: quota },
  { name: "rate_limit_exceeded", status: 429, expected: rate },
  { name: "service_unavailable", status: 503, expected: unavailable },
  { name: "dns_lookup_failed", status: 503, expected: unavailable },
  { name: "application_error", status: 500, expected: unavailable },
  // The SDK wraps a failed fetch or non-JSON error response this way.
  { name: "application_error", status: null, expected: unavailable },
  { name: "application_error", status: 503, expected: unavailable },
]

const deferredSend = () => {
  let resolve!: (response: SendResponse) => void
  const promise = new Promise<SendResponse>(res => {
    resolve = res
  })
  return { promise, resolve }
}

describe("Resend safe delivery diagnostics", () => {
  let send: jest.MockedFunction<SendEmail>
  let service: ResendNotificationService
  let consoleSpies: jest.SpiedFunction<typeof console.error>[]

  beforeEach(() => {
    jest.useFakeTimers()
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
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  const expectPrivate = (result: unknown) => {
    const diagnostics = inspect(
      { result, logs: consoleSpies.map(spy => spy.mock.calls) },
      { depth: null }
    )
    privateValues.forEach(value => expect(diagnostics).not.toContain(value))
  }

  it.each(recognizedCases)(
    "recognizes $name / $status and emits only fixed guidance",
    async ({ name, status, detail, expected }) => {
      send.mockResolvedValueOnce(providerResponse(name, status, detail))

      const result = await service.notifyModerators(message)

      expect(result).toEqual({
        statusCode: expected.statusCode,
        body: `${expected.body}: 0 accepted, 1 failed. ${expected.guidance}`,
      })
      expect(console.error).toHaveBeenCalledTimes(1)
      expect(console.error).toHaveBeenCalledWith(
        "Notification provider error",
        result
      )
      expectPrivate(result)
      expect(jest.getTimerCount()).toBe(0)
      expect(fetch).not.toHaveBeenCalled()
    }
  )

  it.each([
    {
      name: "unknown credential error",
      error: { name: "future_error", statusCode: 401 },
    },
    {
      name: "unknown permission error",
      error: { name: "future_error", statusCode: 403 },
    },
    {
      name: "unknown limit error",
      error: { name: "future_error", statusCode: 429 },
    },
    {
      name: "contradictory name/status",
      error: { name: "daily_quota_exceeded", statusCode: 503 },
    },
    { name: "missing status", error: { name: "daily_quota_exceeded" } },
    {
      name: "string status",
      error: { name: "daily_quota_exceeded", statusCode: "429" },
    },
    {
      name: "missing message",
      error: { name: "missing_api_key", statusCode: 401, message: undefined },
    },
    {
      name: "general validation error",
      error: { name: "validation_error", statusCode: 400 },
    },
    {
      name: "unrelated forbidden validation",
      error: {
        name: "validation_error",
        statusCode: 403,
        message: "The domain has been registered already.",
      },
    },
    {
      name: "contradictory success/error",
      error: { name: "missing_api_key", statusCode: 401 },
      data: accepted.data,
    },
  ])("keeps $name generic instead of guessing a diagnosis", async fixture => {
    send.mockResolvedValueOnce(
      asSdkResponse({
        data: "data" in fixture ? fixture.data : null,
        error: { message: privateValues.join(" | "), ...fixture.error },
        headers: { authorization: "private-provider-header" },
      })
    )

    const result = await service.notifyModerators(message)

    expect(result).toEqual({
      statusCode: 502,
      body: "Notification failed: 0 accepted, 1 failed.",
    })
    expect(console.error).not.toHaveBeenCalled()
    expectPrivate(result)
  })

  it.each([0, 1])(
    "waits for every recipient and gives the same mixed summary when recipient %i finishes first",
    async first => {
      const sends = [deferredSend(), deferredSend()]
      sends.forEach(pending => send.mockReturnValueOnce(pending.promise))
      const multiService = new ResendNotificationService(
        {
          ...configuration,
          moderatorContactEmails: [
            "one@example.com",
            "two@example.com",
            "three@example.com",
          ],
        },
        { emails: { send } }
      )
      let finished = false
      const completion = multiService.notifyModerators(message).then(result => {
        finished = true
        return result
      })
      const responses = [
        providerResponse("missing_api_key", 401),
        providerResponse("rate_limit_exceeded", 429),
      ]

      sends[first].resolve(responses[first])
      await jest.advanceTimersByTimeAsync(0)
      const finishedBeforeLast = finished
      const loggedBeforeLast = consoleSpies.flatMap(spy => spy.mock.calls)
      sends[1 - first].resolve(responses[1 - first])
      const result = await completion

      expect(finishedBeforeLast).toBe(false)
      expect(loggedBeforeLast).toEqual([])
      expect(send).toHaveBeenCalledTimes(3)
      expect(result).toEqual({
        statusCode: 502,
        body: `Notification failed: 1 accepted, 2 failed (1 authentication failure, 1 rate limit). ${authentication.guidance} ${rate.guidance}`,
      })
      expect(console.error).toHaveBeenCalledTimes(1)
      expect(console.error).toHaveBeenCalledWith(
        "Notification provider error",
        result
      )
      expectPrivate(result)
    }
  )

  it("counts repeated quota failures but emits their guidance once", async () => {
    send
      .mockResolvedValueOnce(providerResponse("daily_quota_exceeded", 429))
      .mockResolvedValueOnce(providerResponse("monthly_quota_exceeded", 429))
    const multiService = new ResendNotificationService(
      {
        ...configuration,
        moderatorContactEmails: ["one@example.com", "two@example.com"],
      },
      { emails: { send } }
    )

    const result = await multiService.notifyModerators(message)

    expect(result).toEqual({
      statusCode: 502,
      body: `${quota.body}: 0 accepted, 2 failed. ${quota.guidance}`,
    })
    expect(console.error).toHaveBeenCalledTimes(1)
    expectPrivate(result)
  })

  it("retains a generic failure alongside recognized account guidance", async () => {
    send
      .mockResolvedValueOnce(providerResponse("future_error", 401))
      .mockResolvedValueOnce(providerResponse("missing_api_key", 401))
    const multiService = new ResendNotificationService(
      {
        ...configuration,
        moderatorContactEmails: ["one@example.com", "two@example.com"],
      },
      { emails: { send } }
    )

    const result = await multiService.notifyModerators(message)

    expect(result).toEqual({
      statusCode: 502,
      body: `Notification failed: 0 accepted, 2 failed (1 upstream failure, 1 authentication failure). ${authentication.guidance}`,
    })
    expectPrivate(result)
  })

  it("combines account guidance with a timeout and ignores later provider diagnostics", async () => {
    const pending = deferredSend()
    send
      .mockResolvedValueOnce(providerResponse("missing_api_key", 401))
      .mockReturnValueOnce(pending.promise)
    const multiService = new ResendNotificationService(
      {
        ...configuration,
        moderatorContactEmails: ["one@example.com", "two@example.com"],
      },
      { emails: { send } }
    )
    let atDeadline:
      | Awaited<ReturnType<typeof service.notifyModerators>>
      | undefined
    const completion = multiService.notifyModerators(message).then(result => {
      atDeadline = result
      return result
    })

    await jest.advanceTimersByTimeAsync(5000)
    const deadlineResult = atDeadline
    const deadlineLogs = inspect(consoleSpies.map(spy => spy.mock.calls))
    pending.resolve(providerResponse("daily_quota_exceeded", 429))
    await jest.advanceTimersByTimeAsync(0)
    const result = await completion

    expect(deadlineResult).toEqual({
      statusCode: 502,
      body: `Notification failed: 0 accepted, 2 failed (1 authentication failure, 1 timed out). ${authentication.guidance}`,
    })
    expect(result).toBe(deadlineResult)
    expect(inspect(consoleSpies.map(spy => spy.mock.calls))).toBe(deadlineLogs)
    expect(console.error).toHaveBeenCalledTimes(1)
    expectPrivate(result)
    expect(jest.getTimerCount()).toBe(0)
  })

  it("does not log delivery errors for successful sends", async () => {
    await expect(service.notifyModerators(message)).resolves.toEqual({
      statusCode: 202,
      body: "Emails sent successfully",
    })
    expect(consoleSpies.flatMap(spy => spy.mock.calls)).toEqual([])
  })
})
