/// <reference types="cypress" />

const discussionId = "runtime-without-login-discussion"
const userId = "runtime-user"
const storedUser = {
  id: userId,
  name: "Runtime User",
  email: "runtime.user@example.com",
}

const buildDiscussion = () => ({
  _id: discussionId,
  id: discussionId,
  parentId: null,
  text: null,
  title: "Auth Runtime Without Login",
  user: {},
  dateCreated: "2023-05-05T06:11:26.781Z",
  dateDeleted: null,
  replies: [],
})

describe.skip("Auth runtime without Login.svelte", () => {
  it("restores auth from storage when the runtime is mounted and login UI is absent at startup", () => {
    cy.intercept("GET", `/.netlify/functions/topic/${discussionId}`, req => {
      req.reply({
        statusCode: 200,
        body: buildDiscussion(),
      })
    }).as("getTopic")

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
    cy.wait("@getTopic")

    cy.get("#self-display").should("contain", "Runtime User")
    cy.get("#self-display").should("contain", "@runtime-user")
    cy.get("#user-login-form").should("not.exist")
    cy.get(".simple-comment-login").should("not.exist")
  })
})
