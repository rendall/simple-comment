/// <reference types="cypress" />

import { randomString } from "../../../src/tests/mockData"

describe("Signup Functionality", () => {
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
    cy.get("button.selection-tab-signup").click()
  })

  it("Displays error when trying to sign up with invalid email", () => {
    cy.get("#signup-email")
      .parents(".input-field")
      .should("not.have.class", "is-error")
    cy.get("#signup-email").clear()
    cy.get("#signup-email").clear().type("invalidemail")
    cy.get(".input-field.is-error .helper-text").should("not.be.empty")
  })

  it("Displays error when trying to sign up with a user handle that is already taken", () => {
    cy.intercept("GET", "/.netlify/functions/user/existinguser", req => {
      req.reply({
        statusCode: 200,
        body: '{"id":"existinguser","name":"Test User","isAdmin":false,"email":"existinguser@example.com"}',
      })
    })
    cy.get("#signup-user-id")
      .parents(".input-field")
      .should("not.have.class", "is-error")
    cy.get("#signup-name").clear()
    cy.get("#signup-user-id").clear().type("existinguser")
    cy.get(".input-field.is-error .helper-text").should(
      "contain",
      "'existinguser' is already taken. Please try another one."
    )
  })

  it("Displays error when signing up with common password", () => {
    cy.intercept("GET", "/.netlify/functions/user/newuser", req => {
      req.reply({ statusCode: 400 })
    })

    cy.get("#signup-name").clear().type("Test User")
    cy.get("#signup-user-id").clear().type("newuser")
    cy.get("#signup-email").clear().type("newuser@example.com")
    cy.get("#signup-password").clear().type("password123")
    cy.get("#signup-password-confirm").clear().type("password123")
    cy.get("#signup-form").submit()

    cy.get("#status-display").should("have.class", "is-error")
    cy.get("#status-display").should(
      "contain",
      "password123 is too easily guessed"
    )
  })

  it("Displays success when signing up with valid data", () => {
    const newUserInfo = {
      id: "newuser",
      name: "Test User",
      email: "newuser@example.com",
    }

    const password = randomString()

    cy.intercept("GET", "/.netlify/functions/user/newuser", req => {
      req.reply({ statusCode: 404 })
    })

    cy.intercept("POST", "/.netlify/functions/user", req => {
      req.reply({ statusCode: 201, body: newUserInfo })
    })

    cy.intercept("POST", "/.netlify/functions/auth", req => {
      req.reply({ statusCode: 200, body: "OK" })
    })

    cy.intercept("GET", "/.netlify/functions/verify", req => {
      req.reply({
        statusCode: 200,
        body: '{"user":"newuser","exp":1721980130,"iat":1690444137}',
      })
    })

    cy.intercept("GET", "/.netlify/functions/user/newuser", req => {
      req.reply({ statusCode: 200, body: newUserInfo })
    })

    cy.get("#signup-name").clear().type(newUserInfo.name)
    cy.get("#signup-user-id").clear().type(newUserInfo.id)
    cy.get("#signup-email").clear().type(newUserInfo.email)
    cy.get("#signup-password").clear().type(password)
    cy.get("#signup-password-confirm").clear().type(password)

    cy.get(".comment-submit-button").click()

    cy.get("#status-display").should("not.exist")
    cy.get("#self-display").should("contain", "Test User")
    cy.get("#self-display").should("contain", "@newuser")
    cy.get("#self-display").should("contain", "newuser@example.com")
  })

  describe("PasswordTwinInput", () => {
    it("Toggles password when icon is pressed", () => {
      cy.get(".password-twin").should("have.class", "view")
      cy.get("#signup-password").should("have.attr", "type", "password")
      cy.get("#signup-password-confirm").should("exist")
      cy.get("#signup-password + button.icon").click()
      cy.get(".password-twin").should("not.have.class", "view")
      cy.get(".password-twin").should("have.class", "view-off")
      cy.get("#signup-password-confirm").should("not.exist")
      cy.get("#signup-password").should("have.attr", "type", "text")
    })

    it("Displays error when passwords do not match", () => {
      const password = "matchingPassword1776"
      cy.get("#signup-password").type(password)
      cy.get("#signup-password-confirm").clear().type("does not match")
      cy.get("#signup-password")
        .parents(".password-twin")
        .should("have.class", "is-error")
      cy.get("#signup-password-confirm").clear().type(password)
      cy.get("#signup-password")
        .parents(".password-twin")
        .should("not.have.class", "is-error")
    })

    it("Does not signup when passwords are mismatched", () => {
      const newUserInfo = {
        id: "newuser",
        name: "Test User",
        email: "newuser@example.com",
      }
      cy.intercept("GET", "/.netlify/functions/user/newuser", req => {
        req.reply({ statusCode: 404 })
      })

      cy.intercept("POST", "/.netlify/functions/user").as("postUser")

      cy.get("#signup-name").clear().type(newUserInfo.name)
      cy.get("#signup-user-id").clear().type(newUserInfo.id)
      cy.get("#signup-email").clear().type(newUserInfo.email)
      cy.get("#signup-password").clear().type(randomString())
      cy.get("#signup-password-confirm").clear().type(randomString())

      cy.get(".comment-submit-button").click()

      cy.wait(1000)
      cy.get("@postUser").then(interception => {
        expect(interception).to.be.null
      })
    })

    it("Does not sign up when second field is empty", () => {
      const newUserInfo = {
        id: "newuser",
        name: "Test User",
        email: "newuser@example.com",
      }
      cy.intercept("GET", "/.netlify/functions/user/newuser", req => {
        req.reply({ statusCode: 404 })
      })

      cy.intercept("POST", "/.netlify/functions/user").as("postUser")

      cy.get("#signup-name").clear().type(newUserInfo.name)
      cy.get("#signup-user-id").clear().type(newUserInfo.id)
      cy.get("#signup-email").clear().type(newUserInfo.email)
      cy.get("#signup-password").clear().type(randomString())
      cy.get("#signup-password-confirm").clear()

      cy.get(".comment-submit-button").click()

      cy.wait(1000)
      cy.get("@postUser").then(interception => {
        expect(interception).to.be.null
      })
    })

    it("Does sign up when second field is empty but view password is on", () => {
      const newUserInfo = {
        id: "newuser",
        name: "Test User",
        email: "newuser@example.com",
      }
      cy.intercept("GET", "/.netlify/functions/user/newuser", req => {
        req.reply({ statusCode: 404 })
      })

      cy.intercept("POST", "/.netlify/functions/user").as("postUser")

      cy.get("#signup-name").clear().type(newUserInfo.name)
      cy.get("#signup-user-id").clear().type(newUserInfo.id)
      cy.get("#signup-email").clear().type(newUserInfo.email)
      cy.get("#signup-password").clear().type(randomString())
      cy.get("#signup-password + button.icon").click()

      cy.get(".comment-submit-button").click()

      cy.wait(1000)
      cy.get("@postUser").then(interception => {
        expect(interception).not.to.be.null
      })
    })
  })
})
