/// <reference types="cypress" />

const discussionId = "http-localhost-5000"
const userId = "testuser"

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

describe("Explicit logout", () => {
  it("logs out an authenticated user through DELETE /auth", () => {
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
          id: userId,
          name: "Test User",
          email: "testuser@example.com",
          isAdmin: false,
        },
      })
    }).as("getSelf")

    cy.intercept("DELETE", "/.netlify/functions/auth", req => {
      expect(req.method).to.equal("DELETE")
      req.reply({
        statusCode: 202,
        body: { message: "Logged out" },
      })
    }).as("deleteAuth")

    cy.visit("/")

    cy.wait("@verifyUser")
    cy.wait("@getSelf")
    cy.wait("@getTopic")

    cy.get("#self-display").should("contain", "Test User")
    cy.get("#log-out-button").click()

    cy.wait("@deleteAuth")
    cy.get("#self-display").should("not.exist")
    cy.get("#user-login-form").should("exist")
  })
})
