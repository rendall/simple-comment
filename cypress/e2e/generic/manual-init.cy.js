/// <reference types="cypress" />

const discussionId = "manual-load-discussion"
const commentText = "Manual load discussion"

const buildDiscussion = () => ({
  _id: discussionId,
  id: discussionId,
  parentId: null,
  text: null,
  title: "Manual Load Discussion",
  user: {},
  dateCreated: "2023-05-05T06:11:26.781Z",
  dateDeleted: null,
  replies: [
    {
      id: `${discussionId}-comment-1`,
      parentId: discussionId,
      text: commentText,
      dateCreated: "2023-05-05T06:12:26.781Z",
      user: {
        id: "manual-user",
        name: "Manual User",
      },
    },
  ],
})

describe("Imperative embed mount", () => {
  it("mounts only after window.loadSimpleComment is called", () => {
    cy.intercept("GET", "/.netlify/functions/verify", {
      statusCode: 401,
      body: { message: "Unauthenticated" },
    }).as("verifyUser")

    cy.intercept("GET", `/.netlify/functions/topic/${discussionId}`, req => {
      expect(req.method).to.equal("GET")
      req.reply({
        statusCode: 200,
        body: buildDiscussion(),
      })
    }).as("getTopic")

    cy.visit("/cypress/manual-load-host.html")

    cy.get("@getTopic.all").should("have.length", 0)
    cy.get("#simple-comment .simple-comment").should("not.exist")

    cy.get("#manual-load-button").click()

    cy.wait("@getTopic")
    cy.get("#simple-comment")
      .find(".simple-comment")
      .should("exist")
      .contains("article.comment-body p", commentText)
  })
})
