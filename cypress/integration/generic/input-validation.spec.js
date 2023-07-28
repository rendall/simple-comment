/// <reference types="cypress" />

import {
  generateRandomCopy,
  generateRandomName,
} from "../../../src/tests/mockData"

context("Input invalid data", () => {
  beforeEach(() => {
    cy.intercept("GET", "/.netlify/functions/verify", req => {
      req.reply({ statusCode: 401 })
    })
    cy.intercept(
      "GET",
      "/.netlify/functions/topic/http-localhost-7070",
      req => {
        req.reply({ statusCode: 200 })
      }
    )

    cy.intercept("POST", ".netlify/functions/comment/").as("postComment")

    cy.visit("http://localhost:7070/") // replace with your signup page URL

    cy.get("#guest-email").clear()
    cy.get("#guest-name").clear()
    cy.get("textarea.comment-field").clear()
  })

  it("Submit a comment without adding email or name", () => {
    cy.wait(2500)
    cy.get("textarea.comment-field").type(generateRandomCopy())
    cy.get("form.comment-form").submit()

    cy.get("#status-display").should("have.class", "error")
    cy.wait("@postComment").its("callCount").should("eq", 0)
  })

  it("Submit a comment only adding name", () => {
    // https://on.cypress.io/type
    cy.intercept("POST", ".netlify/functions/comment/").as("postComment")
    cy.wait(2500)
    cy.get("#guest-name").type(generateRandomName())
    cy.get("textarea.comment-field").type(generateRandomCopy())
    cy.get("form.comment-form").submit()
    cy.get("#status-display").should("have.class", "error")
    cy.wait("@postComment").its("callCount").should("eq", 0)
  })

  it("Submit a comment only adding email", () => {
    cy.wait(2500)
    cy.get("#guest-email").type("fake@email.com")
    cy.get("textarea.comment-field").type(generateRandomCopy())
    cy.get("form.comment-form").submit()
    cy.get("#status-display").should("have.class", "error")
    cy.wait("@postComment").its("callCount").should("eq", 0)
  })

  it("Submit a comment adding invalid email", () => {
    // https://on.cypress.io/type
    cy.wait(2500)
    cy.get("#guest-email").type("invalid@emailcom")
    cy.get("#guest-name").type(generateRandomName())
    cy.get("textarea.comment-field").type(generateRandomCopy())
    cy.get("form.comment-form").submit()
    cy.get(".error#status-display")
    cy.get("#guest-email").clear()
    cy.wait("@postComment").its("callCount").should("eq", 0)
    cy.get("#guest-email").type("valid@email.com")
    cy.get("button.comment-submit-button").click()
    cy.get("#status-display").should("not.have.class", "error")
    cy.wait("@postComment").its("callCount").should("eq", 1)
  })
})
