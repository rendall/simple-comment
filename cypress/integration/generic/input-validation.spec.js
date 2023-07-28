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

    cy.visit("http://localhost:7070/")

    cy.get("#guest-email").clear()
    cy.get("#guest-name").clear()
    cy.get("textarea.comment-field").clear()
  })

  it("Submit a comment without adding email or name", () => {
    cy.get("textarea.comment-field").type(generateRandomCopy())
    cy.get("form.comment-form").submit()
    cy.get("#guest-name")
      .parents(".input-field")
      .should("have.class", "is-error")
    cy.get("#guest-email")
      .parents(".input-field")
      .should("have.class", "is-error")
  })

  it("Submit a comment only adding name", () => {
    cy.get("#guest-name").type(generateRandomName())
    cy.get("textarea.comment-field").type(generateRandomCopy())
    cy.get("form.comment-form").submit()
    cy.get("#guest-email")
      .parents(".input-field")
      .should("have.class", "is-error")
  })

  it("Submit a comment only adding email", () => {
    cy.get("#guest-email").type("fake@email.com")
    cy.get("textarea.comment-field").type(generateRandomCopy())
    cy.get("form.comment-form").submit()
    cy.get("#guest-name")
      .parents(".input-field")
      .should("have.class", "is-error")
  })

  it("Submit a comment adding invalid email", () => {
    cy.get("#guest-email").type("invalid@emailcom")
    cy.get("#guest-name").type(generateRandomName())
    cy.get("textarea.comment-field").type(generateRandomCopy())
    cy.get("form.comment-form").submit()
    cy.get("#guest-email")
      .parents(".input-field")
      .should("have.class", "is-error")
  })
})
