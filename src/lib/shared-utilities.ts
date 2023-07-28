import type {
  InvalidResult,
  ValidResult,
  ValidationResult,
} from "./simple-comment-types"

export const isValidResult = (
  validation: ValidationResult
): validation is ValidResult => validation.isValid

export const validateUserId = (userId: string): ValidationResult => {
  if (typeof userId !== "string")
    return {
      isValid: false,
      reason: `Invalid user id '${userId}'`,
    } as InvalidResult

  type Validation = [(userId: string) => boolean, (id?: string) => string]
  const validations: Validation[] = [
    [
      id => id.length < 5,
      id =>
        `'${id}' has only ${id?.length} characters, but it must be at least 5 characters long.`,
    ],
    [
      id => id.length > 36,
      id =>
        `'${id}' has ${id?.length} characters, but it must be no more than 36 characters long.`,
    ],
    [
      id => id.match(/[^a-z0-9-_]/g) !== null,
      id =>
        `'${id}' must have only lower-case letters, numbers and the characters - and _, but '${id}' contains ${id?.match(
          /[^a-z0-9-_]/g
        )}`,
    ],
  ]

  const validation = validations.reduce<ValidationResult>(
    (result: ValidationResult, [predicate, reason]: Validation) => {
      if (predicate(userId)) {
        if (isValidResult(result)) {
          return { isValid: false, reason: reason(userId) } as InvalidResult
        } else {
          return {
            isValid: false,
            reason: `${result.reason} ${reason(userId)}`,
          } as InvalidResult
        }
      }
      return result
    },
    { isValid: true } as ValidResult
  )

  return validation
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.length === 0)
    return { isValid: false, reason: "Email is required." }
  const isValid = email.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i)
  if (isValid) return { isValid: true }
  else
    return {
      isValid: false,
      reason: `'${email}' is not a valid email address.`,
    }
}

// This validation is intended to be as broad as possible but
// may still get it wrong in your use case
// (q.v. https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/ )
export const validateDisplayName = (name: string): ValidationResult => {
  if (name.length === 0)
    return { isValid: false, reason: "Display name is necessary." }
  if (name.length < 2)
    return { isValid: false, reason: "Display name is too short." }
  if (name.length > 100)
    return { isValid: false, reason: "Display name is too long." }
  return { isValid: true }
}
