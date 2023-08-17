/// <reference types="cypress" />

import {
  generateRandomCopy,
  generateRandomName,
} from "../../../src/tests/mockData"

describe("Guest comment", { testIsolation: false }, () => {
  const commentText = generateRandomCopy()

  beforeEach(() => {
    cy.visit("/")
  })

  it("Submit a comment as a guest user", () => {
    cy.intercept("POST", ".netlify/functions/comment/*").as("postComment")
    cy.get("form.comment-form #guest-email").type("fake@email.com")
    cy.get("form.comment-form #guest-name").type(generateRandomName())
    cy.get("form.comment-form .comment-field").type(commentText)
    cy.get("form.comment-form .comment-submit-button").click()
    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created
    cy.contains("article.comment-body p", commentText).should("exist")
  })

  it("Delete a comment as a logged-in guest user", () => {
    cy.intercept("DELETE", ".netlify/functions/comment/*").as("deleteComment")
    cy.get(".comment-delete-button").click()
    cy.wait("@deleteComment").its("response.statusCode").should("eq", 202) // 202 Accepted
    cy.contains("article.comment-body p", commentText).should("not.exist")
  })

  it("Reply to a comment as a logged-in guest", () => {
    cy.get("button.comment-reply-button").first().as("replyButton")
    cy.get("@replyButton").closest("article.comment-body").as("commentBody")
    cy.get("@replyButton").click()

    cy.get("form.guest-login-form").should("not.exist")
  })
})
