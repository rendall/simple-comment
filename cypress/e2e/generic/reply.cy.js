/// <reference types="cypress" />

const discussionId = "http-localhost-5000"
const parentCommentId = `${discussionId}-parent-comment`
const guestUserId = "guest-cd456-c1m6p"
const guestName = "Reply Baseline Guest"
const guestEmail = "reply-baseline@example.com"
const replyText = "Deterministic baseline reply"

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
      text: "Parent comment for reply baseline",
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
    id: guestUserId,
    name: guestName,
  },
})

describe("Reply baseline", () => {
  it("submits a deterministic reply to the parent comment id", () => {
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
        verifyCount <= 2
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
    cy.wait("@getTopic")

    cy.get(`#${parentCommentId} button.comment-reply-button`).click()
    cy.wait("@verifyUser")
    cy.get(`#${parentCommentId} form.comment-form`).should("exist")
    cy.get(`#${parentCommentId} form.comment-form #guest-name`)
      .should("be.visible")
      .type(guestName)
    cy.get(`#${parentCommentId} form.comment-form #guest-email`)
      .should("be.visible")
      .type(guestEmail)
    cy.get(`#${parentCommentId} form.comment-form .comment-field`)
      .should("be.visible")
      .type(replyText)
    cy.get(
      `#${parentCommentId} form.comment-form .comment-submit-button`
    ).click()

    cy.wait("@getGuestToken")
    cy.wait("@verifyUser")
    cy.wait("@postUser")
    cy.wait("@verifyUser")
    cy.wait("@getSelf")
    cy.wait("@postReply")

    cy.get(`#${parentCommentId}`)
      .find("ul.comment-replies")
      .contains("article.comment-body p", replyText)
  })
})
