/// <reference types="cypress" />
describe('Simple Comment frontend', () => {
  it('successfully loads', () => {
    cy.visit('http://localhost:8080') // change URL to match your dev URL
  })

  it('is a Simple Comment frontend', () => {
    cy.get("#simple-comment-area")
  })

  it('has a comment field', () => {

  })

  it('has a comment button', () => {

  })
})