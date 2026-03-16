/// <reference types="cypress" />
describe("Simple Comment frontend", () => {
  beforeEach(() => cy.visit("/"))

  it("successfully loads", () => {
    cy.visit("/")
  })

  it("is a Simple Comment frontend", () => {
    cy.get("#simple-comment")
      .should("exist")
      .within(() => {
        cy.get("textarea.comment-field")
        cy.get("button.comment-submit-button")
      })
  })

  it("has a comment reply field", () => {
    cy.get("textarea.comment-field")
  })

  it("has a comment button", () => {
    cy.get("button.comment-submit-button")
  })
})
