/// <reference types="cypress" />

import {
  generateRandomCopy,
  generateRandomName,
} from "../../../src/tests/mockComment"

describe("Guest comment", { testIsolation: false }, () => {
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
    const guestCommentText = generateRandomCopy()
    cy.intercept("POST", ".netlify/functions/comment/*").as("postComment")
    cy.intercept("GET", ".netlify/functions/user/*").as("getUser")
    cy.get("form.comment-form #guest-email").clear().type("fake@email.com")
    cy.get("form.comment-form #guest-name").clear().type(generateRandomName())
    cy.get("form.comment-form .comment-field").clear().type(guestCommentText)
    cy.get("form.comment-form .comment-submit-button").click()
    cy.wait("@getUser").its("response.statusCode").should("eq", 200)
    cy.wait("@postComment").its("response.statusCode").should("eq", 201) // 201 Created
    cy.contains("article.comment-body p", guestCommentText).as("commentBody")
    cy.get("@commentBody").should("exist")
    cy.get("@commentBody").parents("li.comment").should("have.class", "is-new")
    cy.get("p#self-user-id").should("exist")
    cy.get("p#self-user-id")
      .invoke("text")
      .then(displayedUserId => {
        userId = displayedUserId
      })
  })

  it("Edit a comment as a logged-in guest user", () => {
    const loggedInEditText = generateRandomCopy()
    cy.intercept("PUT", ".netlify/functions/comment/*").as("putComment")
    cy.get(".comment-edit-button").first().click()
    cy.get("form.comment-form .comment-field").clear().type(loggedInEditText)
    cy.get("form.comment-form .comment-update-button").click()
    cy.wait("@putComment").its("response.statusCode").should("eq", 204) // 204
    cy.contains("article.comment-body p", loggedInEditText).should("exist")
  })

  it("Editing should handle errors", () => {
    const errorText = generateRandomCopy()
    let errorReply = true
    // Stub the first response to error out
    // then pass the next response through
    cy.intercept("PUT", ".netlify/functions/comment/*", req => {
      if (errorReply) {
        errorReply = false
        req.reply({
          statusCode: 500,
          body: "Error response body",
        })
      } else req.reply()
    }).as("putComment")
    cy.get(".comment-edit-button").first().click()

    cy.get("form.comment-form .comment-field").clear().type(errorText)
    cy.get("form.comment-form .comment-update-button").click()
    cy.wait("@putComment")

    cy.get("form.comment-form .comment-update-button").click()

    cy.wait("@putComment").then(interception => {
      expect(interception.response.statusCode).to.equal(204)
    })
    cy.contains("article.comment-body p", errorText).should("exist")
  })

  it("Delete a comment as a logged-in guest user", () => {
    cy.intercept("DELETE", ".netlify/functions/comment/*").as("deleteComment")
    cy.get(".comment-delete-button").as("deleteButton")
    cy.get("@deleteButton")
      .closest("article.comment-body")
      .children("p")
      .first()
      .as("articleBody")
    cy.get("@articleBody")
      .invoke("text")
      .then(articleBodyText => {
        expect(articleBodyText).not.to.be.undefined
        cy.contains("article.comment-body p", articleBodyText).should("exist")
        cy.get("@deleteButton").click()
        cy.wait("@deleteComment").its("response.statusCode").should("eq", 202) // 202 Accepted
        cy.contains("article.comment-body p", articleBodyText).should(
          "not.exist"
        )
      })
  })

  it("Reply to a comment as a logged-in guest", () => {
    cy.get("button.comment-reply-button").first().as("replyButton")
    cy.get("@replyButton").closest("article.comment-body").as("commentBody")
    cy.get("@replyButton").click()
    cy.get("form.guest-login-form").should("not.exist")
  })

  it("Can log out", () => {
    cy.get("button#log-out-button").first().click()
    cy.get("form.guest-login-form").should("exist")
  })

  it("Logs in as same user", () => {
    const sameUserCommentText = generateRandomCopy()
    cy.get("form.comment-form .comment-field").clear().type(sameUserCommentText)
    cy.intercept("POST", ".netlify/functions/auth").as("postAuth")
    cy.get("form.comment-form .comment-submit-button").click()
    cy.wait("@postAuth").its("response.statusCode").should("eq", 200)
    cy.contains("article.comment-body p", sameUserCommentText).as("commentBody")
    cy.get("@commentBody").should("exist")
    cy.get("p#self-user-id").should("exist")
    cy.contains("p#self-user-id", userId)
  })

  it("Will not log in as same user with altered data", () => {
    const sneakyHackerText = generateRandomCopy()
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
    cy.get("form.comment-form .comment-field").clear().type(sneakyHackerText)
    cy.get("form.comment-form .comment-submit-button").click()
    cy.wait("@postAuthError").its("response.statusCode").should("eq", 401)
    cy.contains("article.comment-body p", sneakyHackerText).as("commentBody")
    cy.get("@commentBody").should("exist")
    cy.get("p#self-user-id").should("not.contain", userId)
  })
})
