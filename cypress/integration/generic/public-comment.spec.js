/// <reference types="cypress" />

import {
  generateRandomCopy,
  generateRandomName,
} from "../../../src/tests/mockData"

context("Guest comment", () => {
  const commentText = generateRandomCopy()

  before(() => {
    cy.visit("http://localhost:7070/")
  })

  beforeEach(() => {
    // This keeps the same guest user authentication in memory for the
    // duration of these tests
    Cypress.Cookies.preserveOnce("simple_comment_token")
  })

  after(() => {
    cy.clearCookie("simple_comment_token") // clear the authentication/session cookie
  })

  it("Submit a comment as a guest user", () => {
    // https://on.cypress.io/type
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
