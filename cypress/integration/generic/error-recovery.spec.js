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

  it("Submit a comment after error", () => {
    cy.intercept("POST", ".netlify/functions/comment").as("postComment")
    cy.intercept("GET", ".netlify/functions/user", () => { throw "GET to /user should not happen" })

    cy.get("form.comment-form .comment-field").type(commentText)
    cy.get("form.comment-form .comment-submit-button").click()

    cy.get("form.comment-form #guest-name")
      .parents(".input-field")
      .should("have.class", "is-error")
    cy.get("form.comment-form #guest-email")
      .parents(".input-field")
      .should("have.class", "is-error")
    cy.get("#status-display").should("have.class", "is-error")

    cy.get("form.comment-form #guest-email").type("fake@email.com")
    cy.get("form.comment-form #guest-name").type(generateRandomName())

    cy.get("form.comment-form #guest-name")
      .parents(".input-field")
      .should("not.have.class", "is-error")
    cy.get("form.comment-form #guest-email")
      .parents(".input-field")
      .should("not.have.class", "is-error")

    cy.get("form.comment-form .comment-submit-button").click()

    cy.get("#status-display").should("not.have.class", "is-error")

    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created
    cy.get("ul.comment-replies.is-root").should("contain", commentText)
  })
})
