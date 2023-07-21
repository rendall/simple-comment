/**
 * @jest-environment jsdom
 */
import { threadComments } from "../../frontend-utilities"
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
