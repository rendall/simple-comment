/// <reference types="cypress" />

const discussionId = "http-localhost-5000"
const userId = "testuser"
const commentId = `${discussionId}-deletable-comment`
const commentText = "Comment to delete deterministically"
const recentDate = new Date().toISOString()

const buildDiscussion = () => ({
  _id: discussionId,
  id: discussionId,
  parentId: null,
  text: null,
  title: "Simple Comment",
  user: {},
  dateCreated: "2023-05-05T06:11:26.781Z",
  dateDeleted: null,
  replies: [
    {
      id: commentId,
      parentId: discussionId,
      text: commentText,
      dateCreated: recentDate,
      user: {
        id: userId,
        name: "Test User",
      },
      replies: [],
    },
  ],
})

describe("Comment delete", () => {
  it("deletes an owned comment through DELETE /comment/:id", () => {
    cy.intercept("GET", `/.netlify/functions/topic/${discussionId}`, req => {
      expect(req.method).to.equal("GET")
      req.reply({
        statusCode: 200,
        body: buildDiscussion(),
      })
    }).as("getTopic")

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

    cy.intercept("DELETE", `/.netlify/functions/comment/${commentId}`, req => {
      expect(req.method).to.equal("DELETE")
      expect(req.url).to.include(`/.netlify/functions/comment/${commentId}`)
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
})
