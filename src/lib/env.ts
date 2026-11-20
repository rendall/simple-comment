import { config as dotenvConfig } from "dotenv"
import { validateEmail } from "./shared-utilities"

if (process.env.NODE_ENV !== "production") {
  dotenvConfig()
}

type RequiredBackendEnvKey =
  | "DB_CONNECTION_STRING"
  | "DATABASE_NAME"
  | "JWT_SECRET"
  | "ALLOW_ORIGIN"
  | "SIMPLE_COMMENT_MODERATOR_ID"
  | "SIMPLE_COMMENT_MODERATOR_PASSWORD"
  | "SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL"

export class EnvContractError extends Error {
  readonly key: string

  constructor(key: string, message: string) {
    super(message)
    this.name = "EnvContractError"
    this.key = key
  }
}

const missingKeyError = (key: string) =>
  new EnvContractError(key, `${key} is not set in environment variables`)

const getRequiredEnv = (
  source: NodeJS.ProcessEnv,
  key: RequiredBackendEnvKey
): string => {
  const value = source[key]
  if (value === undefined) throw missingKeyError(key)
  return value
}

type BackendEnv = Readonly<{
  dbConnectionString: string
  databaseName: string
  jwtSecret: string
  allowOrigin: string
  moderatorId: string
  moderatorPassword: string
  moderatorContactEmail: string
  isCrossSite: boolean
  notificationServiceApiKey?: string
  sendGridVerifiedSender?: string
}>

export const getBackendEnv = (source?: NodeJS.ProcessEnv) => {
  const env = source ?? process.env

  return {
    dbConnectionString: getRequiredEnv(env, "DB_CONNECTION_STRING"),
    databaseName: getRequiredEnv(env, "DATABASE_NAME"),
    jwtSecret: getRequiredEnv(env, "JWT_SECRET"),
    allowOrigin: getRequiredEnv(env, "ALLOW_ORIGIN"),
    moderatorId: getRequiredEnv(env, "SIMPLE_COMMENT_MODERATOR_ID"),
    moderatorPassword: getRequiredEnv(env, "SIMPLE_COMMENT_MODERATOR_PASSWORD"),
    moderatorContactEmail: getRequiredEnv(
      env,
      "SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL"
    ),
    isCrossSite: env.IS_CROSS_SITE === "true",
    notificationServiceApiKey: env.NOTIFICATION_SERVICE_API_KEY,
    sendGridVerifiedSender: env.SENDGRID_VERIFIED_SENDER,
  } as BackendEnv
}

export const getOptionalNotificationEnv = (
  source: NodeJS.ProcessEnv | undefined = process.env,
  notificationServiceApiKeyOverride?: string
): {
  notificationServiceApiKey?: string
  sendGridVerifiedSender?: string
} => {
  const env = source ?? process.env
  const notificationServiceApiKey =
    notificationServiceApiKeyOverride ?? env.NOTIFICATION_SERVICE_API_KEY
  const sendGridVerifiedSender = env.SENDGRID_VERIFIED_SENDER

  const hasApiKey = notificationServiceApiKey !== undefined
  const hasVerifiedSender = sendGridVerifiedSender !== undefined

  if (hasApiKey && !hasVerifiedSender) {
    throw missingKeyError("SENDGRID_VERIFIED_SENDER")
  }

  if (!hasApiKey && hasVerifiedSender) {
    throw missingKeyError("NOTIFICATION_SERVICE_API_KEY")
  }

  return { notificationServiceApiKey, sendGridVerifiedSender }
}

export const getOptionalModeratorContactEmails = (
  source: NodeJS.ProcessEnv | undefined = process.env
): string[] | undefined => {
  const env = source ?? process.env
  const rawContactEmails = env.SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL

  if (rawContactEmails === undefined) {
    return undefined
  }

  return rawContactEmails
    .split(",")
    .map(email => email.trim())
    .filter(email => email.length > 0)
}

export type NotificationConfiguration = {
  provider: "resend" | "sendgrid"
  apiKey: string
  from: string
  moderatorContactEmails: string[]
}

export type NotificationConfigurationResult = {
  configuration: NotificationConfiguration | undefined
  warnings: string[]
}

const notificationProviders = [
  {
    provider: "resend",
    apiKeyName: "RESEND_API_KEY",
    senderName: "RESEND_FROM",
  },
  {
    provider: "sendgrid",
    apiKeyName: "SENDGRID_API_KEY",
    senderName: "SENDGRID_VERIFIED_SENDER",
  },
] as const

const legacySendGridApiKeyName = "NOTIFICATION_SERVICE_API_KEY"

const readNotificationProviders = (source: NodeJS.ProcessEnv) => {
  const moderatorContactEmails = getOptionalModeratorContactEmails(source) ?? []

  return notificationProviders.flatMap(
    ({ provider, apiKeyName, senderName }) => {
      const keyName =
        provider === "sendgrid" &&
        source[legacySendGridApiKeyName] !== undefined
          ? legacySendGridApiKeyName
          : apiKeyName

      if (source[keyName] === undefined && source[senderName] === undefined) {
        return []
      }

      return [
        {
          apiKeyName: keyName,
          senderName,
          configuration: {
            provider,
            apiKey: source[keyName]!,
            from: source[senderName]!,
            moderatorContactEmails,
          },
        },
      ]
    }
  )
}

