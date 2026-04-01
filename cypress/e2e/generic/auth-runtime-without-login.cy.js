/// <reference types="cypress" />

const userId = "runtime-user"
const storedUser = {
  id: userId,
  name: "Runtime User",
  email: "runtime.user@example.com",
}

describe("Auth runtime without Login.svelte", () => {
  it("restores auth from storage when the runtime is mounted before Login.svelte is rendered", () => {
    cy.intercept("GET", "/.netlify/functions/verify", req => {
      req.reply({
        statusCode: 200,
        body: { user: userId, exp: 1721980130, iat: 1690444137 },
      })
    }).as("verifyUser")

    cy.intercept("GET", `/.netlify/functions/user/${userId}`, req => {
      req.reply({
        statusCode: 200,
        body: {
          ...storedUser,
          isAdmin: false,
        },
      })
    }).as("getSelf")

    cy.visit("/cypress/auth-runtime-without-login-host.html", {
      onBeforeLoad(contentWindow) {
        contentWindow.localStorage.setItem(
          "simple_comment_user",
          JSON.stringify(storedUser)
        )
      },
    })

    cy.wait("@verifyUser")
    cy.wait("@getSelf")

    cy.get("#self-display").should("contain", "Runtime User")
    cy.get("#self-display").should("contain", "@runtime-user")
    cy.get("#user-login-form").should("not.exist")
    cy.get(".simple-comment-login").should("not.exist")
  })

  it("allows interactive login after Login.svelte is rendered later", () => {
    cy.intercept("GET", "/.netlify/functions/verify", req => {
      req.reply({
        statusCode: 200,
        body: { user: userId, exp: 1721980130, iat: 1690444137 },
      })
    }).as("verifyLoggedIn")

    cy.intercept(
      {
        method: "GET",
        url: "/.netlify/functions/verify",
        times: 1,
      },
      req => {
      req.reply({
        statusCode: 401,
        body: { message: "Unauthenticated" },
      })
      }
    ).as("verifyLoggedOut")

    cy.intercept("POST", "/.netlify/functions/auth", req => {
      req.reply({
        statusCode: 200,
        body: "OK",
      })
    }).as("postAuth")

    cy.intercept("GET", `/.netlify/functions/user/${userId}`, req => {
      req.reply({
        statusCode: 200,
        body: {
          ...storedUser,
          isAdmin: false,
        },
      })
    }).as("getSelf")

    cy.visit("/cypress/auth-runtime-without-login-host.html")

    cy.wait("@verifyLoggedOut")
    cy.get(".simple-comment-login").should("not.exist")

    cy.get("#show-login-button").click()
    cy.get(".simple-comment-login").should("exist")
    cy.get(".selection-tab-login").click()
    cy.get("#login-user-id").type(userId)
    cy.get("#login-password").type("top-secret")
    cy.get("#user-login-form").submit()

    cy.wait("@postAuth")
    cy.wait("@verifyLoggedIn")
    cy.wait("@getSelf")

    cy.get("#self-display").should("contain", "Runtime User")
    cy.get("#self-display").should("contain", "@runtime-user")
  })
})
