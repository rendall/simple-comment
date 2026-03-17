# Phase 06 Discovery Notes

## Scope Lock Confirmation

- Date: 2026-03-16
- Checklist: [phase-06-discovery-checklist.md](./phase-06-discovery-checklist.md)
- Discovery scope is limited to:
  - dependency-path confirmation
  - baseline validation capture
  - trial upgrade evidence
  - concrete finding collection
- Execution locks confirmed:
  - do not modify any tests during discovery
  - record blocking failures and dependency impact before stopping
  - treat this artifact as discovery evidence only, not implementation approval
  - later discovery validation continued past the normal `T04` stop point only under explicit maintainer direction so the remaining Phase 06 evidence could be collected

## Phase 06.1 Baseline References

- Checklist baseline source: [phase-06-1-checklist.md](../archive/phase-06-1-checklist.md)
- Validation baseline source: [phase-06-1-validation-notes.md](../archive/phase-06-1-validation-notes.md)
- Required unchanged browser baseline for discovery:
  - [basic.cy.js](../../cypress/e2e/generic/basic.cy.js)
  - [public-comment.cy.js](../../cypress/e2e/generic/public-comment.cy.js)
  - [reply.cy.js](../../cypress/e2e/generic/reply.cy.js)
  - [login.cy.js](../../cypress/e2e/generic/login.cy.js)

## Current Frontend Dependency Graph

- Current repo versions from [package.json](../../package.json):
  - `svelte`: `^3.0.0`
  - `@sveltejs/vite-plugin-svelte`: `^2.5.3`
  - `vite`: `^5.4.14`
  - `svelte-preprocess`: `^5.0.4`
  - `@xstate/svelte`: `^2.1.0`
  - `xstate`: `^4.38.1`
- Relevant compatibility evidence gathered during discovery:
  - `svelte@4` latest published 4.x release observed: `4.2.20`
  - `@sveltejs/vite-plugin-svelte@3.1.2` peers:
    - `vite: ^5.0.0`
    - `svelte: ^4.0.0 || ^5.0.0-next.0`
  - `svelte-preprocess@5.0.4` peers include:
    - `svelte: ^3.23.0 || ^4.0.0-next.0 || ^4.0.0`
  - `@xstate/svelte@2.1.0` peers include:
    - `svelte: ^3.24.1 || ^4`
    - `xstate: ^4.38.1`

## Proposed Trial Target Path

- Trial target for Stage 1 discovery:
  - upgrade `svelte` to `^4.2.20`
  - upgrade `@sveltejs/vite-plugin-svelte` to `^3.1.2`
  - keep `vite` on the current major version
  - keep `svelte-preprocess` on `^5.0.4` for the first trial because the current pinned line already declares Svelte 4 support
  - keep `@xstate/svelte` on `^2.1.0`
  - keep `xstate` on `^4.38.1`
- Rationale:
  - this is the lowest-risk direct Svelte 3 to Svelte 4 path supported by the current dependency graph and the Phase 06 plan
  - it avoids introducing an XState 5 migration or a Vite major-version change during discovery

## Command Results

- `yarn install`:
  - Result: passed with warnings
  - Observed behavior:
    - completed successfully after a fresh reinstall with the existing `yarn.lock` restored and `node_modules` removed
    - reached `[1/4] Resolving packages...`
    - reached `[2/4] Fetching packages...`
    - reached `[3/4] Linking dependencies...`
    - reached `[4/4] Building fresh packages...`
    - emitted warnings:
      - `warning bare-fs@4.5.5: The engine "bare" appears to be invalid.`
      - `warning bare-os@3.7.0: The engine "bare" appears to be invalid.`
      - `warning Error running install script for optional dependency: ".../node_modules/unix-dgram: Command failed. Exit code: 1 ..."`
    - saved lockfile
    - completed in `376.17s`
  - Caveats:
    - the optional `unix-dgram` native module failed to build under Node `22.22.0`
    - the failure is in an optional dependency install script, so Yarn still completed successfully
    - the warning should be monitored during later parity validation in case a Netlify CLI path depends on it
  - Dependency impact:
    - does not block downstream discovery validation commands
