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

  })

  afterEach(() => {
    cy.get("form.comment-form #guest-email").clear()
    cy.get("form.comment-form #guest-name").clear()
    cy.get("form.comment-form textarea.comment-field").clear()
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
    cy.get("form.comment-form #guest-email").type("fake@email.com")
    cy.get("form.comment-form textarea.comment-field").type(
      generateRandomCopy()
    )
    cy.get("form.comment-form").submit()
    cy.get("form.comment-form #guest-name")
      .parents(".input-field")
      .should("have.class", "is-error")
  })

  it("Submit a comment adding invalid email", () => {
    cy.get("form.comment-form #guest-email").type("invalid@emailcom")
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
