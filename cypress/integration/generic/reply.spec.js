/// <reference types="cypress" />

import {
  generateRandomCopy,
  generateRandomName,
} from "../../../src/tests/mockData"

describe("reply", () => {
  beforeEach(() => {
    cy.intercept("POST", ".netlify/functions/comment/*").as("postComment")

    cy.visit("http://localhost:7070")
    cy.get("button.comment-reply-button").first().as("replyButton")
    cy.get("@replyButton").closest("article.comment-body").as("commentBody")
    cy.get("@replyButton").click()
  })
  it("it should reply to a comment as a guest", () => {
    const commentText = generateRandomCopy()
    const guestName = generateRandomName()
    cy.get("@commentBody").find(".comment-field").type(commentText)
    cy.get("@commentBody").find(".selection-tab-guest").click()
    cy.get("@commentBody").find(".guest-name").type(guestName)
    cy.get("@commentBody").find(".guest-email").type("guest@example.com")
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
  // it should reply to a comment as a signup
  // it should reply to a comment as a login
})
