/// <reference types="cypress" />

import {
  generateRandomCopy,
  generateRandomName,
} from "../../../src/tests/mockComment"

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

    cy.visit("/")
  })

  afterEach(() => {
    cy.get("form.comment-form").within(() => {
      cy.get("input, textarea").clear()
    })
  })

  it("Press signup then add comment without entering any information", () => {
    // Set up the interception
    cy.intercept("POST", ".netlify/functions/user", () => {
      throw "POST to /user should not happen"
    })

    cy.get("button.selection-tab-signup").click()

    cy.get("form.comment-form textarea.comment-field").type(
      generateRandomCopy()
    )

    cy.get(".comment-submit-button").click()

    cy.get("form.comment-form #signup-name")
      .parents(".input-field")
      .should("have.class", "is-error")
    cy.get("form.comment-form #signup-user-id")
      .parents(".input-field")
      .should("have.class", "is-error")
    cy.get("form.comment-form #signup-email")
      .parents(".input-field")
      .should("have.class", "is-error")
    cy.get("form.comment-form #signup-password")
      .parents(".input-field")
      .should("have.class", "is-error")
  })

  it("Press login then add comment without entering any information", () => {
    cy.intercept("POST", ".netlify/functions/auth", () => {
      throw "POST to /auth should not happen"
    })
    cy.get("button.selection-tab-login").click()

    cy.get("form.comment-form textarea.comment-field").type(
      generateRandomCopy()
    )

    cy.get(".comment-submit-button").click()

    cy.get("form.comment-form #login-user-id")
      .parents(".input-field")
      .should("have.class", "is-error")
    cy.get("form.comment-form #login-password")
      .parents(".input-field")
      .should("have.class", "is-error")
  })
  it("Press add comment without entering any information", () => {
    cy.get("form.comment-form textarea.comment-field").type(
      generateRandomCopy()
    )

    cy.get(".comment-submit-button").click()

    cy.get("form.comment-form #guest-email")
      .parents(".input-field")
      .should("have.class", "is-error")
  })

  it("Submit a comment without adding email or name", () => {
    cy.get("form.comment-form textarea.comment-field").type(
      generateRandomCopy()
    )
    cy.get("form.comment-form").submit()
    cy.get("form.comment-form #guest-name")
      .parents(".input-field")
      .should("have.class", "is-error")
    cy.get("form.comment-form #guest-email")
      .parents(".input-field")
      .should("have.class", "is-error")
  })

  it("Submit a comment only adding name", () => {
    cy.get("form.comment-form #guest-name").type(generateRandomName())
    cy.get("form.comment-form textarea.comment-field").type(
      generateRandomCopy()
    )
    cy.get("form.comment-form").submit()
    cy.get("form.comment-form #guest-email")
      .parents(".input-field")
      .should("have.class", "is-error")
  })

  it("Submit a comment only adding email", () => {
    cy.get("form.comment-form #guest-email").clear().type("fake@email.com")
    cy.get("form.comment-form textarea.comment-field").type(
      generateRandomCopy()
    )
    cy.get("form.comment-form").submit()
    cy.get("form.comment-form #guest-name")
      .parents(".input-field")
      .should("have.class", "is-error")
  })

  it("Submit a comment adding invalid email", () => {
    cy.get("form.comment-form #guest-email").clear().type("invalid@emailcom")
    cy.get("form.comment-form #guest-name").type(generateRandomName())
    cy.get("form.comment-form textarea.comment-field").type(
      generateRandomCopy()
    )
    cy.get("form.comment-form").submit()
    cy.get("form.comment-form #guest-email")
      .parents(".input-field")
      .should("have.class", "is-error")
  })
})
