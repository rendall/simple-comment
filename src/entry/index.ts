import "../simple-comment"

const toTopic = (url: string) =>
  url.replace("://", "-").replace(/\/$/, "").replace(/\W/g, "-")

const params = new URLSearchParams(window.location.search)
const topicId = params.get("topicId") || toTopic(window.location.toString())

window.setSimpleCommentDiscussion(topicId)
