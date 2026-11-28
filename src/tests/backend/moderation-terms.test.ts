import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { readModerationTerms } from "../../lib/moderation-terms"

describe("Private moderation terms", () => {
  let directory: string
  let file: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "simple-comment-terms-"))
    file = join(directory, "moderation-terms.txt")
  })

  afterEach(() => rmSync(directory, { recursive: true }))

  test("accepts absent and empty files", () => {
    expect(readModerationTerms(file)).toEqual([])
    writeFileSync(file, "\n # Comments and blank lines\r\n\n")
    expect(readModerationTerms(file)).toEqual([])
  })

  test("normalizes literal terms and skips blank and comment lines", () => {
    writeFileSync(file, "# Fixture\n PAPER CRANE  \r\n\nCafe\u0301\n(a+b)\n")
    expect(readModerationTerms(file)).toEqual(["paper crane", "café", "(a+b)"])
  })

  test("rejects an unreadable path and invalid UTF-8", () => {
    expect(() => readModerationTerms(directory)).toThrow(/readable UTF-8/)
    writeFileSync(file, Buffer.from([0xff, 0xfe]))
    expect(() => readModerationTerms(file)).toThrow(/readable UTF-8/)
  })

  test("fails open on a file error while still holding links", () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined)
    try {
      jest.isolateModules(() => {
        const terms = jest.requireActual<
          typeof import("../../lib/moderation-terms")
        >("../../lib/moderation-terms")
        jest.spyOn(terms, "readModerationTerms").mockImplementation(() => {
          throw new Error("private fixture details")
        })
        const { getCommentPublication } = jest.requireActual<
          typeof import("../../lib/comment-publication")
        >("../../lib/comment-publication")
        expect(getCommentPublication("Plain comment", false)).toEqual({
          isApproved: true,
        })
        expect(getCommentPublication("Link example.org", false)).toEqual({
          isApproved: false,
          heldReason: "This comment contains a link and requires review.",
        })
      })
      expect(log).toHaveBeenCalledTimes(1)
      expect(log).toHaveBeenCalledWith(
        "The moderation terms file could not be loaded. Term filtering is disabled."
      )
    } finally {
      jest.restoreAllMocks()
    }
  })
})
