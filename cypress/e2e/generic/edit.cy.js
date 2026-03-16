/// <reference types="cypress" />

const discussionId = "http-localhost-5000"
const userId = "testuser"
const commentId = `${discussionId}-editable-comment`
const originalText = "Original editable comment"
const updatedText = "Updated deterministic comment"
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
      text: originalText,
      dateCreated: recentDate,
      user: {
        id: userId,
        name: "Test User",
      },
      replies: [],
    },
  ],
})

describe("Comment edit", () => {
  it("updates an owned recent comment through PUT /comment/:id", () => {
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

    cy.intercept("PUT", `/.netlify/functions/comment/${commentId}`, req => {
      expect(req.method).to.equal("PUT")
      expect(req.url).to.include(`/.netlify/functions/comment/${commentId}`)
      expect(req.body).to.equal(updatedText)
      req.reply({
        statusCode: 200,
        body: {
          id: commentId,
          parentId: discussionId,
          text: updatedText,
          dateCreated: recentDate,
          user: {
            id: userId,
            name: "Test User",
          },
        },
      })
    }).as("putComment")

    cy.visit("/")

    cy.wait("@verifyUser")
    cy.wait("@getSelf")
    cy.wait("@getTopic")

    cy.get(`#${commentId} .overflow-menu-button`).click()
    cy.get(`#${commentId} .comment-edit-button`).click()
    cy.get(`#${commentId} form.comment-form .comment-field`)
      .should("be.visible")
      .clear()
      .type(updatedText)
    cy.get(`#${commentId} form.comment-form .comment-update-button`).click()

    cy.wait("@putComment")
    cy.get(`#${commentId}`).contains("article.comment-body p", updatedText)
  })
})
