# Priority 5 Frontend Architecture Decoupling Checklist Validation

Status: active

Checklist: `docs/plans/Priority5FrontendArchitectureDecouplingChecklist.md`

## Command Evidence

- `yarn lint`
  - passes
- `yarn typecheck`
  - passes
- `yarn test:frontend`
  - passes
  - current frontend Jest suite: `8` suites, `148` tests

## Runtime / Integration Evidence

- `T02` frontend Jest runtime-only proof:
  - `yarn test:frontend --runTestsByPath src/tests/frontend/auth-runtime.test.ts`
  - passes
  - proves auth lifecycle works when the runtime starts without `Login.svelte` mounted
- `T02` Cypress later-rendered interactive-login proof:
  - `env -u ELECTRON_RUN_AS_NODE ./node_modules/.bin/cypress run --spec cypress/e2e/generic/auth-runtime-without-login.cy.js`
  - passes
  - proves auth restore works before `Login.svelte` is rendered and interactive login still works after `Login.svelte` is rendered later

## T03 Focused Auth Smoke Evidence

These runs were executed against a local frontend preview. In this shell, Cypress required `env -u ELECTRON_RUN_AS_NODE` because the ambient `ELECTRON_RUN_AS_NODE=1` environment variable prevented the Cypress binary from starting correctly.

Passing focused smoke evidence:

- `env -u ELECTRON_RUN_AS_NODE ./node_modules/.bin/cypress run --spec cypress/e2e/generic/login.cy.js`
  - passes
  - parity coverage: `P03`
- `env -u ELECTRON_RUN_AS_NODE ./node_modules/.bin/cypress run --spec cypress/e2e/generic/public-comment.cy.js`
  - passes
  - parity coverage: `P05`
- `env -u ELECTRON_RUN_AS_NODE ./node_modules/.bin/cypress run --spec cypress/e2e/generic/logout.cy.js`
  - passes
  - parity coverage: `P06`
- `env -u ELECTRON_RUN_AS_NODE ./node_modules/.bin/cypress run --spec cypress/e2e/generic/login-tab-persistence.cy.js`
  - passes
  - parity coverage: `P02`
- `env -u ELECTRON_RUN_AS_NODE ./node_modules/.bin/cypress run --spec cypress/e2e/generic/auth-runtime-without-login.cy.js`
  - passes
  - parity coverage: `P08`
- `env -u ELECTRON_RUN_AS_NODE ./node_modules/.bin/cypress run --spec cypress/e2e/generic/login.cy.js,cypress/e2e/generic/signup.cy.js`
  - login flow passes
  - signup happy-path passes
  - signup invalid-email error-path passes

## Parity Notes

- `P01` Session restore on startup:
  - preserved by the runtime/controller split and validated through `auth-runtime-without-login.cy.js` plus `auth-runtime.test.ts`
- `P02` Login tab persistence:
  - preserved
  - validated by `login-tab-persistence.cy.js`
- `P03` Username/password login:
  - preserved after `C11`
  - validated by `login.cy.js`
- `P04` Signup:
  - signup happy-path preserved after `C11`
  - validated by the passing happy-path inside `signup.cy.js`
- `P05` Guest login:
  - preserved
  - validated by `public-comment.cy.js`
- `P06` Logout:
  - preserved after `C12`
  - validated by `logout.cy.js`
- `P08` Auth lifecycle independent of `Login.svelte`:
  - preserved
  - validated by `auth-runtime.test.ts` and `auth-runtime-without-login.cy.js`
- `P09` No backend/API contract change:
  - no contract changes were required for the decoupling work completed in this checklist
- `P10` Consumer behavior parity:
  - `CommentInput.svelte` and `SelfDisplay.svelte` parity regressions discovered during `T03` were fixed by `C11` and `C12`

## One Non-Blocking Test Mismatch

`cypress/e2e/generic/signup.cy.js` still has one failing case:

- `Displays error when signing up with common password`

Classification against the Priority 5 parity matrix:

- classification: `stale test`
- reason:
  - the test expects the frontend to show the backend-only password-policy message `"password123 is too easily guessed"`
  - the spec does not stub the `POST /.netlify/functions/user` path needed to deterministically exercise that backend rejection
  - instead, it stubs `GET /.netlify/functions/user/newuser` with `400`, which does not correspond to the create-user request that would produce the password-policy response
- impact on Priority 5:
  - this mismatch was already present during `T03` and does not reflect a new auth-decoupling regression introduced by `C11` or `C12`
  - the checklist goal for Priority 5 was preserved without changing this test

## Closeout

- `C11` restored correct auth-tab consumption in `CommentInput.svelte`
- `C12` restored correct logout-capable auth-state consumption in `SelfDisplay.svelte`
- Priority 5 validation evidence is sufficient to close `T03` without changing tests to hide regressions
