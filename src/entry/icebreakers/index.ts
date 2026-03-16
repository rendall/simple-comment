import "../../simple-comment"
import "../../simple-comment-icebreakers"

window.setSimpleCommentOptions({ cancel: true })

const getTopicSlug = (url: string) =>
  new URL(url).pathname.slice("/icebreakers/".length)

const discussionId = getTopicSlug(window.location.href)

window
  .getQuestion(discussionId)
  .then(question => {
    document.title = `${question} | Simple Comment`
    const questionP = document.querySelector(".question-of-the-day")
    questionP.textContent = question
    window.loadSimpleComment({
      cancel: true,
      discussionId,
      target: document.getElementById("simple-comment") ?? document.body,
      title: question,
    })
  })
  .catch(console.error)