// Runtime reads settings already checked by the build. Builds and Functions
// must receive the same settings; this reader intentionally does not validate.
export const readNotificationConfiguration = (
  source: NodeJS.ProcessEnv
): NotificationConfiguration | undefined =>
  readNotificationProviders(source)[0]?.configuration

const getRequiredNotificationSetting = (
  source: NodeJS.ProcessEnv,
  key: string
): string => {
  const value = source[key]
  if (value === undefined || value.trim().length === 0) {
    throw new EnvContractError(
      key,
      `${key} is required and must not be empty when configuring notifications`
    )
  }
  return value
}

const validateNotificationSender = (
  source: NodeJS.ProcessEnv,
  key: string
): void => {
  const sender = getRequiredNotificationSetting(source, key)
  // Extract candidates first; validate their contents and wrapper separately.
  const displayAddress = sender.match(/(.*)<(.*)>/)
  const name = displayAddress?.[1].trim() ?? ""
  const email = (displayAddress?.[2] ?? sender).trim()

  if (/[\r\n]/.test(sender)) {
    throw new EnvContractError(key, `${key} must not contain line breaks.`)
  }

  if (
    /[<>]/.test(name) ||
    /[<>]/.test(email) ||
    (displayAddress && displayAddress[0].trim() !== sender.trim())
  ) {
    throw new EnvContractError(
      key,
      `${key} must contain one sender with matching angle brackets in Name <address> format, or a plain email address.`
    )
  }

  if (displayAddress) {
    const quotedName = name.match(/^"([^"]*)"$/)
    const displayName = (quotedName?.[1] ?? name).trim()
    if (!displayName || (!quotedName && name.includes('"'))) {
      throw new EnvContractError(
        key,
        `${key} must have a nonempty display name, with matching quotes if quoted.`
      )
    }

    // A comma in a name is fine; a preceding email address is another sender.
    const nameParts = name.split(/[;,]/)
    if (
      !quotedName &&
      nameParts.length > 1 &&
      nameParts.some(part => validateEmail(part.trim()).isValid)
    ) {
      throw new EnvContractError(
        key,
        `${key} must contain one sender email address. Sender lists are not allowed.`
      )
    }
  }

  const validation = validateEmail(email)
  if (!validation.isValid) {
    // This limits what errors quote; validateEmail still decides validity.
    // Tokens and connection URLs should not become build-log output.
    const looksLikeMailbox = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z0-9.-]+$/i.test(
      email
    )
    const containsApiKey = [
      ...notificationProviders.map(({ apiKeyName }) => source[apiKeyName]),
      source[legacySendGridApiKeyName],
    ].some(value => {
      const apiKey = value?.trim()
      return Boolean(apiKey && email.includes(apiKey))
    })
    const explanation =
      looksLikeMailbox && !containsApiKey
        ? validation.reason
        : "Must contain one valid email address, either alone or inside the display name's angle brackets."
    throw new EnvContractError(key, `${key}: ${explanation}`)
  }
}

const validateNotificationRecipients = (
  source: NodeJS.ProcessEnv,
  recipients: string[]
): void => {
  const key = "SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL"
  const rawRecipients = getRequiredNotificationSetting(source, key)

  if (
    /[\r\n]/.test(rawRecipients) ||
    recipients.length === 0 ||
    recipients.some(email => !validateEmail(email).isValid)
  ) {
    throw new EnvContractError(
      key,
      `${key} must contain at least one valid plain email address. Separate addresses with commas; display names, angle brackets, and line breaks are not allowed.`
    )
  }
}

export const getNotificationConfiguration = (
  source: NodeJS.ProcessEnv
): NotificationConfigurationResult => {
  const hasLegacySendGridKey = source[legacySendGridApiKeyName] !== undefined
  if (hasLegacySendGridKey && source.SENDGRID_API_KEY !== undefined) {
    throw new EnvContractError(
      legacySendGridApiKeyName,
      "Both SENDGRID_API_KEY and NOTIFICATION_SERVICE_API_KEY are defined. Remove NOTIFICATION_SERVICE_API_KEY and keep SENDGRID_API_KEY."
    )
  }

  const configuredProviders = readNotificationProviders(source)

  if (configuredProviders.length > 1) {
    throw new EnvContractError(
      "NOTIFICATION_PROVIDERS",
      "Multiple notification providers are configured: Resend and SendGrid. Configure only one provider."
    )
  }

  const selected = configuredProviders[0]
  if (selected === undefined) {
    return { configuration: undefined, warnings: [] }
  }

  getRequiredNotificationSetting(source, selected.apiKeyName)
  validateNotificationSender(source, selected.senderName)
  validateNotificationRecipients(
    source,
    selected.configuration.moderatorContactEmails
  )

  return {
    configuration: selected.configuration,
    warnings: hasLegacySendGridKey
      ? [
          "NOTIFICATION_SERVICE_API_KEY is deprecated. Use SENDGRID_API_KEY instead.",
        ]
      : [],
  }
}
