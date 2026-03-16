/// <reference types="cypress" />

const buildDiscussion = (discussionId, commentText) => ({
  _id: discussionId,
  id: discussionId,
  parentId: null,
  text: null,
  title: `Discussion ${discussionId}`,
  user: {},
  dateCreated: "2023-05-05T06:11:26.781Z",
  dateDeleted: null,
  replies: [
    {
      id: `${discussionId}-comment-1`,
      text: commentText,
      dateCreated: "2023-05-05T06:12:26.781Z",
      parentId: discussionId,
      user: {
        id: "guest-baseline-user",
        name: "Baseline User",
      },
    },
  ],
})

const stubDiscussionBootstrap = (discussionId, commentText) => {
  cy.intercept("GET", "/.netlify/functions/verify", {
    statusCode: 401,
    body: { message: "Unauthenticated" },
  }).as("verifyUser")

  cy.intercept("GET", "/.netlify/functions/topic/*", req => {
    expect(req.method).to.equal("GET")
    expect(req.url).to.include(`/topic/${discussionId}`)
    req.reply({
      statusCode: 200,
      body: buildDiscussion(discussionId, commentText),
    })
  }).as("getTopic")
}

describe("Simple Comment frontend", () => {
  it("auto-inits into #simple-comment and loads the default discussion", () => {
    const discussionId = "http-localhost-5000"
    const commentText = "Auto-init baseline discussion"

    stubDiscussionBootstrap(discussionId, commentText)

    cy.visit("/")

    cy.wait("@getTopic")
    cy.get("#simple-comment")
      .should("exist")
      .within(() => {
        cy.get(".simple-comment").should("exist")
        cy.get(".simple-comment-discussion").should("exist")
        cy.contains("article.comment-body p", commentText).should("exist")
      })
  })

  it("uses setSimpleCommentDiscussion before load for configured bootstrap", () => {
    const discussionId = "configured-discussion"
    const commentText = "Configured discussion baseline"

    stubDiscussionBootstrap(discussionId, commentText)

    cy.visit("/cypress/configured-discussion-host.html")

    cy.wait("@getTopic")
    cy.get("#simple-comment")
      .should("exist")
      .within(() => {
        cy.get(".simple-comment").should("exist")
        cy.get(".simple-comment-discussion").should("exist")
        cy.contains("article.comment-body p", commentText).should("exist")
      })
  })
})
