import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import { getNotificationConfiguration } from "../../lib/env"
import type { NotificationConfiguration } from "../../lib/env"
import type { AbstractNotificationService } from "../../lib/AbstractNotificationService"

jest.mock("../../lib/env", () => ({
  getNotificationConfiguration: jest.fn(),
}))
jest.mock("../../lib/ResendNotificationService", () => ({
  ResendNotificationService: jest.fn(),
}))
jest.mock("../../lib/SendGridNotificationService", () => ({
  SendGridNotificationService: jest.fn(),
}))

type ServiceConstructor = (
  configuration: NotificationConfiguration
) => AbstractNotificationService
type Resolver = (
  source?: NodeJS.ProcessEnv
) => AbstractNotificationService | undefined

const resendConstructor = jest.requireMock<{
  ResendNotificationService: jest.Mock<ServiceConstructor>
}>("../../lib/ResendNotificationService").ResendNotificationService
const sendGridConstructor = jest.requireMock<{
  SendGridNotificationService: jest.Mock<ServiceConstructor>
}>("../../lib/SendGridNotificationService").SendGridNotificationService
const readConfiguration = jest.mocked(getNotificationConfiguration)
const resendService: AbstractNotificationService = {
  notifyModerators: jest.fn<AbstractNotificationService["notifyModerators"]>(),
}
const sendGridService: AbstractNotificationService = {
  notifyModerators: jest.fn<AbstractNotificationService["notifyModerators"]>(),
}

// Load the new entry point at runtime so tests type-check and report individual
// failures while its implementation is absent. There is no fallback resolver.
const getNotificationService: Resolver = source =>
  jest
    .requireActual<{
      getNotificationService: Resolver
    }>("../../lib/getNotificationService")
    .getNotificationService(source)

const resendConfiguration: NotificationConfiguration = {
  provider: "resend",
  apiKey: "re_synthetic_validated_key",
  from: "Simple Comment <sender@example.com>",
  moderatorContactEmails: ["first@example.com", "second@example.com"],
}
const sendGridConfiguration: NotificationConfiguration = {
  provider: "sendgrid",
  apiKey: "SG.synthetic-validated-key",
  from: "sender@example.com",
  moderatorContactEmails: ["first@example.com", "second@example.com"],
}
const contact = {
  SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL:
    "first@example.com,second@example.com",
}

// Configuration parsing, address validation, and ambiguous settings are already
// covered in notification.configuration.test.ts. These cases test construction
// from the reader's validated result, not a second configuration decision table.
const selections = [
  {
    name: "Resend",
    source: {
      ...contact,
      RESEND_API_KEY: resendConfiguration.apiKey,
      RESEND_FROM: resendConfiguration.from,
    },
    configuration: resendConfiguration,
    warnings: [],
    selectedConstructor: resendConstructor,
    otherConstructor: sendGridConstructor,
    expectedService: resendService,
  },
  {
    name: "SendGrid",
    source: {
      ...contact,
      SENDGRID_API_KEY: sendGridConfiguration.apiKey,
      SENDGRID_VERIFIED_SENDER: sendGridConfiguration.from,
    },
    configuration: sendGridConfiguration,
    warnings: [],
    selectedConstructor: sendGridConstructor,
    otherConstructor: resendConstructor,
    expectedService: sendGridService,
  },
  {
    name: "legacy SendGrid with a CI-only warning",
    source: {
      ...contact,
      NOTIFICATION_SERVICE_API_KEY: sendGridConfiguration.apiKey,
      SENDGRID_VERIFIED_SENDER: sendGridConfiguration.from,
    },
    configuration: sendGridConfiguration,
    warnings: [
      "NOTIFICATION_SERVICE_API_KEY is deprecated. Use SENDGRID_API_KEY instead.",
    ],
    selectedConstructor: sendGridConstructor,
    otherConstructor: resendConstructor,
    expectedService: sendGridService,
  },
]

describe("notification service construction resolver", () => {
  let consoleSpies: jest.SpiedFunction<typeof console.error>[]

  beforeEach(() => {
    readConfiguration.mockReturnValue({
      configuration: undefined,
      warnings: [],
    })
    resendConstructor.mockReturnValue(resendService)
    sendGridConstructor.mockReturnValue(sendGridService)
    consoleSpies = (
      ["error", "warn", "info", "log", "debug", "trace"] as const
    ).map(method => jest.spyOn(console, method).mockImplementation(() => {}))
    jest.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new globalThis.Error("Resolver tests must not make HTTP requests")
    })
  })

  afterEach(() => {
    try {
      expect(resendService.notifyModerators).not.toHaveBeenCalled()
      expect(sendGridService.notifyModerators).not.toHaveBeenCalled()
      expect(fetch).not.toHaveBeenCalled()
      consoleSpies.forEach(spy => expect(spy).not.toHaveBeenCalled())
    } finally {
      jest.restoreAllMocks()
    }
  })

  it("returns undefined without constructing either provider when the reader reports disabled", () => {
    expect(getNotificationService(contact)).toBeUndefined()

    expect(readConfiguration).toHaveBeenCalledTimes(1)
    expect(readConfiguration).toHaveBeenCalledWith(contact)
    expect(resendConstructor).not.toHaveBeenCalled()
    expect(sendGridConstructor).not.toHaveBeenCalled()
  })

  it.each(selections)(
    "constructs only $name and forwards the validated configuration unchanged",
    ({
      source,
      configuration,
      warnings,
      selectedConstructor,
      otherConstructor,
      expectedService,
    }) => {
      readConfiguration.mockReturnValue({ configuration, warnings })

      expect(getNotificationService(source)).toBe(expectedService)

      expect(readConfiguration).toHaveBeenCalledTimes(1)
      expect(readConfiguration).toHaveBeenCalledWith(source)
      expect(selectedConstructor).toHaveBeenCalledTimes(1)
      expect(selectedConstructor).toHaveBeenCalledWith(configuration)
      expect(otherConstructor).not.toHaveBeenCalled()
    }
  )

  it("passes process.env to the shared reader when no source is supplied", () => {
    expect(getNotificationService()).toBeUndefined()

    expect(readConfiguration).toHaveBeenCalledTimes(1)
    expect(readConfiguration).toHaveBeenCalledWith(process.env)
    expect(resendConstructor).not.toHaveBeenCalled()
    expect(sendGridConstructor).not.toHaveBeenCalled()
  })

  it("propagates shared validation failures before constructing any provider", () => {
    const failure = new globalThis.Error("Synthetic shared validation failure")
    readConfiguration.mockImplementationOnce(() => {
      throw failure
    })

    expect(() => getNotificationService(contact)).toThrow(failure)

    expect(readConfiguration).toHaveBeenCalledTimes(1)
    expect(readConfiguration).toHaveBeenCalledWith(contact)
    expect(resendConstructor).not.toHaveBeenCalled()
    expect(sendGridConstructor).not.toHaveBeenCalled()
  })

  // Initialization failure is independent of the alias; cover each provider once.
  it.each(selections.slice(0, 2))(
    "propagates $name initialization failures without falling back or disabling notifications",
    ({ source, configuration, selectedConstructor, otherConstructor }) => {
      const failure = new globalThis.Error(
        "Synthetic provider initialization failure"
      )
      readConfiguration.mockReturnValue({ configuration, warnings: [] })
      selectedConstructor.mockImplementationOnce(() => {
        throw failure
      })

      expect(() => getNotificationService(source)).toThrow(failure)

      expect(selectedConstructor).toHaveBeenCalledTimes(1)
      expect(otherConstructor).not.toHaveBeenCalled()
    }
  )
})
