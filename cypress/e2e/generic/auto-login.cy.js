/// <reference types="cypress" />

const discussionId = "http-localhost-5000"
const userId = "testuser"
const storedUser = {
  id: userId,
  name: "Test User",
  email: "testuser@example.com",
}

const buildDiscussion = () => ({
  _id: discussionId,
  id: discussionId,
  parentId: null,
  text: null,
  title: "Simple Comment",
  user: {},
  dateCreated: "2023-05-05T06:11:26.781Z",
  dateDeleted: null,
  replies: [],
})

describe("Returning-user auto login", () => {
  it("restores the authenticated session on load for a stored user", () => {
    cy.intercept("GET", `/.netlify/functions/topic/${discussionId}`, req => {
      expect(req.method).to.equal("GET")
      req.reply({
        statusCode: 200,
        body: buildDiscussion(),
      })
    }).as("getTopic")

    cy.intercept("GET", "/.netlify/functions/verify", req => {
      expect(req.method).to.equal("GET")
      req.reply({
        statusCode: 200,
        body: { user: userId, exp: 1721980130, iat: 1690444137 },
      })
    }).as("verifyUser")

    cy.intercept("GET", `/.netlify/functions/user/${userId}`, req => {
      expect(req.method).to.equal("GET")
      req.reply({
        statusCode: 200,
        body: {
          ...storedUser,
          isAdmin: false,
        },
      })
    }).as("getSelf")

    cy.visit("/", {
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

    cy.get("#self-display").should("contain", "Test User")
    cy.get("#self-display").should("contain", "@testuser")
    cy.get("#user-login-form").should("not.exist")
  })
})
