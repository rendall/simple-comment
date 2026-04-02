/// <reference types="cypress" />

const firstDiscussionId = "singleton-first-discussion"
const firstCommentText = "First singleton discussion"

const buildDiscussion = (discussionId, commentText) => ({
  _id: discussionId,
  id: discussionId,
  parentId: null,
  text: null,
  title: discussionId,
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
        id: `${discussionId}-user`,
        name: `${discussionId} User`,
      },
    },
  ],
})

describe("Singleton widget mount", () => {
  it("ignores a second loadSimpleComment call on the same page", () => {
    cy.on("window:before:load", win => {
      cy.spy(win.console, "warn").as("consoleWarn")
    })

    cy.intercept("GET", "/.netlify/functions/verify", {
      statusCode: 401,
      body: { message: "Unauthenticated" },
    }).as("verifyUser")

    cy.intercept("GET", `/.netlify/functions/topic/${firstDiscussionId}`, req => {
      req.reply({
        statusCode: 200,
        body: buildDiscussion(firstDiscussionId, firstCommentText),
      })
    }).as("getFirstTopic")

    cy.intercept("GET", "/.netlify/functions/topic/singleton-second-discussion", req => {
      req.reply({
        statusCode: 200,
        body: buildDiscussion("singleton-second-discussion", "Second singleton discussion"),
      })
    }).as("getSecondTopic")

    cy.visit("/cypress/singleton-load-host.html")

    cy.get("#load-twice-button").click()

    cy.wait("@getFirstTopic")
    cy.get("@getSecondTopic.all").should("have.length", 0)
    cy.get("@consoleWarn").should(
      "have.been.calledWith",
      "Simple Comment supports only one mounted widget per page. Ignoring additional loadSimpleComment call."
    )

    cy.get("#first-target")
      .find(".simple-comment")
      .should("exist")
      .contains("article.comment-body p", firstCommentText)
    cy.get("#second-target .simple-comment").should("not.exist")
  })
})
