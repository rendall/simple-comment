import type { Comment, Discussion, Topic } from "./lib/simple-comment-types"
import { getAllTopics, getOneDiscussion } from "./apiClient"
import { getDisplayDiv, appendComment } from "./ui"

const getDiscussionDisplayList = (): HTMLUListElement => {
  const displayDiv = getDisplayDiv()
  const discussionDisplayList = displayDiv.querySelector(
    "#discussion-display-list"
  ) as HTMLUListElement

  if (discussionDisplayList) console.info("`#discussion-display-list` found")
  else console.info("`#discussion-display-list` not found. Creating.")

  const createdUl =
    discussionDisplayList ?? (document.createElement("ul") as HTMLUListElement)

  if (!discussionDisplayList) {
    createdUl.setAttribute("id", "discussion-display-list")
    displayDiv.appendChild(createdUl)
    console.info("`ul#discussion-display-list` created")
  }

  return createdUl
}

const threadReplies = (
  parent: Comment | Discussion,
  li: HTMLLIElement | HTMLDivElement,
  comments: Comment[]
) => {
  const parentId = parent.id
  const comment = comments.find(c => c.id === parentId)
  if (comment) appendComment(comment, li as HTMLLIElement)
  const replies = comments
    .filter(c => c.parentId === parentId)
    .sort(
      (a, b) =>
        new Date(b.dateCreated).valueOf() - new Date(a.dateCreated).valueOf()
    )

  if (replies.length) {
    const ul = document.createElement("ul")
    ul.dataset.comment = parentId
    li.appendChild(ul)
    replies.forEach(reply => {
      const li = document.createElement("li")
      ul.appendChild(li)
      threadReplies(reply, li, comments)
    })
  }
}

const displayDiscussion = (discussion: Discussion, ul: HTMLUListElement) => {
  const li = document.createElement("li") as HTMLLIElement
  li.innerHTML = discussion.title
  li.setAttribute("id", `discussion-${discussion.id}`)
  ul.appendChild(li)

  threadReplies(discussion, li, discussion.replies ?? [])
}

// There is also a type guard `isDiscussion` in /lib/simple-comment, but it is server-side
const isDiscussion = (c: string | Discussion): c is Discussion =>
  typeof c !== "string" && c.id !== undefined

const getAllDiscussions = (topics: Topic[]) =>
  topics.map(topic => getOneDiscussion(topic.id))

const allCommentsSetup = async () => {
  const allTopicsResponse = await getAllTopics()

  if (typeof allTopicsResponse.body === "string") {
    console.info(allTopicsResponse.body)
    return
  }

  const topics: Topic[] = allTopicsResponse.body

  const allDiscussionsResponse = await Promise.all(getAllDiscussions(topics))

  const stringResponses = allDiscussionsResponse
    .map(r => r.body)
    .filter(responseBody => typeof responseBody === "string")

  stringResponses.forEach(console.info)

  const discussions: Discussion[] = allDiscussionsResponse
    .map(d => d.body as Discussion)
    .filter(d => isDiscussion(d))

  discussions.forEach(d => displayDiscussion(d, getDiscussionDisplayList()))
}

allCommentsSetup()
