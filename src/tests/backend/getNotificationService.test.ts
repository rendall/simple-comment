import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import * as notificationEnv from "../../lib/env"
import * as sharedUtilities from "../../lib/shared-utilities"
import type { NotificationConfiguration } from "../../lib/env"
import type { AbstractNotificationService } from "../../lib/AbstractNotificationService"
import { getNotificationService } from "../../lib/getNotificationService"

jest.mock("dotenv", () => ({ config: jest.fn() }))
jest.mock("../../lib/ResendNotificationService", () => ({
  ResendNotificationService: jest.fn(),
}))
jest.mock("../../lib/SendGridNotificationService", () => ({
  SendGridNotificationService: jest.fn(),
}))

type ServiceConstructor = (
  configuration: NotificationConfiguration
) => AbstractNotificationService
const resendConstructor = jest.requireMock<{
  ResendNotificationService: jest.Mock<ServiceConstructor>
}>("../../lib/ResendNotificationService").ResendNotificationService
const sendGridConstructor = jest.requireMock<{
  SendGridNotificationService: jest.Mock<ServiceConstructor>
}>("../../lib/SendGridNotificationService").SendGridNotificationService
const originalEnv = process.env
const resendService: AbstractNotificationService = {
  notifyModerators: jest.fn<AbstractNotificationService["notifyModerators"]>(),
}
const sendGridService: AbstractNotificationService = {
  notifyModerators: jest.fn<AbstractNotificationService["notifyModerators"]>(),
}

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

// Use real environment reading and stub only the provider constructors.
// notification.configuration.test.ts already covers the build validation rules.
const selections = [
  {
    name: "Resend",
    source: {
      ...contact,
      RESEND_API_KEY: resendConfiguration.apiKey,
      RESEND_FROM: resendConfiguration.from,
    },
    configuration: resendConfiguration,
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
    selectedConstructor: sendGridConstructor,
    otherConstructor: resendConstructor,
    expectedService: sendGridService,
  },
  {
    name: "legacy SendGrid",
    source: {
      ...contact,
      NOTIFICATION_SERVICE_API_KEY: sendGridConfiguration.apiKey,
      SENDGRID_VERIFIED_SENDER: sendGridConfiguration.from,
    },
    configuration: sendGridConfiguration,
    selectedConstructor: sendGridConstructor,
    otherConstructor: resendConstructor,
    expectedService: sendGridService,
  },
]

describe("notification service construction resolver", () => {
  let consoleSpies: jest.SpiedFunction<typeof console.error>[]
  let validateConfiguration: jest.SpiedFunction<
    typeof notificationEnv.getNotificationConfiguration
  >
  let validateEmail: jest.SpiedFunction<typeof sharedUtilities.validateEmail>

  beforeEach(() => {
    // Explicit sources must win over a different, otherwise valid environment.
    process.env = {
      NODE_ENV: "production",
      RESEND_API_KEY: "re_synthetic_ambient_key",
      RESEND_FROM: "ambient-sender@example.com",
      SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL: "ambient-moderator@example.com",
    }
    validateConfiguration = jest.spyOn(
      notificationEnv,
      "getNotificationConfiguration"
    )
    validateEmail = jest.spyOn(sharedUtilities, "validateEmail")
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
      process.env = originalEnv
    }
  })

  it("returns undefined without constructing either provider when notifications are unconfigured", () => {
    expect(getNotificationService(contact)).toBeUndefined()

    expect(resendConstructor).not.toHaveBeenCalled()
    expect(sendGridConstructor).not.toHaveBeenCalled()
  })

  it.each(selections)(
    "constructs only $name from the supplied environment settings",
    ({
      source,
      configuration,
      selectedConstructor,
      otherConstructor,
      expectedService,
    }) => {
      expect(getNotificationService(source)).toBe(expectedService)

      expect(selectedConstructor).toHaveBeenCalledTimes(1)
      expect(selectedConstructor).toHaveBeenCalledWith(configuration)
      expect(otherConstructor).not.toHaveBeenCalled()
    }
  )

  it("uses process.env when no explicit source is supplied", () => {
    process.env = { NODE_ENV: "production", ...selections[0].source }

    expect(getNotificationService()).toBe(resendService)

    expect(resendConstructor).toHaveBeenCalledTimes(1)
    expect(resendConstructor).toHaveBeenCalledWith(resendConfiguration)
    expect(sendGridConstructor).not.toHaveBeenCalled()
  })

  describe.each([
    { name: "disabled notifications", source: contact },
    ...selections.map(({ name, source }) => ({ name, source })),
  ])("with $name", ({ source }) => {
    it("does not run build-time configuration validation", () => {
      getNotificationService(source)

      expect(validateConfiguration).toHaveBeenCalledTimes(0)
    })

    it("does not validate sender or recipient email addresses", () => {
      getNotificationService(source)

      expect(validateEmail).toHaveBeenCalledTimes(0)
    })
  })

  // Initialization failure is independent of the alias; cover each provider once.
  it.each(selections.slice(0, 2))(
    "propagates $name initialization failures without falling back or disabling notifications",
    ({ source, selectedConstructor, otherConstructor }) => {
      const failure = new globalThis.Error(
        "Synthetic provider initialization failure"
      )
      selectedConstructor.mockImplementationOnce(() => {
        throw failure
      })

      expect(() => getNotificationService(source)).toThrow(failure)

      expect(selectedConstructor).toHaveBeenCalledTimes(1)
      expect(otherConstructor).not.toHaveBeenCalled()
    }
  )
})
