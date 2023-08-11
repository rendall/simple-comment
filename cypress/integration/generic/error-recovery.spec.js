/// <reference types="cypress" />

import {
  generateRandomCopy,
  generateRandomName,
} from "../../../src/tests/mockData"

context("Error recovery", () => {
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

  it("Submit a comment after error", () => {
    cy.get("form.comment-form .comment-field").type(commentText)
    cy.get("form.comment-form .comment-submit-button").click()

    cy.get("form.comment-form #guest-name")
      .parents(".input-field")
      .should("have.class", "is-error")
    cy.get("form.comment-form #guest-email")
      .parents(".input-field")
      .should("have.class", "is-error")

    // https://on.cypress.io/type
    cy.intercept("POST", ".netlify/functions/comment/*").as("postComment")
    cy.get("form.comment-form #guest-email").type("fake@email.com")
    cy.get("form.comment-form #guest-name").type(generateRandomName())

    cy.get("form.comment-form .comment-submit-button").click()

    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created
    cy.get("ul.comment-replies.is-root").should("contain", commentText)
  })
})
