/// <reference types="cypress" />

const discussionId = "http-localhost-5000"

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

describe("Login tab persistence", () => {
  it("persists the selected signup tab across reloads", () => {
    cy.intercept("GET", "/.netlify/functions/verify", req => {
      req.reply({
        statusCode: 401,
        body: { message: "Unauthenticated" },
      })
    }).as("verifyUser")

    cy.intercept("GET", `/.netlify/functions/topic/${discussionId}`, req => {
      req.reply({
        statusCode: 200,
        body: buildDiscussion(),
      })
    }).as("getTopic")

    cy.visit("/")

    cy.wait("@verifyUser")
    cy.wait("@getTopic")

    cy.get("button.selection-tab-signup").click()
    cy.get("#signup-form").should("exist")

    cy.window().then(contentWindow => {
      expect(
        contentWindow.localStorage.getItem("simple_comment_login_tab")
      ).to.eq("2")
    })

    cy.reload()

    cy.wait("@verifyUser")
    cy.wait("@getTopic")

    cy.get("#signup-form").should("exist")
    cy.get("button.selection-tab-signup").should("have.class", "selected")
  })
})
