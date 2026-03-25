/**
 * @jest-environment jsdom
 */
import {
  debounceFunc,
  longFormatDate,
  threadComments,
} from "../../frontend-utilities"
import { Comment, Discussion } from "../../lib/simple-comment-types"
import mockDiscussion from "../mockDiscussion.json"

describe("threadComments", () => {
  const countThreadedReplies = <T extends { replies?: unknown[] }>(
    comment: T
  ): number =>
    (comment.replies ?? []).reduce<number>(
      (total, reply) => total + 1 + countThreadedReplies(reply as T),
      0
    )

  const countReachableReplyGroups = (
    rootId: string,
    replies: { id: string; parentId?: string | null }[]
  ) => {
    const childrenByParent = replies.reduce(
      (groups, reply) =>
        reply.parentId
          ? {
              ...groups,
              [reply.parentId]: [...(groups[reply.parentId] ?? []), reply],
            }
          : groups,
      {} as Record<string, { id: string; parentId?: string | null }[]>
    )

    const countChildGroups = (commentId: string): number => {
      const children = childrenByParent[commentId] ?? []
      return children.length === 0
        ? 0
        : 1 +
            children.reduce(
              (total, child) => total + countChildGroups(child.id),
              0
            )
    }

    return countChildGroups(rootId)
  }

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

  it("should thread mockDiscussion.json with one sibling sort per reply group", () => {
    const topic = mockDiscussion as unknown as Discussion
    const topicReplies = topic.replies as Comment[]
    const expectedSortCalls = countReachableReplyGroups(topic.id, topicReplies)
    const sortSpy = jest.spyOn(Array.prototype, "sort")

    const threadedTopic = threadComments(topic, topicReplies)

    expect(sortSpy).toHaveBeenCalledTimes(expectedSortCalls)
    expect(countThreadedReplies(threadedTopic)).toBe(topicReplies.length)

    sortSpy.mockRestore()
  })

  it("should thread 2000 flat replies with a single sibling sort", () => {
    const largeCommentsArray = Array.from({ length: 2000 }, (_, index) => ({
      id: `reply-${String(index).padStart(4, "0")}`,
      parentId: "large-topic",
    }))
    const topic: {
      id: string
      parentId: null
      replies?: typeof largeCommentsArray
    } = { id: "large-topic", parentId: null }
    const sortSpy = jest.spyOn(Array.prototype, "sort")

    const threadedTopic = threadComments(topic, largeCommentsArray)

    expect(sortSpy).toHaveBeenCalledTimes(1)
    expect(threadedTopic.replies).toHaveLength(2000)
    expect(countThreadedReplies(threadedTopic)).toBe(largeCommentsArray.length)
    expect(
      threadedTopic.replies?.every(
        (reply: {
          id: string
          parentId?: string | null
          replies?: unknown[]
        }) => !reply.replies
      )
    ).toBe(true)

    sortSpy.mockRestore()
  })
})

describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it("calls as expected", () => {
    const callingArgument = "debounce it!"
    const debounceCallback = jest.fn()
    const debounce = debounceFunc(debounceCallback)

    debounce(callingArgument)

    jest.advanceTimersByTime(250)

    expect(debounceCallback).toHaveBeenCalledWith(callingArgument)
  })

  it("does not call immediately", () => {
    const debounceCallback = jest.fn()
    const debounce = debounceFunc(debounceCallback)

    debounce()

    expect(debounceCallback).not.toHaveBeenCalled()

    jest.advanceTimersByTime(249)
    expect(debounceCallback).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(debounceCallback).toHaveBeenCalledTimes(1)
  })

  it("never calls callback while it is continuously retriggered", () => {
    const debounceCallback = jest.fn()
    const debounce = debounceFunc(debounceCallback)

    for (let index = 0; index < 10; index++) {
      debounce()
      jest.advanceTimersByTime(50)
    }

    expect(debounceCallback).not.toHaveBeenCalled()
  })

  it("calls after its wait time", () => {
    const waitTime = 1000
    const debounceCallback = jest.fn()
    const debounce = debounceFunc(debounceCallback, waitTime)

    debounce()

    jest.advanceTimersByTime(waitTime - 1)
    expect(debounceCallback).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(debounceCallback).toHaveBeenCalledTimes(1)
  })

  it("calls once only after debounce ends", () => {
    const debounceCallback = jest.fn()
    const debounce = debounceFunc(debounceCallback)

    for (let index = 0; index < 4; index++) {
      debounce()
      jest.advanceTimersByTime(50)
    }

    expect(debounceCallback).not.toHaveBeenCalled()

    jest.advanceTimersByTime(199)
    expect(debounceCallback).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(debounceCallback).toHaveBeenCalledTimes(1)
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

  it.each(locales)("formats %s for Date input", locale => {
    const result = longFormatDate(utcDate, locale)
    const formatter = new Intl.DateTimeFormat(locale, dateFormatOptions)

    expect(result).toBe(formatter.format(utcDate))
  })

  it("should handle undefined date", () => {
    const result = longFormatDate(undefined)
    expect(result).toBe("unknown")
  })

  it.each(locales)("formats %s for ISO UTC string input", locale => {
    const result = longFormatDate(utcDateString, locale)
    const formatter = new Intl.DateTimeFormat(locale, dateFormatOptions)

    expect(result).toBe(formatter.format(new Date(utcDateString)))
  })

  it("should handle invalid date", () => {
    const date = "invalid date"
    const result = longFormatDate(date)
    expect(result).toBe("Invalid Date")
  })
})
