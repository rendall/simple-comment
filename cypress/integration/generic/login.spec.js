/// <reference types="cypress" />


describe(`User Authentication Flow`, () => {
  beforeEach(() => {
    cy.visit("http://localhost:7070/")
  })

  it("should handle incorrect credentials", () => {
    // Check that #status-display does not have class is-error nor any message
    cy.get('#status-display').should('not.have.class', 'is-error');
    cy.get('#status-display').should('not.have.text');

    // Enter username and password
    cy.get("#login-user-name").type("wronguser")
    cy.get("#login-password").type("wrongpassword")

    // Click the log in button
    cy.get('#login-form button[type="submit"]').click()

    // Intercept the /auth request and return a 401 error
    cy.intercept("POST", "/.netlify/functions/auth", req => {
      req.reply({
        statusCode: 401,
        body: { message: "Bad credentials" },
      })
    })

    // Check that #status-display has class is-error and has a message
    cy.get('#status-display').should('have.class', 'is-error');
    cy.get('#status-display').should('not.be.empty');
  });

  it("should log in a user, verify the token, and get user details", () => {
    // Intercept the /auth request
    cy.intercept("POST", "/.netlify/functions/auth", req => {
      expect(req.headers.authorization).to.exist;
      req.reply({
        statusCode: 200,
        body: "\"OK\"",
        headers: {
          "set-cookie": "simple_comment_token=testToken; path=/; SameSite=Strict; HttpOnly; Max-Age=31536000"
        }
      });
    });

    // Intercept the /verify request
    cy.intercept("GET", "/.netlify/functions/verify", req => {
      expect(req.headers.cookie).to.exist;
      req.reply({
        statusCode: 200,
        body: "{\"user\":\"testuser\",\"exp\":1721980130,\"iat\":1690444137}"
      });
    });

    // Intercept the /user/testuser request
    cy.intercept("GET", "/.netlify/functions/user/testuser", req => {
      req.reply({
        statusCode: 200,
        body: "{\"id\":\"testuser\",\"name\":\"Test User\",\"isAdmin\":false,\"email\":\"testuser@example.com\"}"
      });
    });

    // Perform the login action
    cy.get("#login-user-name").type("testuser");
    cy.get("#login-password").type("testpassword");
    cy.get('#login-form button[type="submit"]').click();

    // Check the user details
    cy.get('#status-display').should('not.have.class', 'is-error');
    cy.get('#self-display').should('contain', 'Test User');
    cy.get('#self-display').should('contain', '@testuser');
    cy.get('#self-display').should('contain', 'testuser@example.com');
  });




  it("should log out a user", () => {
    // Intercept the /auth request
    cy.intercept("POST", "/.netlify/functions/auth", req => {
      expect(req.headers.authorization).to.exist;
      req.reply({
        statusCode: 200,
        body: "\"OK\"",
        headers: {
          "set-cookie": "simple_comment_token=testToken; path=/; SameSite=Strict; HttpOnly; Max-Age=31536000"
        }
      });
    });

    // Intercept the /verify request
    cy.intercept("GET", "/.netlify/functions/verify", req => {
      expect(req.headers.cookie).to.exist;
      req.reply({
        statusCode: 200,
        body: "{\"user\":\"testuser\",\"exp\":1721980130,\"iat\":1690444137}"
      });
    });

    // Intercept the /user/testuser request
    cy.intercept("GET", "/.netlify/functions/user/testuser", req => {
      req.reply({
        statusCode: 200,
        body: "{\"id\":\"testuser\",\"name\":\"Test User\",\"isAdmin\":false,\"email\":\"testuser@example.com\"}"
      });
    });

    // Intercept the DELETE /auth request
    cy.intercept("DELETE", "/.netlify/functions/auth", req => {
      req.reply({
        statusCode: 202,
        body: { message: "Logged out" },
      })
    })

    // First log in
    cy.get("#login-user-name").type("testuser")
    cy.get("#login-password").type("testpassword")
    cy.get('#login-form button[type="submit"]').click()

    cy.get('#login-form').should('not.exist')

    // Then test the log out
    cy.get("#log-out-button").click()

    // Check that the user is logged out
    cy.get('#self-display').should('not.exist');
    cy.get('#login-form').should('exist')
  });

})

