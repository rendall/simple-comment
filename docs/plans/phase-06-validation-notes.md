# Phase 06 Validation Notes

## Scope Confirmation

- Date: 2026-03-16
- Source checklist: [phase-06-implementation-checklist.md](/mnt/c/workspace/projects/simple-comment/docs/plans/phase-06-implementation-checklist.md)
- Stage: Phase 06 Stage 2 implementation
- Execution constraints carried into implementation:
  - do not modify tests
  - stop on any dependency-blocking item that cannot be made green
  - stop for scope expansion, required public contract change, or required test change

## Approved Dependency Path

- `svelte`: `^4.2.20`
- `@sveltejs/vite-plugin-svelte`: `^3.1.2`
- `vite`: keep current major version
- `svelte-preprocess`: `^5.0.4`
- `@xstate/svelte`: `^2.1.0`
- `xstate`: `^4.38.1`

## Carried Discovery Findings

- Discovery notes source: [phase-06-discovery-notes.md](/mnt/c/workspace/projects/simple-comment/docs/plans/phase-06-discovery-notes.md)
- Browser baseline already green on the Svelte 4 trial stack:
  - [basic.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/basic.cy.js)
  - [public-comment.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/public-comment.cy.js)
  - [reply.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/reply.cy.js)
  - [login.cy.js](/mnt/c/workspace/projects/simple-comment/cypress/e2e/generic/login.cy.js)
- First in-phase implementation blockers carried from discovery:
  - `D03`: frontend Jest cannot currently load Svelte 4 ESM runtime imports
  - `D04`: `threadComments` currently materializes `replies: []` on leaf nodes, conflicting with existing optional `replies` shape expectations
- Carried non-phase / warning findings:
  - `D01`: optional `unix-dgram` native build warning under Node `22.22.0`
  - `D02`: non-blocking build warnings from Vite / `vite-plugin-svelte`
  - `D06`: `ci:local` currently stops at pre-existing lint failures before parity reaches frontend tests

## Implementation Validation Log

- Focused Stage 2 blocker probes:
  - `yarn test:frontend --runTestsByPath src/tests/frontend/svelte-stores.test.ts --runInBand`
    - Result: passed
    - Purpose: verify the Stage 2 Jest config change restores execution of the previously failing Svelte store suite without modifying tests
    - Observed outcome:
      - `PASS src/tests/frontend/svelte-stores.test.ts`
      - `2` tests passed

- `yarn test:frontend`:
  - Not run yet in Stage 2
- `yarn run build:frontend`:
  - Not run yet in Stage 2
- Phase 06.1 unchanged Cypress baseline:
  - Discovery status: passed on the Svelte 4 trial stack
  - Stage 2 rerun status: not run yet
- `yarn run ci:local`:
  - Discovery status: failed at lint before frontend parity
  - Stage 2 rerun status: not run yet

## Deferments / Blockers

- None recorded yet in Stage 2 beyond the carried discovery findings above.
