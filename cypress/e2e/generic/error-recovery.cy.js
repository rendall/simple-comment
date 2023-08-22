/// <reference types="cypress" />
import {
  generateRandomCopy,
  generateRandomName,
} from "../../../src/tests/mockData"

const formatUserName = displayName => {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
}
const randomString = (
  alpha = "abcdefghijklmnopqrstuvwxyz-0123456789",
  len = randomNumber(10, 50),
  str = ""
) =>
  len === 0
    ? str
    : randomString(
        alpha,
        len - 1,
        `${str}${alpha.charAt(Math.floor(Math.random() * alpha.length))}`
      )
const randomNumber = (min = 1, max = 10) =>
  Math.floor(Math.random() * (max - min)) + min

context("Error recovery", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  afterEach(() => {
    cy.clearCookie("simple_comment_token") // clear the authentication cookie
  })

  it("Submit a guest comment after error", () => {
    cy.intercept("POST", ".netlify/functions/comment/*").as("postComment")

    const commentText = generateRandomCopy()

    cy.get("form.comment-form .comment-field").type(commentText)
    cy.get("form.comment-form .comment-submit-button").click()

    cy.get("form.comment-form #guest-name")
      .parents(".input-field")
      .should("have.class", "is-error")
    cy.get("form.comment-form #guest-email")
      .parents(".input-field")
      .should("have.class", "is-error")
    cy.get("#status-display").should("have.class", "is-error")

    cy.get("form.comment-form #guest-email").clear().type("fake@email.com")

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
    cy.intercept("POST", ".netlify/functions/user/").as("postUser")

    const commentText = generateRandomCopy()
    const password = randomString()

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

    cy.get("form.comment-form #signup-email").clear().type("fake@email.com")
    cy.get("form.comment-form #signup-name").type(generateRandomName())
    cy.get("form.comment-form #signup-user-id").type(
      `-${randomString("abcdefghijklmnopqrstuvwxyz0123456789-", 10)}`
    )

    cy.get("form.comment-form #signup-password").type(password)
    cy.get("form.comment-form #signup-password-confirm").type(password)

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

    cy.wait("@postUser").its("response.statusCode").should("eq", 201) // 201 Created
    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created
    cy.get("ul.comment-replies.is-root").should("contain", commentText)
  })
})
