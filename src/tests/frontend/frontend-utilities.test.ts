/**
 * @jest-environment jsdom
 */
import { longFormatDate, threadComments } from "../../frontend-utilities"
import { Comment, Discussion } from "../../lib/simple-comment-types"
import { mockCommentTree, mockTopic } from "../mockData"
import { performance } from "perf_hooks"
import { debounceFunc } from "../../frontend-utilities"
import mockDiscussion from "../mockDiscussion.json"

describe("threadComments", () => {
  it("should thread comments correctly", () => {
    const comments = [
      { id: "1", parentId: null },
      { id: "2", parentId: "1" },
      { id: "3", parentId: "1" },
      { id: "4", parentId: "2" },
      { id: "5", parentId: "2" },
      { id: "6", parentId: "3" },
    ]

    const expected = {
      id: "1",
      parentId: null,
      replies: [
        {
          id: "2",
          parentId: "1",
          replies: [
            { id: "4", parentId: "2" },
            { id: "5", parentId: "2" },
          ],
        },
        {
          id: "3",
          parentId: "1",
          replies: [{ id: "6", parentId: "3" }],
        },
      ],
    }

    const result = threadComments(comments[0], comments)
    expect(result).toEqual(expected)
  })

  it("should thread mockDiscussion.json in under 0.1s", () => {
    const topic = mockDiscussion as unknown as Discussion

    const topicReplies = topic.replies as Comment[]

    const t0 = performance.now()

    threadComments(topic, topicReplies)

    const t1 = performance.now()

    expect(t1 - t0).toBeLessThan(100)
  })

  it("should thread flat array of 2000 comments in under 1s", () => {
    const topic = mockTopic()
    const largeCommentsArray = mockCommentTree(2000, undefined, [
      topic,
    ]) as Comment[]

    const t0 = performance.now()

    threadComments(topic, largeCommentsArray)

    const t1 = performance.now()

    expect(t1 - t0).toBeLessThan(1000)
  })
})

describe("debounce", () => {
  it("calls as expected", function (done) {
    const callingArgument = "debounce it!"
    const debounceCallback = (value: string) => {
      expect(value).toBe(callingArgument)
      done()
    }
    const debounce = debounceFunc(debounceCallback)
    debounce(callingArgument)
  })

  it("does not call immediately", function (done) {
    const startTime = new Date()
    const debounceCallback = () => {
      const duration = new Date().valueOf() - startTime.valueOf()
      expect(duration).toBeGreaterThan(200)
      done()
    }

    const debounce = debounceFunc(debounceCallback)

    debounce()
  })

  it("never calls callback if continuously called", function (done) {
    let numCalls = 0

    const debounceCallback = () => {
      numCalls++
    }
    const debounce = debounceFunc(debounceCallback)
    const testInterval = window.setInterval(() => debounce(), 50)
    const endTest = (toclear: number) => () => {
      clearInterval(toclear)
      expect(numCalls).toBe(0)
      done()
    }
    setTimeout(endTest(testInterval), 500)
  })

  it("calls after its wait time", function (done) {
    const waitTime = 1000
    const startTime = new Date().valueOf()

    expect.assertions(1)

    const debounceCallback = () => {
      const callTime = new Date().valueOf()
      expect(callTime - startTime).toBeGreaterThanOrEqual(waitTime)
      done()
    }
    const debounce = debounceFunc(debounceCallback, waitTime)
    debounce()
  })

  it("calls once only after debounce ends", function (done) {
    let numCalls = 0

    const debounceCallback = () => {
      numCalls++
    }
    const debounce = debounceFunc(debounceCallback)
    const testInterval = window.setInterval(() => debounce(), 50)
    const endInterval = (toclear: number) => () => {
      clearInterval(toclear)
    }

    const endTest = () => {
      expect(numCalls).toBe(1)
      done()
    }
    setTimeout(endInterval(testInterval), 200)
    setTimeout(endTest, 500)
  })
})

describe("longFormatDate", () => {
  const locales = [
    "af-ZA",
    "ar-SA",
    "de-DE",
    "el-GR",
    "en-AU",
    "en-GB",
    "en-IN",
    "en-US",
    "es-ES",
    "es-MX",
    "fi-FI",
    "fr-CA",
    "fr-FR",
    "he-IL",
    "hi-IN",
    "id-ID",
    "it-IT",
    "ja-JP",
    "ko-KR",
    "nl-NL",
    "pl-PL",
    "pt-BR",
    "pt-PT",
    "ru-RU",
    "sv-SE",
    "th-TH",
    "tr-TR",
    "vi-VN",
    "zh-CN",
    "zh-TW",
  ]
  const utcDate = new Date(Date.UTC(2023, 6, 23, 13, 31, 0))
  const utcDateString = "2023-07-23T13:31:00.000Z"
  const dateFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  } as const
  const localeFamily = (locale: string) => locale.split("-")[0]

  it.each(locales)(
    "supports locale %s and resolves locale family without silent fallback",
    locale => {
      expect(Intl.DateTimeFormat.supportedLocalesOf([locale])).toEqual([locale])
      const resolvedLocale = new Intl.DateTimeFormat(
        locale,
        dateFormatOptions
      ).resolvedOptions().locale
      expect(localeFamily(resolvedLocale)).toBe(localeFamily(locale))
    }
  )

  it.each(locales)(
    "formats %s with expected date/time parts for Date input",
    locale => {
      const result = longFormatDate(utcDate, locale)
      const formatter = new Intl.DateTimeFormat(locale, dateFormatOptions)
      const parts = formatter.formatToParts(utcDate)
      const partTypes = parts.map(part => part.type)

      expect(result).toBe(formatter.format(utcDate))
      expect(partTypes).toContain("year")
      expect(partTypes).toContain("month")
      expect(partTypes).toContain("day")
      expect(partTypes).toContain("hour")
      expect(partTypes).toContain("minute")
    }
  )

  it("should handle undefined date", () => {
    const result = longFormatDate(undefined)
    expect(result).toBe("unknown")
  })

  it.each(locales)(
    "formats %s with expected date/time parts for ISO UTC string input",
    locale => {
      const result = longFormatDate(utcDateString, locale)
      const formatter = new Intl.DateTimeFormat(locale, dateFormatOptions)
      const parts = formatter.formatToParts(new Date(utcDateString))
      const partTypes = parts.map(part => part.type)

      expect(result).toBe(formatter.format(new Date(utcDateString)))
      expect(partTypes).toContain("year")
      expect(partTypes).toContain("month")
      expect(partTypes).toContain("day")
      expect(partTypes).toContain("hour")
      expect(partTypes).toContain("minute")
    }
  )

  it("keeps localized integration rendering behavior for en-US", () => {
    const result = longFormatDate(utcDate, "en-US")
    const formatter = new Intl.DateTimeFormat("en-US", dateFormatOptions)
    expect(result).toBe(formatter.format(utcDate))
  })

  it("should handle invalid date", () => {
    const date = "invalid date"
    const result = longFormatDate(date)
    expect(result).toBe("Invalid Date")
  })
})
