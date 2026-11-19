import { it } from "@jest/globals"
import { getNotificationConfiguration } from "../../lib/env"

it("has valid notification settings in the actual environment", () => {
  // Do not replace process.env or fill missing settings from example.env.
  // Let validation errors fail the check without logging credentials or results.
  const { warnings } = getNotificationConfiguration(process.env)
  warnings.forEach(warning => console.warn(warning))
})
