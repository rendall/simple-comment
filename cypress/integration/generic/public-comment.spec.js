/// <reference types="cypress" />

import {
  generateRandomCopy,
  generateRandomName,
} from "../../../src/tests/mockData"

context("Essential actions", () => {
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
    cy.wait(2500)
    cy.get("#email-field").type("fake@email.com")
    cy.get("#guest-name").type(generateRandomName())
    cy.get("#comment-field").type(generateRandomCopy())
    cy.get("#comment-submit-button").click()
    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created
    cy.get("#status-display").should("contain", "Successfully posted comment")
  })

  it("Delete a comment as a public / unknown user", () => {
    cy.intercept("DELETE", ".netlify/functions/comment/*").as("deleteComment")
    cy.get(".comment-button.delete-button").click()
    cy.wait("@deleteComment").its("response.statusCode").should("eq", 202) // 202 Accepted
    cy.get("#status-display").should("contain", "Comment deleted")
  })
})
