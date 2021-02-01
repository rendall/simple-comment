# Cypress testing module

Simple Comment uses <https://cypress.io> for its frontend testing. 

## Writing tests

Writing tests is an entire discipline in itself, but this page has a good introduction: <https://docs.cypress.io/guides/getting-started/writing-your-first-test.html#Write-a-real-test>

### Create a frontend client

Simple Comment has a robust backend, and is designed to accommodate any client or framework. You might find that none of the current suite of clients suite your needs, and so want to write your own.

Tests in `/cypress/integration/generic` are designed to test any frontend platform by including only basic functionality. It looks for elements with specific ids like `#simple-comment-display`, `#reply-field` and `#reply-submit-button`.  While the Simple Comment backend API will communicate successfully even without these specific elements, you could leverage these tests to ensure your new frontent client behaves as expected without writing new generic tests by using these ids with the elements that contain that functionality. You can also *ignore* these tests by adding `**/generic/*.spec.js` to the `ignoreTestFiles` array field in the `cypress.json` config file, if necessary.

### Adding a new feature to the frontend

First write a test for the new feature in `/cypress/integration/` (either choosing a previous folder and file or creating a new one). Really take some time with it. The test should test the functionality of the new feature, but it will fail because the new feature has not yet been added. After the feature is added, the new test should pass.

## Config

`/cypress.json` is the config file for Simple Comment's Cypress instance

## Code completion

To enable code completion for Cypress test files, add this line to the top of the file:

`/// <reference types="cypress" />`

## Ignoring 'examples'

Cypress installs example tests in the `/cypress/integration/examples` folder by default. Simple Comment excludes these via `cypress.json` config file. Remove the value `**/examples/*.spec.js` from the array `"ignoreTestFiles":["**/examples/*.spec.js"]` to include these files.

## SPEC FILES

* `basic.spec.js` contain tests that should pass when the app begins with no interaction
* `public-comment.spec.js`: tests basic public comment functionality
