/* eslint-disable @typescript-eslint/ban-ts-comment */
import { joinValidations, validateUserId } from "../../lib/shared-utilities" // replace with your actual module
import type {
  InvalidResult,
  ValidationResult,
} from "../../lib/simple-comment-types"

describe("joinValidations", () => {
  it("returns valid result when all validations are valid", () => {
    const validations: ValidationResult[] = [
      { isValid: true },
      { isValid: true },
      { isValid: true },
    ]

    const result = joinValidations(validations)

    expect(result).toEqual({ isValid: true })
  })

  it("returns invalid result with combined reason when all validations are invalid", () => {
    const validations: ValidationResult[] = [
      { isValid: false, reason: "Error 1" },
      { isValid: false, reason: "Error 2" },
      { isValid: false, reason: "Error 3" },
    ]

    const result = joinValidations(validations)

    expect(result).toEqual({
      isValid: false,
      reason: "Error 1 Error 2 Error 3",
    })
  })

  it("returns invalid result with combined reason when some validations are invalid", () => {
    const validations: ValidationResult[] = [
      { isValid: true },
      { isValid: false, reason: "Error 2" },
      { isValid: true },
      { isValid: false, reason: "Error 4" },
    ]

    const result = joinValidations(validations)

    expect(result).toEqual({ isValid: false, reason: "Error 2 Error 4" })
  })

  it("returns valid result when there are no validations", () => {
    const validations: ValidationResult[] = []

    const result = joinValidations(validations)

    expect(result).toEqual({ isValid: true })
  })
})

describe("validateUserId", () => {
  it("should return valid for a valid user id", () => {
    const result = validateUserId("valid-id")
    expect(result.isValid).toBe(true)
  })
  it("should return invalid for an null user id", () => {
    // @ts-ignore
    const result = validateUserId(null) as InvalidResult
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe("Invalid user id 'null'")
  })
  it("should return invalid for an undefined user id", () => {
    // @ts-ignore
    const result = validateUserId(undefined) as InvalidResult
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe("Invalid user id 'undefined'")
  })
  it("should return invalid for a non-string user id", () => {
    // @ts-ignore
    const result = validateUserId(12345) as InvalidResult
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe("Invalid user id '12345'")
  })

  it("should return invalid for a user id shorter than 5 characters", () => {
    const result = validateUserId("id") as InvalidResult
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe(
      "'id' has only 2 characters, but it must be at least 5 characters long."
    )
  })

  it("should return invalid for a user id longer than 36 characters", () => {
    const result = validateUserId(
      "this-is-a-very-long-user-id-that-is-more-than-36-characters"
    ) as InvalidResult
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe(
      "'this-is-a-very-long-user-id-that-is-more-than-36-characters' has 59 characters, but it must be no more than 36 characters long."
    )
  })

  it("should return invalid for a user id with invalid characters", () => {
    const result = validateUserId("invalid$id") as InvalidResult
    expect(result.isValid).toBe(false)
    expect(result.reason).toBe(
      "'invalid$id' must have only lower-case letters, numbers and the characters - and _, but 'invalid$id' contains $"
    )
  })

  it("should return invalid for a user id with multiple issues", () => {
    const result = validateUserId("i$#") as InvalidResult
    expect(result.isValid).toBe(false)
    expect(result.reason).toContain(
      "'i$#' has only 3 characters, but it must be at least 5 characters long."
    )
    expect(result.reason).toContain(
      "'i$#' must have only lower-case letters, numbers and the characters - and _, but 'i$#' contains $,#"
    )
  })
})
