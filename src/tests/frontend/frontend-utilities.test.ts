/**
 * @jest-environment jsdom
 */
import { longFormatDate, threadComments } from "../../frontend-utilities"
import { Comment } from "../../lib/simple-comment-types"
import { mockCommentTree, mockTopic } from "../mockData"
import { performance } from "perf_hooks"
import { debounceFunc } from "../../frontend-utilities"

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

  it("should thread flat array of 2000 comments in under 1s", () => {
    const topic = mockTopic()
    const largeCommentsArray = mockCommentTree(2000, undefined, [
      topic,
    ]) as Comment[] // replace this with your function to generate a large array of comments

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
  const localesArr = [
    ["af-ZA", "23 Julie 2023 13:31"],
    ["ar-SA", "٥ محرم ١٤٤٥ هـ في ١:٣١ م"],
    ["de-DE", "23. Juli 2023 um 13:31"],
    ["el-GR", "23 Ιουλίου 2023 - 1:31 μ.μ."],
    ["en-AU", "23 July 2023 at 1:31 pm"],
    ["en-GB", "23 July 2023 at 13:31"],
    ["en-IN", "23 July 2023 at 1:31 pm"],
    ["en-US", "July 23, 2023 at 1:31 PM"],
    ["es-ES", "23 de julio de 2023, 13:31"],
    ["es-MX", "23 de julio de 2023, 13:31"],
    ["fi-FI", "23. heinäkuuta 2023 klo 13.31"],
    ["fr-CA", "23 juillet 2023 à 13 h 31"],
    ["fr-FR", "23 juillet 2023 à 13:31"],
    ["he-IL", "23 ביולי 2023 בשעה 13:31"],
    ["hi-IN", "23 जुलाई 2023 को 1:31 pm"],
    ["id-ID", "23 Juli 2023 13.31"],
    ["it-IT", "23 luglio 2023 13:31"],
    ["ja-JP", "2023年7月23日 13:31"],
    ["ko-KR", "2023년 7월 23일 오후 1:31"],
    ["nl-NL", "23 juli 2023 om 13:31"],
    ["pl-PL", "23 lipca 2023 13:31"],
    ["pt-BR", "23 de julho de 2023 13:31"],
    ["pt-PT", "23 de julho de 2023 às 13:31"],
    ["ru-RU", "23 июля 2023 г., 13:31"],
    ["sv-SE", "23 juli 2023 13:31"],
    ["th-TH", "23 กรกฎาคม 2566 13:31"],
    ["tr-TR", "23 Temmuz 2023 13:31"],
    ["vi-VN", "13:31 23 tháng 7, 2023"],
    ["zh-CN", "2023年7月23日 13:31"],
    ["zh-TW", "2023年7月23日 下午1:31"],
  ]

  it.each(localesArr)(
    "should format %s date to %s",
    (locale, expectedFormat) => {
      const date = new Date(2023, 6, 23, 13, 31) // July 23, 2023 13:31
      const result = longFormatDate(date, locale)
      expect(result).toBe(expectedFormat)
    }
  )

  it("should handle undefined date", () => {
    const result = longFormatDate(undefined)
    expect(result).toBe("unknown")
  })

  it.each(localesArr)(
    "should handle string date %s date to %s",
    (locale, expectedFormat) => {
      const date = "2023-07-23T13:31:00" // July 23, 2023 13:31 UTC
      const result = longFormatDate(date, locale)
      expect(result).toBe(expectedFormat)
    }
  )

  it("should handle invalid date", () => {
    const date = "invalid date"
    const result = longFormatDate(date)
    expect(result).toBe("Invalid Date")
  })
})
