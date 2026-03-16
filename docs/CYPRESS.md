# Cypress Testing Module

Simple Comment uses <https://cypress.io> for frontend browser validation.

## Current Layout

- Cypress config: [cypress.config.ts](../cypress.config.ts)
- Support file: [e2e.js](../cypress/support/e2e.js)
- Generic/embed specs: [generic](../cypress/e2e/generic)

The generic/embed specs are written against the public embed contract and current host-page conventions:

- embed host element: `#simple-comment`
- spec file naming: `*.cy.js`
- E2E spec root: `cypress/e2e`

## Writing Tests

Writing tests is an entire discipline in itself, but this page has a good introduction:
<https://docs.cypress.io/guides/getting-started/writing-your-first-test.html#Write-a-real-test>

## Create a Frontend Client

Simple Comment has a robust backend and is designed to accommodate different frontend clients.

Tests in `cypress/e2e/generic` are intended to validate browser-visible embed behavior with minimal assumptions. If you build another client and want to reuse the generic suite, align the host page and interactive elements with the current public contract rather than the older `#simple-comment-display` scaffolding.

## Adding a New Feature to the Frontend

Add new browser specs under `cypress/e2e/`, either in an existing folder or in a new one that matches the feature area. Keep generic/embed coverage under `cypress/e2e/generic` focused on shared browser-boundary behavior that should remain stable across frontend changes.

## Config

The Cypress config file for this repository is [cypress.config.ts](../cypress.config.ts).

Current conventions include:

- `baseUrl: "http://localhost:5000"`
- `supportFile: "cypress/support/e2e.js"`
- `excludeSpecPattern: "**/examples/*.spec.js"`

## Code Completion

To enable code completion for Cypress test files, add this line to the top of the file:

`/// <reference types="cypress" />`

## Ignoring Examples

Cypress example specs are excluded through `excludeSpecPattern` in [cypress.config.ts](../cypress.config.ts).

## Spec Files

- `basic.cy.js` covers the embed auto-init and configured bootstrap baseline.
- `public-comment.cy.js` covers deterministic guest top-level comment submission.
- `reply.cy.js` covers deterministic reply submission.
- `login.cy.js` covers authenticated login/verify plus an authenticated action.