- `yarn run build:frontend`:
  - Result: passed with warnings
  - Observed behavior:
    - emitted Vite CJS Node API deprecation warning
    - emitted `vite-plugin-svelte` warning that `carbon-icons-svelte@12.1.0` has a `svelte` field but no `exports` condition for `svelte`
    - emitted `/css/simple-comment-style.css doesn't exist at build time, it will remain unchanged to be resolved at runtime`
    - built production artifacts successfully, including `dist/css/simple-comment-style.css` and `dist/js/simple-comment.js`
    - completed in `28.39s`
- `yarn test:frontend`:
  - Result: failed
  - Observed behavior:
    - `7` frontend test suites ran
    - `5` suites passed and `2` suites failed
    - total tests: `156` passed, `1` failed, `157` total
    - run time: `78.733s`
  - Failure details:
    - `src/tests/frontend/svelte-stores.test.ts` failed before running tests because Jest could not parse Svelte 4's ESM runtime import from `node_modules/svelte/src/runtime/store/index.js`
    - exact error summary:
      - `SyntaxError: Cannot use import statement outside a module`
      - triggered by `import { get } from "svelte/store"`
    - `src/tests/frontend/frontend-utilities.test.ts` failed its `threadComments` deep-equality expectation because leaf replies now include explicit `replies: []` properties in the received structure
  - Dependency impact:
    - `T04` is not green on the trial Svelte 4 stack
    - under the original discovery checklist execution lock, this would normally have triggered a stop before later dependent checklist behavior
    - later discovery validation was continued under explicit maintainer direction to capture the remaining Phase 06 browser/parity evidence
- Phase 06.1 unchanged Cypress baseline command:
  - Result: passed
  - Command: `yarn run test:cypress --spec cypress/e2e/generic/basic.cy.js,cypress/e2e/generic/public-comment.cy.js,cypress/e2e/generic/reply.cy.js,cypress/e2e/generic/login.cy.js`
  - Observed behavior:
    - [basic.cy.js](../../cypress/e2e/generic/basic.cy.js): `2 passing`
    - [public-comment.cy.js](../../cypress/e2e/generic/public-comment.cy.js): `1 passing`
    - [reply.cy.js](../../cypress/e2e/generic/reply.cy.js): `1 passing`
    - [login.cy.js](../../cypress/e2e/generic/login.cy.js): `1 passing`
    - aggregate baseline result: `5 passing`, `0 failing`
    - completed in `51.74s`
- `yarn run ci:local`:
  - Result: failed before frontend parity validation
  - Observed behavior:
    - dependency install step reported `success Already up-to-date.`
    - parity failed during `yarn run lint`
  - Failure details:
    - discovery-time lint failures included a `no-console` violation in the icebreakers entrypoint and an unused-variable warning in the backend MongoDB test file
    - those specific lint findings were later removed during follow-up cleanup on this branch; current parity status is recorded in [phase-06-validation-notes.md](./phase-06-validation-notes.md)
  - Dependency impact:
    - prevents `ci:local` from reaching backend/frontend test parity steps on the current worktree
    - does not invalidate the already-passing Svelte 4 browser baseline evidence

## Breakage Findings

- Warning finding D01:
  - The Stage 1 trial dependency set installs successfully, but the optional `unix-dgram` native module fails to build under Node `22.22.0`.
  - The warning does not block downstream compile, unit, browser, or parity evidence capture on this dependency state.
- Warning finding D02:
  - The Svelte 4 trial dependency set builds successfully, but the build emits deprecation and package-shape warnings.
  - The warning set currently includes Vite's deprecated CJS Node API notice, a `carbon-icons-svelte` missing `exports` condition warning, and the existing runtime-resolved stylesheet reference warning for `/css/simple-comment-style.css`.
  - The warnings do not block downstream unit, browser, or parity validation on this dependency state.
