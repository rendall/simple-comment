/// <reference types="cypress" />

import {
  generateRandomCopy,
  generateRandomName,
} from "../../../src/tests/mockData"

describe("Guest comment", { testIsolation: false }, () => {
  const commentText = generateRandomCopy()
  let userId

  before(() => {
    cy.clearAllLocalStorage()
    cy.clearAllCookies()
  })

  beforeEach(() => {
    cy.clearLocalStorage("simple_comment_login_tab")
    cy.visit("/")
  })

  it("Submit a comment as a guest user", () => {
    cy.intercept("POST", ".netlify/functions/comment/*").as("postComment")
    cy.intercept("GET", ".netlify/functions/user/*").as("getUser")
    cy.get("form.comment-form #guest-email").clear().type("fake@email.com")
    cy.get("form.comment-form #guest-name").clear().type(generateRandomName())
    cy.get("form.comment-form .comment-field").clear().type(commentText)
    cy.get("form.comment-form .comment-submit-button").click()
    cy.wait("@getUser").its("response.statusCode").should("eq", 200)
    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created
    cy.contains("article.comment-body p", commentText).as("commentBody")
    cy.get("@commentBody").should("exist")
    cy.get("@commentBody").parents("li.comment").should("have.class", "is-new")
    cy.get("p#self-user-id").should("exist")
    cy.get("p#self-user-id")
      .invoke("text")
      .then(displayedUserId => {
        userId = displayedUserId
      })
  })

  it("Delete a comment as a logged-in guest user", () => {
    cy.intercept("DELETE", ".netlify/functions/comment/*").as("deleteComment")
    cy.get(".comment-delete-button").first().click()
    cy.wait("@deleteComment").its("response.statusCode").should("eq", 202) // 202 Accepted
    cy.contains("article.comment-body p", commentText).should("not.exist")
  })

  it("Reply to a comment as a logged-in guest", () => {
    cy.get("button.comment-reply-button").first().as("replyButton")
    cy.get("@replyButton").closest("article.comment-body").as("commentBody")
    cy.get("@replyButton").first().click()
    cy.get("form.guest-login-form").should("not.exist")
  })

  it("Can log out", () => {
    cy.get("button#log-out-button").first().click()
    cy.get("form.guest-login-form").should("exist")
  })

  it("Logs in as same user", () => {
    cy.get("form.comment-form .comment-field").clear().type(commentText)
    cy.intercept("POST", ".netlify/functions/auth").as("postAuth")
    cy.get("form.comment-form .comment-submit-button").click()
    cy.wait("@postAuth").its("response.statusCode").should("eq", 200)
    cy.contains("article.comment-body p", commentText).as("commentBody")
    cy.get("@commentBody").should("exist")
    cy.get("p#self-user-id").should("exist")
    cy.contains("p#self-user-id", userId)
  })

  it("Will not log in as same user with altered data", () => {
    cy.get("p#self-user-id").contains(userId)
    cy.intercept("DELETE", ".netlify/functions/auth").as("deleteAuth")
    cy.intercept("POST", ".netlify/functions/auth").as("postAuthError")
    cy.get("button#log-out-button").first().click()
    // Alter the local information
    cy.getAllLocalStorage().then(localStorageMap => {
      const key = "simple_comment_user"
      const storedUser = window.localStorage.getItem(key)
      const cyStoredUser = localStorageMap["http://localhost:7070"][key]
      expect(storedUser).to.deep.equal(cyStoredUser)
      const parsedUser = JSON.parse(storedUser)
      const { id, name, email } = parsedUser
      const alteredUser = {
        id,
        name,
        email,
        challenge: "wrong-challenge",
      }

      window.localStorage.setItem(key, JSON.stringify(alteredUser))
      const storedAlteredUser = JSON.parse(window.localStorage.getItem(key))
      expect(storedAlteredUser).to.deep.equal(alteredUser)
    })
    cy.wait("@deleteAuth").its("response.statusCode").should("eq", 202)
    cy.get("form.comment-form .comment-field").clear().type(commentText)
    cy.get("form.comment-form .comment-submit-button").click()
    cy.wait("@postAuthError").its("response.statusCode").should("eq", 401)
    cy.contains("article.comment-body p", commentText).as("commentBody")
    cy.get("@commentBody").should("exist")
    cy.get("p#self-user-id").should("not.contain", userId)
  })
})
