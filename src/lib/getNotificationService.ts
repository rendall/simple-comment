import type { AbstractNotificationService } from "./AbstractNotificationService"
import { readNotificationConfiguration } from "./env"
import { ResendNotificationService } from "./ResendNotificationService"
import { SendGridNotificationService } from "./SendGridNotificationService"

export const getNotificationService = (
  source: NodeJS.ProcessEnv = process.env
): AbstractNotificationService | undefined => {
  const configuration = readNotificationConfiguration(source)
  if (configuration === undefined) return undefined

  switch (configuration.provider) {
    case "resend":
      return new ResendNotificationService(configuration)
    case "sendgrid":
      return new SendGridNotificationService(configuration)
  }
}
