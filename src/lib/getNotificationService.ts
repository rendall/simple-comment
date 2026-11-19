import type { AbstractNotificationService } from "./AbstractNotificationService"
import { getNotificationConfiguration } from "./env"
import { ResendNotificationService } from "./ResendNotificationService"
import { SendGridNotificationService } from "./SendGridNotificationService"

export const getNotificationService = (
  source: NodeJS.ProcessEnv = process.env
): AbstractNotificationService | undefined => {
  // Configuration warnings are for CI; runtime initialization stays quiet.
  const { configuration } = getNotificationConfiguration(source)
  if (configuration === undefined) return undefined

  switch (configuration.provider) {
    case "resend":
      return new ResendNotificationService(configuration)
    case "sendgrid":
      return new SendGridNotificationService(configuration)
  }
}
