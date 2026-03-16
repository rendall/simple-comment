/// <reference types="cypress" />

const discussionId = "options-target-discussion"
const commentText = "Custom target discussion"

const buildDiscussion = () => ({
  _id: discussionId,
  id: discussionId,
  parentId: null,
  text: null,
  title: "Custom Target Discussion",
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
        id: "target-user",
        name: "Target User",
      },
    },
  ],
})

describe("Embed options", () => {
  it("mounts into the custom target configured via setSimpleCommentOptions", () => {
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

    cy.visit("/cypress/options-target-host.html")

    cy.wait("@getTopic")
    cy.get("#custom-target")
      .find(".simple-comment")
      .should("exist")
      .contains("article.comment-body p", commentText)
    cy.get("#simple-comment .simple-comment").should("not.exist")
  })
})
