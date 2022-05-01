/// <reference types="cypress" />

context("Essential actions", () => {
  before(() => {
    cy.visit("http://localhost:8080")
  })

  beforeEach(() => {
    // This keeps the same guest user authentication in memory for the
    // duration of these tests
    Cypress.Cookies.preserveOnce("simple_comment_token")
  })

  it("Submit a comment as a public / unknown user", () => {
    // https://on.cypress.io/type
    cy.intercept('POST', '.netlify/functions/comment/*').as('postComment')
    cy.wait(2500)
    cy.get("#email-field").type("fake@email.com")
    cy.get("#name-field").type("Elli Reko Rautio")
    const comment = `I'd like to ask advice about how to tackle the upcoming work week. I am in the process of moving. The company moved the floorplan, I am taking my office with me. The home for our two bookstores is not done, there is still stuff to move out. I have also taken over the store"s support department as well. I have never done these two things at the same time. Nor am I experienced in doing either. In fact, I am not certain how to do the support job. So I am looking for advice on how to do it.`
    cy.get("#reply-field").type(comment)
    cy.get("#reply-submit-button").click()
    cy.wait("@postComment").its('response.statusCode').should('eq', 201) // 201 Created
    cy.get("#status-display").should("contain", "Successfully posted comment")
  })

  it("Delete a comment as a public / unknown user", () => {
    cy.intercept('DELETE', '.netlify/functions/comment/*').as('deleteComment')
    cy.get(".comment-button.delete-button").click()
    cy.wait("@deleteComment").its('response.statusCode').should('eq', 202) // 202 Accepted
    cy.get("#status-display").should("contain", "Comment deleted")
  })
})
