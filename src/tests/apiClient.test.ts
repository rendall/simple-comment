import type { Discussion } from "../lib/simple-comment"
import { threadDiscussionReplies } from "../dist/js/apiClient"
import { mockMinimalDiscussion, mockThreadedDiscussion } from "./mockData"

describe("threadDiscussionReplies()", () => {
  it("should thread discussion replies", () => {
    const threadedDiscussion = threadDiscussionReplies(mockMinimalDiscussion)
    expect(threadedDiscussion).toStrictEqual(mockThreadedDiscussion)
  })

  it("should return all properties of Discussion Type", () => {
    const mockDiscussion: Discussion = {
      id: "id",
      title: "Title",
      replies: [],
      isLocked: false,
      dateCreated: new Date()
    }
    const threadedDiscussion = threadDiscussionReplies(mockDiscussion)
    expect(threadedDiscussion).toStrictEqual(mockDiscussion)
  })
})
