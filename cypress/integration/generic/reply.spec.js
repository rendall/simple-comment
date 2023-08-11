/// <reference types="cypress" />

import {
  generateRandomCopy,
  generateRandomName,
  randomString,
} from "../../../src/tests/mockData"

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
  const signupUserId = formatUserName(signupName)
  const signupEmail = `${signupUserId}@example.com`

  beforeEach(() => {
    cy.clearCookie("simple_comment_token");  // clear the authentication/session cookie
    cy.intercept("POST", ".netlify/functions/comment/*").as("postComment")

    cy.visit("http://localhost:7070")
    cy.get("button.comment-reply-button").first().as("replyButton")
    cy.get("@replyButton").closest("article.comment-body").as("commentBody")
    cy.get("@replyButton").click()
  })
  it("it should reply to a comment as a guest", () => {
    cy.get("@commentBody").find(".selection-tab-guest").click()

    const commentText = generateRandomCopy()
    const guestName = generateRandomName()
    cy.get("@commentBody").find(".comment-field").type(commentText)
    cy.get("@commentBody").find("#guest-name").type(guestName)
    cy.get("@commentBody").find("#guest-email").type("guest@example.com")
    cy.get("@commentBody").find(".comment-submit-button").click()

    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created
    cy.get("@commentBody")
      .parent()
      .find("ul.comment-replies")
      .should("contain", guestName)
    cy.get("@commentBody")
      .parent()
      .find("ul.comment-replies")
      .should("contain", commentText)
  })
  it("it should reply to a comment as a signup", () => {
    cy.get("@commentBody").find(".selection-tab-signup").click()

    const commentText = generateRandomCopy()

    cy.get("@commentBody").find(".comment-field").type(commentText)
    cy.get("@commentBody").find("#signup-name").type(signupName)
    // cy.get("@commentBody").find("#signup-user-name").type(signupUserId)
    cy.get("@commentBody").find("#signup-email").type(signupEmail)
    cy.get("@commentBody").find("#signup-password").type(signupPassword)
    cy.get("@commentBody").find(".comment-submit-button").click()

    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created
    cy.get("@commentBody")
      .parent()
      .find("ul.comment-replies")
      .should("contain", signupName)
    cy.get("@commentBody")
      .parent()
      .find("ul.comment-replies")
      .should("contain", commentText)
  }) // it should reply to a comment as a signup

  it("it should reply to a comment as a login", () => {
    cy.get("@commentBody").find(".selection-tab-login").click()

    const commentText = generateRandomCopy()

    cy.get("@commentBody").find(".comment-field").type(commentText)
    cy.get("@commentBody").find("#login-user-name").type(signupUserId)
    cy.get("@commentBody").find("#login-password").type(signupPassword)
    cy.get("@commentBody").find(".comment-submit-button").click()

    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created
    cy.get("@commentBody")
      .parent()
      .find("ul.comment-replies")
      .should("contain", signupName)
    cy.get("@commentBody")
      .parent()
      .find("ul.comment-replies")
      .should("contain", commentText)
  }) // it should reply to a comment as a login
})
