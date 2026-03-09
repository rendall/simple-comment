import { config as dotenvConfig } from "dotenv"

dotenvConfig()

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

export type BackendEnv = Readonly<{
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

export const getBackendEnv = (source: NodeJS.ProcessEnv = process.env) =>
  ({
    dbConnectionString: getRequiredEnv(source, "DB_CONNECTION_STRING"),
    databaseName: getRequiredEnv(source, "DATABASE_NAME"),
    jwtSecret: getRequiredEnv(source, "JWT_SECRET"),
    allowOrigin: getRequiredEnv(source, "ALLOW_ORIGIN"),
    moderatorId: getRequiredEnv(source, "SIMPLE_COMMENT_MODERATOR_ID"),
    moderatorPassword: getRequiredEnv(
      source,
      "SIMPLE_COMMENT_MODERATOR_PASSWORD"
    ),
    moderatorContactEmail: getRequiredEnv(
      source,
      "SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL"
    ),
    isCrossSite: source.IS_CROSS_SITE === "true",
    notificationServiceApiKey: source.NOTIFICATION_SERVICE_API_KEY,
    sendGridVerifiedSender: source.SENDGRID_VERIFIED_SENDER,
  } as BackendEnv)

export const getOptionalNotificationEnv = (
  source: NodeJS.ProcessEnv = process.env
): {
  notificationServiceApiKey?: string
  sendGridVerifiedSender?: string
} => {
  const notificationServiceApiKey = source.NOTIFICATION_SERVICE_API_KEY
  const sendGridVerifiedSender = source.SENDGRID_VERIFIED_SENDER

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