- Blocking finding D03:
  - `yarn test:frontend` fails on the Svelte 4 trial stack because the current Jest frontend test pipeline does not handle Svelte 4's ESM `svelte/store` runtime import.
  - Affected surfaces include the frontend Jest config and transform path plus [svelte-stores.test.ts](../../src/tests/frontend/svelte-stores.test.ts).
- Blocking finding D04:
  - `yarn test:frontend` also fails [frontend-utilities.test.ts](../../src/tests/frontend/frontend-utilities.test.ts) because the current received threaded-comment shape now includes explicit empty `replies` arrays on leaf nodes while the test expectation does not.
  - This is an additional blocking unit failure on the current trial dependency state.
- Finding D05:
  - The unchanged Phase 06.1 Cypress baseline passes completely on the Svelte 4 trial stack.
  - This indicates the core embed/bootstrap/comment/reply/auth browser boundary remains compatible despite the current frontend unit-test blockers.
- Finding D06:
  - At discovery time, `yarn run ci:local` failed in the lint step on a pre-existing `no-console` violation in the icebreakers entrypoint and an unused-variable warning in the backend MongoDB test file.
  - The failure occurs before parity reaches frontend test execution, so it does not add a new Svelte 4-specific blocker beyond `D03` and `D04`.

## Blocker Classification

- D01:
  - Scope: out-of-scope environment/tooling warning unless later commands show a dependency on the optional module
  - Severity: non-blocking
  - Dependency impact: no current stop condition; continue to downstream validation while monitoring `ci:local`
  - Stop-condition result: continue discovery execution
- D02:
  - Scope: mixed non-blocking tooling/package warning set
  - Severity: non-blocking
  - Dependency impact: no current stop condition; continue discovery while preserving the warning evidence for implementation planning
  - Stop-condition result: continue discovery execution
- D03:
  - Scope: in-scope frontend test-stack compatibility blocker
  - Severity: blocking
  - Dependency impact: prevents `T04` from going green and therefore blocks later dependent checklist behavior, including `T07`
  - Stop-condition result: stop and discuss with user before continuing
- D04:
  - Scope: in-scope current frontend/unit-test behavior mismatch
  - Severity: blocking
  - Dependency impact: prevents `T04` from going green and therefore blocks later dependent checklist behavior, including `T07`
  - Stop-condition result: stop and discuss with user before continuing
- D05:
  - Scope: in-scope positive browser compatibility finding
  - Severity: non-blocking
  - Dependency impact: reduces implementation risk for the preserved Phase 06.1 browser baseline because the unchanged baseline is already green on the trial dependency set
  - Stop-condition result: continue
- D06:
  - Scope: non-phase parity blocker unless a later step shows the lint failures were introduced by the Svelte 4 implementation work
  - Severity: blocking for `ci:local`, but currently classified as a non-phase blocker under the plan's deferment rule
  - Dependency impact: prevents full parity completion in discovery; does not change the first in-phase implementation blockers, which remain `D03` and `D04`
  - Stop-condition result: record as explicit parity blocker/deferment candidate

## Recommendation

- Discovery now supports implementation-checklist authoring without plan refinement because:
  - the Svelte 4 trial dependency set installs and builds
  - the unchanged Phase 06.1 browser baseline is green
  - the remaining in-phase blockers are concentrated in the frontend unit-test path
- The first implementation-checklist work item should be to restore frontend Jest compatibility with Svelte 4's ESM runtime imports.
- The additional `frontend-utilities.test.ts` mismatch should be resolved early to determine whether it is:
  - an intended expectation update caused by the recent threading fix, or
  - a behavior regression that must be corrected before implementation proceeds.
- `ci:local` should be treated as carrying a currently non-phase lint blocker unless later implementation work demonstrates that the parity failure was introduced by the Svelte 4 upgrade path itself.
