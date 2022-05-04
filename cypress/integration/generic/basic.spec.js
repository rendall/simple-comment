/// <reference types="cypress" />
describe('Simple Comment frontend', () => {
  it('successfully loads', () => {
    cy.visit('http://localhost:8080') // change URL to match your dev URL
  })

  it('is a Simple Comment frontend', () => {
    cy.get("#simple-comment-display")
  })

  it('has a comment reply field', () => {
    cy.get("#reply-field")
  })

  it('has a comment button', () => {
    cy.get("#reply-submit-button")
  })
})