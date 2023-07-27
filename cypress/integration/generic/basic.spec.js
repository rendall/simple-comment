/// <reference types="cypress" />
describe("Simple Comment frontend", () => {
  it("successfully loads", () => {
    cy.visit("http://localhost:7070/?topicId=cypress-tests") // change URL to match your dev URL
  })

  it("is a Simple Comment frontend", () => {
    cy.get("#simple-comment-display")
  })

  it("has a comment reply field", () => {
    cy.get("textarea.comment-field")
  })

  it("has a comment button", () => {
    cy.get("button.comment-submit-button")
  })
})
