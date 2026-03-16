/// <reference types="cypress" />

const discussionId = "http-localhost-5000"
const guestUserId = "guest-ab123-c1m6p"
const guestName = "Baseline Guest"
const guestEmail = "baseline@example.com"
const commentText = "Deterministic baseline top-level comment"

const buildDiscussion = replies => ({
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

const buildPostedComment = () => ({
  id: `${discussionId}-comment-1`,
  parentId: discussionId,
  text: commentText,
  dateCreated: "2023-05-05T06:12:26.781Z",
  user: {
    id: guestUserId,
    name: guestName,
  },
})

describe("Guest comment baseline", () => {
  it("submits a deterministic top-level guest comment to the discussion id", () => {
    let verifyCount = 0

    cy.intercept("GET", `/.netlify/functions/topic/${discussionId}`, req => {
      expect(req.method).to.equal("GET")
      req.reply({
        statusCode: 200,
        body: buildDiscussion([]),
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
              body: { user: guestUserId, exp: 1721980130, iat: 1690444137 },
            }
      )
    }).as("verifyUser")

    cy.intercept("GET", `/.netlify/functions/user/${guestUserId}`, req => {
      expect(req.method).to.equal("GET")
      req.reply({
        statusCode: 200,
        body: {
          id: guestUserId,
          name: guestName,
          email: guestEmail,
          isAdmin: false,
        },
      })
    }).as("getSelf")

    cy.intercept("GET", "/.netlify/functions/gauth", req => {
      expect(req.method).to.equal("GET")
      req.reply({
        statusCode: 200,
        body: "guest-auth-token",
      })
    }).as("getGuestToken")

    cy.intercept("POST", "/.netlify/functions/user", req => {
      expect(req.method).to.equal("POST")
      expect(req.body).to.include(`id=${guestUserId}`)
      expect(req.body).to.include(`name=${encodeURIComponent(guestName)}`)
      expect(req.body).to.include(`email=${encodeURIComponent(guestEmail)}`)
      req.reply({
        statusCode: 201,
        body: {
          id: guestUserId,
          name: guestName,
          email: guestEmail,
          isAdmin: false,
        },
      })
    }).as("postUser")

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

    cy.get("#simple-comment").within(() => {
      cy.get("form.comment-form #guest-name").clear().type(guestName)
      cy.get("form.comment-form #guest-email").clear().type(guestEmail)
      cy.get("form.comment-form .comment-field").clear().type(commentText)
      cy.get("form.comment-form .comment-submit-button").click()
    })

    cy.wait("@getGuestToken")
    cy.wait("@verifyUser")
    cy.wait("@postUser")
    cy.wait("@verifyUser")
    cy.wait("@getSelf")
    cy.wait("@postComment")

    cy.get("#simple-comment").contains("article.comment-body p", commentText)
  })
})
