/**
 * @jest-environment jsdom
 */
import { Comment, Discussion } from "../../lib/simple-comment-types"
import {
  longFormatDate,
  shortFormatDate,
  threadComments,
} from "../../frontend-utilities"
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
describe("shortFormatDate", () => {
  const thisYearLocalesArr = [
    ["af-ZA", "15 Jul."],
    ["ar-SA", "٢٧ ذو الحجة"],
    ["de-DE", "15. Juli"],
    ["el-GR", "15 Ιουλ"],
    ["en-AU", "15 July"],
    ["en-GB", "15 Jul"],
    ["en-IN", "15 Jul"],
    ["en-US", "Jul 15"],
    ["es-ES", "15 jul"],
    ["es-MX", "15 jul"],
    ["fi-FI", "15. heinäk."],
    ["fr-CA", "15 juill."],
    ["fr-FR", "15 juil."],
    ["he-IL", "15 ביולי"],
    ["hi-IN", "15 जुल॰"],
    ["id-ID", "15 Jul"],
    ["it-IT", "15 lug"],
    ["ja-JP", "7月15日"],
    ["ko-KR", "7월 15일"],
    ["nl-NL", "15 jul."],
    ["pl-PL", "15 lip"],
    ["pt-BR", "15 de jul."],
    ["pt-PT", "15/07"],
    ["ru-RU", "15 июл."],
    ["sv-SE", "15 juli"],
    ["th-TH", "15 ก.ค."],
    ["tr-TR", "15 Tem"],
    ["vi-VN", "15 thg 7"],
    ["zh-CN", "7月15日"],
    ["zh-TW", "7月15日"],
  ]

  const year2022LocalesArr = [
    ["af-ZA", "15 Jul. 2022"],
    ["ar-SA", "١٦ ذو الحجة ١٤٤٣ هـ"],
    ["de-DE", "15. Juli 2022"],
    ["el-GR", "15 Ιουλ 2022"],
    ["en-AU", "15 July 2022"],
    ["en-GB", "15 Jul 2022"],
    ["en-IN", "15 Jul 2022"],
    ["en-US", "Jul 15, 2022"],
    ["es-ES", "15 jul 2022"],
    ["es-MX", "15 jul 2022"],
    ["fi-FI", "15. heinäk. 2022"],
    ["fr-CA", "15 juill. 2022"],
    ["fr-FR", "15 juil. 2022"],
    ["he-IL", "15 ביולי 2022"],
    ["hi-IN", "15 जुल॰ 2022"],
    ["id-ID", "15 Jul 2022"],
    ["it-IT", "15 lug 2022"],
    ["ja-JP", "2022年7月15日"],
    ["ko-KR", "2022년 7월 15일"],
    ["nl-NL", "15 jul. 2022"],
    ["pl-PL", "15 lip 2022"],
    ["pt-BR", "15 de jul. de 2022"],
    ["pt-PT", "15/07/2022"],
    ["ru-RU", "15 июл. 2022 г."],
    ["sv-SE", "15 juli 2022"],
    ["th-TH", "15 ก.ค. 2565"],
    ["tr-TR", "15 Tem 2022"],
    ["vi-VN", "15 thg 7, 2022"],
    ["zh-CN", "2022年7月15日"],
    ["zh-TW", "2022年7月15日"],
  ]

  it.each(thisYearLocalesArr)(
    "should format this year %s date to %s",
    (locale, expectedFormat) => {
      const thisYear = new Date().getFullYear()
      const date = new Date(thisYear, 6, 15, 13, 31) // July 15, 2023 13:31
      const result = shortFormatDate(date, locale)
      expect(result).toBe(expectedFormat)
    }
  )

  it.each(year2022LocalesArr)(
    "should format year 2022 %s date to %s",
    (locale, expectedFormat) => {
      const date = new Date(2022, 6, 15, 13, 31) // July 15, 2023 13:31
      const result = shortFormatDate(date, locale)
      expect(result).toBe(expectedFormat)
    }
  )

  it("formats today as time only", () => {
    const now = new Date()
    expect(shortFormatDate(now, "en-US")).toMatch(/1?\d:\d{2} [A|P]M/)
  })

  it("should handle undefined date", () => {
    const result = shortFormatDate(undefined)
    expect(result).toBe("unknown")
  })

  it.each(thisYearLocalesArr)(
    "should handle string date %s date to %s",
    (locale, expectedFormat) => {
      const date = "2023-07-15T13:31:00" // July 15, 2023 13:31 UTC
      const result = shortFormatDate(date, locale)
      expect(result).toBe(expectedFormat)
    }
  )

  it("should handle invalid date", () => {
    const date = "invalid date"
    const result = shortFormatDate(date)
    expect(result).toBe("Invalid Date")
  })
})

describe("longFormatDate", () => {
  const localesArr = [
    ["af-ZA", "15 Julie 2023 13:31"],
    ["ar-SA", "٢٧ ذو الحجة ١٤٤٤ هـ في ١:٣١ م"],
    ["de-DE", "15. Juli 2023 um 13:31"],
    ["el-GR", "15 Ιουλίου 2023 - 1:31 μ.μ."],
    ["en-AU", "15 July 2023 at 1:31 pm"],
    ["en-GB", "15 July 2023 at 13:31"],
    ["en-IN", "15 July 2023 at 1:31 pm"],
    ["en-US", "July 15, 2023 at 1:31 PM"],
    ["es-ES", "15 de julio de 2023, 13:31"],
    ["es-MX", "15 de julio de 2023, 13:31"],
    ["fi-FI", "15. heinäkuuta 2023 klo 13.31"],
    ["fr-CA", "15 juillet 2023 à 13 h 31"],
    ["fr-FR", "15 juillet 2023 à 13:31"],
    ["he-IL", "15 ביולי 2023 בשעה 13:31"],
    ["hi-IN", "15 जुलाई 2023 को 1:31 pm"],
    ["id-ID", "15 Juli 2023 13.31"],
    ["it-IT", "15 luglio 2023 13:31"],
    ["ja-JP", "2023年7月15日 13:31"],
    ["ko-KR", "2023년 7월 15일 오후 1:31"],
    ["nl-NL", "15 juli 2023 om 13:31"],
    ["pl-PL", "15 lipca 2023 13:31"],
    ["pt-BR", "15 de julho de 2023 13:31"],
    ["pt-PT", "15 de julho de 2023 às 13:31"],
    ["ru-RU", "15 июля 2023 г., 13:31"],
    ["sv-SE", "15 juli 2023 13:31"],
    ["th-TH", "15 กรกฎาคม 2566 13:31"],
    ["tr-TR", "15 Temmuz 2023 13:31"],
    ["vi-VN", "13:31 15 tháng 7, 2023"],
    ["zh-CN", "2023年7月15日 13:31"],
    ["zh-TW", "2023年7月15日 下午1:31"],
  ]

  it.each(localesArr)(
    "should format %s date to %s",
    (locale, expectedFormat) => {
      const date = new Date(2023, 6, 15, 13, 31) // July 15, 2023 13:31
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
      const date = "2023-07-15T13:31:00" // July 15, 2023 13:31 UTC
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
