import isURL from "validator/lib/isURL"

const containsLink = (text: string) =>
  text.split(/[\s<>(){}[\]"'`*,;]+/).some(token => {
    const candidate = token
      .replace(/^[!?]+|[.!?:]+$/g, "")
      .replace(/^[a-z]+(?=:\/\/)/i, scheme => scheme.toLowerCase())
    const explicitLink = /^(?:(?:https?|ftp):)?\/\//.test(candidate)

    return isURL(candidate, {
      allow_protocol_relative_urls: true,
      disallow_auth: true,
      require_tld: !explicitLink,
      validate_length: false,
    })
  })

export type PublicationDecision =
  | { isApproved: true }
  | { isApproved: false; heldReason: string }

export const getCommentPublication = (
  text: string,
  isModerator: boolean
): PublicationDecision => {
  if (!isModerator && containsLink(text)) {
    return {
      isApproved: false,
      heldReason: "This comment contains a link and requires review.",
    }
  }

  return { isApproved: true }
}
