import { readFileSync } from "node:fs"
import { TextDecoder } from "node:util"

export const normalizeModerationText = (text: string) =>
  text.normalize("NFC").toLowerCase()

export const readModerationTerms = (
  path = "moderation-terms.txt"
): string[] => {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(
      readFileSync(path)
    )
    if (text.includes("\0")) throw new Error("Invalid plain text")

    return text
      .split(/\r\n?|\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith("#"))
      .map(normalizeModerationText)
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return []
    throw Object.assign(
      new Error("The moderation terms file must be readable UTF-8 plain text."),
      { cause: error }
    )
  }
}
