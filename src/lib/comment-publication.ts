import isURL from "validator/lib/isURL"
import {
  normalizeModerationText,
  readModerationTerms,
} from "./moderation-terms"

const containsLink = (text: string) =>
  text.split(/[\s<>(){}[\]"'`*,;]+/).some(token => {
    const candidate = token
      .replace(/^[!?]+|[.!?:]+$/g, "")
      .replace(/^[a-z]+(?=:\/\/)/i, scheme => scheme.toLowerCase())
    const explicitLink = /^(?:(?:https?|ftp):)?\/\//.test(candidate)

    return isURL(candidate, {
      allow_protocol_relative_urls: true,
      disallow_auth: !explicitLink,
      require_tld: !explicitLink,
      validate_length: false,
    })
  })

export type PublicationDecision =
  | { isApproved: true }
  | { isApproved: false; heldReason: string }

let moderationTerms: readonly string[] | undefined

const containsModerationTerm = (text: string) => {
  if (!moderationTerms) {
    try {
      moderationTerms = readModerationTerms()
    } catch {
      console.error(
        "The moderation terms file could not be loaded. Term filtering is disabled."
      )
      moderationTerms = []
    }
  }

  const normalized = normalizeModerationText(text)
  return moderationTerms.some(term => normalized.includes(term))
}

export const getCommentPublication = (
  text: string,
  isModerator: boolean
): PublicationDecision => {
  if (isModerator) return { isApproved: true }

  const reasons: string[] = []
  if (containsLink(text))
    reasons.push("This comment contains a link and requires review.")
  if (containsModerationTerm(text))
    reasons.push("This comment contains a word or phrase that requires review.")

  return reasons.length
    ? { isApproved: false, heldReason: reasons.join(" ") }
    : { isApproved: true }
}
