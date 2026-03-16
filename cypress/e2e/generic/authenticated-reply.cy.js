/// <reference types="cypress" />

const discussionId = "http-localhost-5000"
const userId = "testuser"
const parentCommentId = `${discussionId}-parent-comment`
const replyText = "Authenticated deterministic reply"

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
      id: parentCommentId,
      parentId: discussionId,
      text: "Parent comment for authenticated reply",
      dateCreated: "2023-05-05T06:12:26.781Z",
      user: {
        id: "existing-user",
        name: "Existing User",
      },
      replies: [],
    },
  ],
})

const buildPostedReply = () => ({
  id: `${parentCommentId}-reply-1`,
  parentId: parentCommentId,
  text: replyText,
  dateCreated: "2023-05-05T06:13:26.781Z",
  user: {
    id: userId,
    name: "Test User",
  },
})

describe("Authenticated reply", () => {
  it("posts a reply as an authenticated user to the parent comment id", () => {
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

    cy.intercept(
      "POST",
      `/.netlify/functions/comment/${parentCommentId}`,
      req => {
        expect(req.method).to.equal("POST")
        expect(req.url).to.include(
          `/.netlify/functions/comment/${parentCommentId}`
        )
        expect(req.body).to.equal(replyText)
        req.reply({
          statusCode: 201,
          body: buildPostedReply(),
        })
      }
    ).as("postReply")

    cy.visit("/")

    cy.wait("@verifyUser")
    cy.wait("@getSelf")
    cy.wait("@getTopic")

    cy.get(`#${parentCommentId} button.comment-reply-button`).click()
    cy.get(`#${parentCommentId} form.comment-form .comment-field`)
      .should("be.visible")
      .type(replyText)
    cy.get(
      `#${parentCommentId} form.comment-form .comment-submit-button`
    ).click()

    cy.wait("@postReply")
    cy.get(`#${parentCommentId}`)
      .find("ul.comment-replies")
      .contains("article.comment-body p", replyText)
  })
})
