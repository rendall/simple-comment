/// <reference types="cypress" />

import { randomString } from "../../../src/tests/mockData"
import {
  generateRandomCopy,
  generateRandomName,
} from "../../../src/tests/mockComment"

const formatUserName = displayName => {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
}

describe("reply", () => {
  const signupName = generateRandomName()
  const signupPassword = randomString()
  const signupUserId =
    formatUserName(signupName) +
    randomString(`abcdefghijklmnopqrstuvwxyz0123456780-`, 10)
  const signupEmail = `${signupUserId}@example.com`

  beforeEach(() => {
    cy.intercept("POST", ".netlify/functions/auth").as("postAuth")
    cy.intercept("POST", ".netlify/functions/user").as("postUser")
    cy.intercept("GET", ".netlify/functions/gauth").as("getGauth")
    cy.intercept("POST", ".netlify/functions/comment/*").as("postComment")

    cy.visit("/")
    cy.get("button.comment-reply-button").first().as("replyButton")
    cy.get("@replyButton")
      .closest("article.comment-body")
      .as("commentBody", { type: "static" })
    cy.get("@commentBody").should("exist")
    cy.get("@replyButton").click()
  })

  it("should allow user to cancel their reply without answering", () => {
    cy.get("@commentBody").find(".comment-field").should("exist")
    cy.get("@commentBody").find(".comment-cancel-button").click()
    cy.get("@commentBody")
      .find(".comment-field")
      .should("not.exist", { timeout: 1000 })
  })
  it("it should reply to a comment as a guest", () => {
    cy.clearLocalStorage()
    cy.get("@commentBody").find(".selection-tab-guest").click()

    const commentText = generateRandomCopy()
    const guestName = generateRandomName()
    cy.get("@commentBody").find(".comment-field").clear().type(commentText)
    cy.get("@commentBody").find("#guest-name").clear().type(guestName)
    cy.get("@commentBody")
      .find("#guest-email")
      .clear()
      .type("guest@example.com")

    cy.get("@commentBody").find(".comment-submit-button").click()
    cy.wait("@getGauth").its("response.statusCode").should("eq", 200)
    cy.wait("@postUser").its("response.statusCode").should("eq", 201) // 201 Created
    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created

    cy.get("@commentBody")
      .parent()
      .find("ul.comment-replies")
      .should("contain", guestName)
    cy.get("@commentBody")
      .parent()
      .find("ul.comment-replies")
      .should("contain", commentText)

    cy.get("@commentBody")
      .find(".comment-form")
      .should("not.exist", { timeout: 1000 })
  })
  it("it should reply to a comment as a signup", () => {
    cy.get("@commentBody").find(".selection-tab-signup").click()

    const commentText = generateRandomCopy()

    cy.get("@commentBody").find(".comment-field").clear().type(commentText)
    cy.get("@commentBody").find("#signup-name").clear().type(signupName)
    cy.get("@commentBody").find("#signup-user-id").clear().type(signupUserId)
    cy.get("@commentBody").find("#signup-email").clear().type(signupEmail)
    cy.get("@commentBody").find("#signup-password").clear().type(signupPassword)
    cy.get("@commentBody")
      .find("#signup-password-confirm")
      .clear()
      .type(signupPassword)
    cy.get("@commentBody").find(".comment-submit-button").click()

    cy.wait("@postAuth").its("response.statusCode").should("eq", 200)
    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created
    cy.get("@commentBody")
      .parent()
      .find("ul.comment-replies")
      .should("contain", signupName)
    cy.get("@commentBody")
      .parent()
      .find("ul.comment-replies")
      .should("contain", commentText)

    cy.get("@commentBody")
      .find(".comment-form")
      .should("not.exist", { timeout: 1000 })
  }) // it should reply to a comment as a signup
  it("it should reply to a comment as a login", () => {
    cy.get("@commentBody").find(".selection-tab-login").click()

    const commentText = generateRandomCopy()

    cy.get("@commentBody").find(".comment-field").clear().type(commentText)
    cy.get("@commentBody").find("#login-user-id").clear().type(signupUserId)
    cy.get("@commentBody").find("#login-password").clear().type(signupPassword)
    cy.get("@commentBody").find(".comment-submit-button").click()

    cy.wait("@postAuth").its("response.statusCode").should("eq", 200)

    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created
    cy.get("@commentBody")
      .parent()
      .find("ul.comment-replies")
      .should("contain", signupName)
    cy.get("@commentBody")
      .parent()
      .find("ul.comment-replies")
      .should("contain", commentText)

    cy.get("@commentBody")
      .find(".comment-form")
      .should("not.exist", { timeout: 1000 })
  }) // it should reply to a comment as a login
})
