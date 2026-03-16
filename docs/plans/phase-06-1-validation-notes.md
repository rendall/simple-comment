# Phase 06.1 Validation Notes

## Scope Boundary Confirmation

- In scope: establish and validate the pre-upgrade Cypress/embed baseline for the current frontend.
- In scope: align docs/tests/host pages to the `#simple-comment` embed contract.
- In scope: capture artifact/smoke/browser evidence Phase 06 can reuse during the Svelte 4 upgrade.
- Out of scope: Svelte dependency upgrades, backend API changes, and broad E2E expansion beyond the approved baseline and explicitly-added follow-up coverage.

## Contract Decisions and Recorded Deviations

- `#simple-comment` is the embed host-element contract for Phase 06.1.
- Legacy `#simple-comment-display` support was removed rather than preserved as a compatibility alias.
  - Rationale: the current runtime already mounted into `#simple-comment`; the older selector remained only in stale docs/demo/test scaffolding and did not represent the live embed contract.
- Legacy `simple-comment.css` was removed from shipped host pages and artifact expectations.
  - Rationale: the current frontend styling contract is `css/simple-comment-style.css`; `simple-comment.css` contained stale selectors, interfered with current layout, and hid the logout control after the host-id alignment.

## Baseline Flow Ownership

The required Phase 06.1 browser baseline is:

- Auto-init mount and discussion load: [basic.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/basic.cy.js)
- Configured discussion bootstrap: [basic.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/basic.cy.js)
- Guest top-level comment submission: [public-comment.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/public-comment.cy.js)
- Reply submission: [reply.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/reply.cy.js)
- Authenticated login/verify plus authenticated action: [login.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/login.cy.js)

Additional Cypress coverage added during this phase, but not required to satisfy the minimum Phase 06.1 baseline:

- Imperative embed mount: [manual-init.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/manual-init.cy.js)
- `setSimpleCommentOptions(...)` custom target: [embed-options.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/embed-options.cy.js)
- Returning-user auto-login: [auto-login.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/auto-login.cy.js)
- Explicit logout: [logout.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/logout.cy.js)
- Comment edit: [edit.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/edit.cy.js)
- Comment delete: [delete.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/delete.cy.js)
- Authenticated reply: [authenticated-reply.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/authenticated-reply.cy.js)

## Cypress Inventory / Setup Notes

- Cypress 12 support-file execution was restored using [cypress.config.ts](/mnt/c/workspace/projects/simple-comment/cypress.config.ts) with `supportFile: "cypress/support/e2e.js"`.
- The support file exists at [e2e.js](/mnt/c/workspace/projects/simple-comment/cypress/support/e2e.js).
- The baseline spec set is intentionally deterministic and relies on stubbed browser-boundary network interactions rather than live backend state.
- Dedicated static host pages were added under [src/static/cypress](/mnt/c/workspace/projects/simple-comment/src/static/cypress) for embed-contract scenarios that must configure globals before `DOMContentLoaded`.

## Documentation / Traceability Alignment

- Repository docs and Cypress assumptions now align to `#simple-comment` rather than `#simple-comment-display`.
- Host/demo/test pages no longer load the removed legacy `simple-comment.css` asset; the active stylesheet contract is `css/simple-comment-style.css`.
- Phase 06 can quote this note as the pre-upgrade record of both browser-visible baseline behavior and current embed contract assumptions.

## Validation Evidence

- Date: 2026-03-16
- Frontend artifact contract:
  - Command: `yarn run build:frontend`
  - Result: passed
  - Command: `bash ./scripts/validate-frontend-artifacts.sh dist`
  - Result: passed
- Frontend embed smoke:
  - Command: `bash ./scripts/smoke-frontend-embed.sh dist`
  - Result: passed (`Frontend embed smoke check passed`)
- Cypress baseline/suite status:
  - Command: `yarn run test:cypress`
  - Result: maintainer rerun reported all specs green after the final logout-spec alignment and legacy stylesheet removal.
  - Required baseline specs confirmed green:
    - [basic.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/basic.cy.js)
    - [public-comment.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/public-comment.cy.js)
    - [reply.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/reply.cy.js)
    - [login.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/login.cy.js)

## Notes for Phase 06 Handoff

- The pre-upgrade browser baseline now covers both auto-init and pre-load embed configuration paths.
- The baseline no longer depends on the removed legacy host selector or stylesheet path.
- If Phase 06 changes login, threading, or embed bootstrap behavior, the most directly comparable browser checks are the required baseline specs above.
