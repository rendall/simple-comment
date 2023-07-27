/// <reference types="cypress" />

context("Input invalid data", () => {
  beforeEach(() => {
    cy.visit("http://localhost:7070/?topicId=cypress-tests")
    cy.get("#guest-email").clear()
    cy.get("#guest-name").clear()
    cy.get("textarea.comment-field").clear()
  })

  it("Submit a comment without adding email or name", () => {
    cy.wait(2500)
    const comment = `I'd like to ask advice about how to tackle the upcoming work week. I am in the process of moving. The company moved the floorplan, I am taking my office with me.`
    cy.get("textarea.comment-field").type(comment)
    cy.get("button.comment-submit-button").click()
    // This error should present immediately
    cy.get("#status-display").should("have.class", "error")
  })

  it("Submit a comment only adding name", () => {
    // https://on.cypress.io/type
    cy.intercept("POST", ".netlify/functions/comment/").as("postComment")
    cy.wait(2500)
    cy.get("#guest-name").type("Elli Reko Rautio")
    const comment = `I'd like to ask advice about how to tackle the upcoming work week. I am in the process of moving. The company moved the floorplan, I am taking my office with me.`
    cy.get("textarea.comment-field").type(comment)
    cy.get("button.comment-submit-button").click()
    cy.get("#status-display").should("have.class", "error")
  })

  it("Submit a comment only adding email", () => {
    cy.wait(2500)
    cy.get("#guest-email").type("fake@email.com")
    const comment = `I'd like to ask advice about how to tackle the upcoming work week. I am in the process of moving. The company moved the floorplan, I am taking my office with me.`
    cy.get("textarea.comment-field").type(comment)
    cy.get("button.comment-submit-button").click()
    cy.get("#status-display").should("have.class", "error")
  })

  it("Submit a comment adding invalid email", () => {
    // https://on.cypress.io/type
    cy.wait(2500)
    cy.get("#guest-email").type("invalid@emailcom")
    cy.get("#guest-name").type("Elli Reko Rautio")
    const comment = `I'd like to ask advice about how to tackle the upcoming work week. I am in the process of moving. The company moved the floorplan, I am taking my office with me.`
    cy.get("textarea.comment-field").type(comment)
    cy.get("button.comment-submit-button").click()
    cy.get(".error#status-display")
    cy.get("#guest-email").clear()
    cy.get("#guest-email").type("valid@email.com")
    cy.get("button.comment-submit-button").click()
    cy.get("#status-display").should("not.have.class", "error")
  })
})
