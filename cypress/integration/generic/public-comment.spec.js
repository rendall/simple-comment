/// <reference types="cypress" />

import {
  generateRandomCopy,
  generateRandomName,
} from "../../../src/tests/mockData"

context("Essential actions", () => {
  const commentText = generateRandomCopy()

  before(() => {
    cy.visit("http://localhost:7070/")
  })

  beforeEach(() => {
    // This keeps the same guest user authentication in memory for the
    // duration of these tests
    Cypress.Cookies.preserveOnce("simple_comment_token")
  })

  it("Submit a comment as a public / unknown user", () => {
    // https://on.cypress.io/type
    cy.intercept("POST", ".netlify/functions/comment/*").as("postComment")
    cy.get("#guest-email").type("fake@email.com")
    cy.get("#guest-name").type(generateRandomName())
    cy.get(".comment-field").type(commentText)
    cy.get(".comment-submit-button").click()
    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created
    cy.get("ul.comment-replies.is-root").should("contain", commentText)
  })

  it("Delete a comment as a public / unknown user", () => {
    cy.intercept("DELETE", ".netlify/functions/comment/*").as("deleteComment")
    cy.get(".comment-delete-button").click()
    cy.wait("@deleteComment").its("response.statusCode").should("eq", 202) // 202 Accepted
    cy.get("ul.comment-replies.is-root").should("not.contain", commentText)
  })
})
