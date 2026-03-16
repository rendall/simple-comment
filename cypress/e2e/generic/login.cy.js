/// <reference types="cypress" />

const discussionId = "http-localhost-5000"
const userId = "testuser"
const password = "testpassword"
const commentText = "Deterministic authenticated comment"
const authHeader = "Basic dGVzdHVzZXI6dGVzdHBhc3N3b3Jk"

const buildDiscussion = () => ({
  _id: discussionId,
  id: discussionId,
  parentId: null,
  text: null,
  title: "Simple Comment",
  user: {},
  dateCreated: "2023-05-05T06:11:26.781Z",
  dateDeleted: null,
  replies: [],
})

const buildPostedComment = () => ({
  id: `${discussionId}-comment-1`,
  parentId: discussionId,
  text: commentText,
  dateCreated: "2023-05-05T06:12:26.781Z",
  user: {
    id: userId,
    name: "Test User",
  },
})

describe("Authenticated login baseline", () => {
  it("logs in, verifies, fetches self, and posts an authenticated top-level comment", () => {
    let verifyCount = 0

    cy.intercept("GET", `/.netlify/functions/topic/${discussionId}`, req => {
      expect(req.method).to.equal("GET")
      req.reply({
        statusCode: 200,
        body: buildDiscussion(),
      })
    }).as("getTopic")

    cy.intercept("GET", "/.netlify/functions/verify", req => {
      verifyCount += 1
      req.reply(
        verifyCount === 1
          ? {
              statusCode: 401,
              body: { message: "Unauthenticated" },
            }
          : {
              statusCode: 200,
              body: { user: userId, exp: 1721980130, iat: 1690444137 },
            }
      )
    }).as("verifyUser")

    cy.intercept("POST", "/.netlify/functions/auth", req => {
      expect(req.method).to.equal("POST")
      expect(req.headers.authorization).to.equal(authHeader)
      req.reply({
        statusCode: 200,
        body: "OK",
      })
    }).as("postAuth")

    cy.intercept("GET", `/.netlify/functions/user/${userId}`, req => {
      expect(req.method).to.equal("GET")
      req.reply({
        statusCode: 200,
        body: {
          id: userId,
          name: "Test User",
          email: "testuser@example.com",
          isAdmin: false,
        },
      })
    }).as("getSelf")

    cy.intercept("POST", `/.netlify/functions/comment/${discussionId}`, req => {
      expect(req.method).to.equal("POST")
      expect(req.url).to.include(`/.netlify/functions/comment/${discussionId}`)
      expect(req.body).to.equal(commentText)
      req.reply({
        statusCode: 201,
        body: buildPostedComment(),
      })
    }).as("postComment")

    cy.visit("/")

    cy.wait("@verifyUser")
    cy.wait("@getTopic")

    cy.get("button.selection-tab-login").click()
    cy.get("#login-user-id").should("be.visible").type(userId)
    cy.get("#login-password").should("be.visible").type(password)
    cy.get("form.comment-form .comment-field").should("be.visible").type(commentText)
    cy.get("form.comment-form .comment-submit-button").click()

    cy.wait("@postAuth")
    cy.wait("@verifyUser")
    cy.wait("@getSelf")
    cy.wait("@postComment")

    cy.get("#self-display").should("contain", "Test User")
    cy.get("#simple-comment").contains("article.comment-body p", commentText)
  })
})
