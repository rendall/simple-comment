/// <reference types="cypress" />

import { formatUserName } from "../../../src/frontend-utilities"
import {
  generateRandomCopy,
  generateRandomName,
  randomString,
} from "../../../src/tests/mockData"

context("Error recovery", () => {
  const commentText = generateRandomCopy()

  beforeEach(() => {
    cy.visit("http://localhost:7070/")
  })

  afterEach(() => {
    cy.clearCookie("simple_comment_token") // clear the authentication cookie
  })

  it("Submit a guest comment after error", () => {
    cy.intercept("POST", ".netlify/functions/comment/*").as("postComment")

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

    const guestName = generateRandomName()
    const userId = formatUserName(guestName)

    cy.intercept("GET", ".netlify/functions/user/*", req => {
      console.error({ req })
      const { url } = req
      const unwantedCall = `user/${userId}`
      if (url.endsWith(unwantedCall))
        throw new Error(`Unexpected GET request to ${unwantedCall}`)
    })

    cy.get("form.comment-form #guest-name").type(guestName)

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

  it("Submit a signup comment after error", () => {
    cy.get("button.selection-tab-signup").click()

    cy.intercept("POST", ".netlify/functions/comment/*").as("postComment")

    cy.get("form.comment-form .comment-field").type(commentText)
    cy.get("form.comment-form .comment-submit-button").click()

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

    cy.get("#status-display").should("have.class", "is-error")

    cy.get("form.comment-form #signup-email").type("fake@email.com")
    cy.get("form.comment-form #signup-name").type(generateRandomName())
    cy.get("form.comment-form #signup-password").type(randomString())

    cy.get("form.comment-form #signup-name")
      .parents(".input-field")
      .should("not.have.class", "is-error")
    cy.get("form.comment-form #signup-user-id")
      .parents(".input-field")
      .should("not.have.class", "is-error")
    cy.get("form.comment-form #signup-email")
      .parents(".input-field")
      .should("not.have.class", "is-error")
    cy.get("form.comment-form #signup-password")
      .parents(".input-field")
      .should("not.have.class", "is-error")

    cy.get("form.comment-form .comment-submit-button").click()

    cy.get("#status-display").should("not.have.class", "is-error")

    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created
    cy.get("ul.comment-replies.is-root").should("contain", commentText)
  })
})
