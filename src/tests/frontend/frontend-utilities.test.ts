import { threadComments } from "../../frontend-utilities"
import { Comment } from "../../lib/simple-comment"
import { mockCommentTree, mockTopic } from "../mockData"
import { performance } from "perf_hooks"



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
