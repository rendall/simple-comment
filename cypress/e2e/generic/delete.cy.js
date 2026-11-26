/// <reference types="cypress" />

const discussionId = "http-localhost-5000"
const userId = "testuser"
const commentId = `${discussionId}-deletable-comment`
const commentText = "Comment to delete deterministically"
const recentDate = new Date().toISOString()

const leafComment = {
  id: commentId,
  parentId: discussionId,
  text: commentText,
  dateCreated: recentDate,
  user: {
    id: userId,
    name: "Test User",
  },
  replies: [],
}

const buildDiscussion = (replies = [leafComment]) => ({
  _id: discussionId,
  id: discussionId,
  parentId: null,
  text: null,
  title: "Simple Comment",
  user: {},
  dateCreated: "2023-05-05T06:11:26.781Z",
  dateDeleted: null,
  replies,
})

describe("Comment delete", () => {
  beforeEach(() => {
    cy.intercept("GET", "/.netlify/functions/verify", {
      statusCode: 200,
      body: { user: userId, exp: 1721980130, iat: 1690444137 },
    }).as("verifyUser")

    cy.intercept("GET", `/.netlify/functions/user/${userId}`, {
      statusCode: 200,
      body: {
        id: userId,
        name: "Test User",
        email: "testuser@example.com",
        isAdmin: false,
      },
    }).as("getSelf")
  })

  it("deletes an owned comment through DELETE /comment/:id", () => {
    let deleted = false
    cy.intercept("GET", `/.netlify/functions/topic/${discussionId}`, req => {
      expect(req.method).to.equal("GET")
      req.reply({
        statusCode: 200,
        body: buildDiscussion(deleted ? [] : [leafComment]),
      })
    }).as("getTopic")

    cy.intercept("DELETE", `/.netlify/functions/comment/${commentId}`, req => {
      expect(req.method).to.equal("DELETE")
      expect(req.url).to.include(`/.netlify/functions/comment/${commentId}`)
      deleted = true
      req.reply({
        statusCode: 202,
        body: { message: "Deleted" },
      })
    }).as("deleteComment")

    cy.visit("/")

    cy.wait("@verifyUser")
    cy.wait("@getSelf")
    cy.wait("@getTopic")

    cy.get(`#${commentId}`).contains("article.comment-body p", commentText)
    cy.get(`#${commentId} .overflow-menu-button`).click()
    cy.get(`#${commentId} .comment-delete-button`).click()

    cy.wait("@deleteComment")
    cy.get(`#${commentId}`).should("not.exist")
  })

  it("hides a deleted branch after its last live reply is deleted and after reload", () => {
    const parent = {
      id: `${discussionId}-deleted-parent`,
      parentId: discussionId,
      text: null,
      dateCreated: "2023-05-06T00:00:00.000Z",
      dateDeleted: "2023-05-07T00:00:00.000Z",
    }
    const reply = { ...leafComment, parentId: parent.id }
    const deletedReply = {
      id: reply.id,
      parentId: parent.id,
      text: null,
      dateCreated: reply.dateCreated,
      dateDeleted: recentDate,
    }
    const unrelatedComment = {
      ...leafComment,
      id: `${discussionId}-unrelated-comment`,
      text: "A live comment outside the deleted branch",
    }
    let replyDeleted = false

    cy.intercept("GET", `/.netlify/functions/topic/${discussionId}`, req => {
      req.reply({
        statusCode: 200,
        body: buildDiscussion([
          parent,
          replyDeleted ? deletedReply : reply,
          unrelatedComment,
        ]),
      })
    }).as("getTopic")
    cy.intercept("DELETE", `/.netlify/functions/comment/${reply.id}`, req => {
      replyDeleted = true
      req.reply({ statusCode: 202, body: "Comment deleted" })
    }).as("deleteReply")

    cy.visit("/")
    cy.wait("@verifyUser")
    cy.wait("@getSelf")
    cy.wait("@getTopic")

    cy.get(`#${parent.id}`).contains("This comment was deleted")
    cy.get(`#${parent.id} #${reply.id}`).contains(
      "article.comment-body p",
      commentText
    )
    cy.get(`#${reply.id} .overflow-menu-button`).click()
    cy.get(`#${reply.id} .comment-delete-button`).click()

    cy.wait("@deleteReply")
    cy.get(`#${reply.id}`).should("not.exist")
    cy.get(`#${parent.id}`).should("not.exist")

    cy.reload()
    cy.wait("@getTopic")
    cy.get(`#${unrelatedComment.id}`).should("be.visible")
    cy.get(`#${reply.id}`).should("not.exist")
    cy.get(`#${parent.id}`).should("not.exist")
  })
})
