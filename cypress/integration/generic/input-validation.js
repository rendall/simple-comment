/// <reference types="cypress" />

context("Input invalid data", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080")
    cy.get("#email-field").clear()
    cy.get("#name-field").clear()
    cy.get("#reply-field").clear()
  })

  it("Submit a comment without adding email or name", () => {
    cy.wait(2500)
    const comment = `I'd like to ask advice about how to tackle the upcoming work week. I am in the process of moving. The company moved the floorplan, I am taking my office with me.`
    cy.get("#reply-field").type(comment)
    cy.get("#reply-submit-button").click()
    // This error should present immediately
    cy.get("#status-display").should('have.class', 'error')
  })

  it("Submit a comment only adding name", () => {
    // https://on.cypress.io/type
    cy.intercept('POST', '.netlify/functions/comment/').as('postComment')
    cy.wait(2500)
    cy.get("#name-field").type("Elli Reko Rautio")
    const comment = `I'd like to ask advice about how to tackle the upcoming work week. I am in the process of moving. The company moved the floorplan, I am taking my office with me.`
    cy.get("#reply-field").type(comment)
    cy.get("#reply-submit-button").click()
    cy.get("#status-display").should('have.class', 'error')
  })

  it("Submit a comment only adding email", () => {
    cy.wait(2500)
    cy.get("#email-field").type("fake@email.com")
    const comment = `I'd like to ask advice about how to tackle the upcoming work week. I am in the process of moving. The company moved the floorplan, I am taking my office with me.`
    cy.get("#reply-field").type(comment)
    cy.get("#reply-submit-button").click()
    cy.get("#status-display").should('have.class', 'error')
  })

  it("Submit a comment adding invalid email", () => {
    // https://on.cypress.io/type
    cy.wait(2500)
    cy.get("#email-field").type("invalid@emailcom")
    cy.get("#name-field").type("Elli Reko Rautio")
    const comment = `I'd like to ask advice about how to tackle the upcoming work week. I am in the process of moving. The company moved the floorplan, I am taking my office with me.`
    cy.get("#reply-field").type(comment)
    cy.get("#reply-submit-button").click()
    cy.get(".error#status-display")
    cy.get("#email-field").clear()
    cy.get("#email-field").type("valid@email.com")
    cy.get("#reply-submit-button").click()
    cy.get("#status-display").should('not.have.class', 'error')
  })
})
