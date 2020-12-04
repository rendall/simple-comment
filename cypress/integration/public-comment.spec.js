/// <reference types="cypress" />

context("Actions", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080")
  })

  it("Create and submit a comment as a public / unknown user", () => {
    // https://on.cypress.io/type
    cy.wait(2500)

    cy.get("#email-input")
    cy.get("#email-input").type("fake@email.com")

    cy.get("#name-input")
    cy.get("#name-input").type("Elli Reko Rautio")

    const comment=`I'd like to ask advice about how to tackle the upcoming work week. I am in the process of moving. The company moved the floorplan, I am taking my office with me. The home for our two bookstores is not done, there is still stuff to move out. I have also taken over the store"s support department as well. I have never done these two things at the same time. Nor am I experienced in doing either. In fact, I am not certain how to do the support job. So I am looking for advice on how to do it.`

    cy.get("#reply-textarea")
    cy.get("#reply-textarea").type(comment)

    cy.get("#reply-submit-button")
    cy.get("#reply-submit-button").click()

    cy.get("#status-display")
    cy.get("#status-display").should("contain", "Successfully posted comment")

    cy.get(".comment-button.delete-button")
    cy.get(".comment-button.delete-button").click()

    cy.get("#status-display").should("contain", "Comment deleted")
  })

})
