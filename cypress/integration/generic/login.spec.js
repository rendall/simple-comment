/// <reference types="cypress" />
describe('User Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:7070/login.html');
  });

  it('should log in a user', () => {
    cy.intercept('POST', '/auth', (req) => {
      expect(req.body).to.include({
        identifier: 'testuser',
        password: 'testpassword',
      });
      req.reply({
        statusCode: 200,
        body: { token: 'testToken' },
      });
    });

    cy.get('#login-user-name').type('testuser');
    cy.get('#login-password').type('testpassword');
    cy.get('#login-form input[type="submit"]').click();
  });

  it('should sign up a user', () => {
    cy.intercept('POST', '/user', (req) => {
      expect(req.body).to.include({
        name: 'testname',
        email: 'testemail@test.com',
        password: 'testpassword',
      });
      req.reply({
        statusCode: 201,
        body: { id: 'testId' },
      });
    });

    cy.get('#signup-name').type('testname');
    cy.get('#signup-user-name').type('testuser');
    cy.get('#signup-email').type('testemail@test.com');
    cy.get('#signup-password').type('testpassword');
    cy.get('#signup-form input[type="submit"]').click();
  });

  it('should log out a user', () => {
    cy.intercept('DELETE', '/auth', (req) => {
      req.reply({
        statusCode: 202,
        body: { message: 'Logged out' },
      });
    });

    cy.get('#log-out-button').click();
  });
});

