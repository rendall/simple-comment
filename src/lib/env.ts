import { config as dotenvConfig } from "dotenv"

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

export const getNotificationConfiguration = (
  source: NodeJS.ProcessEnv
): NotificationConfigurationResult => {
  const configuredProviders = notificationProviders.filter(
    ({ apiKeyName, senderName }) =>
      source[apiKeyName] !== undefined || source[senderName] !== undefined
  )

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

  return {
    configuration: {
      provider: selected.provider,
      apiKey: getRequiredNotificationSetting(source, selected.apiKeyName),
      from: getRequiredNotificationSetting(source, selected.senderName),
      moderatorContactEmails: getOptionalModeratorContactEmails(source) ?? [],
    },
    warnings: [],
  }
}
