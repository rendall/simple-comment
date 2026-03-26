# Priority 4 — Lint / Tooling Checklist 01 Validation

## Current Lint / Format / Typecheck Command Evidence

- Baseline command run from `/mnt/c/workspace/projects/simple-comment` on the current `priority-4` branch:
  - `yarn lint`
    - fails with 446 findings in the current flat-config state
    - dominant failure class is Cypress globals missing in `cypress/**/*.js`
    - also reports:
      - `cypress/plugins/index.js` unused parameters
      - unused `eslint-disable` directives in `src/frontend-utilities.ts` and `src/tests/backend/MongodbService.test.ts`
      - `@typescript-eslint/no-require-imports` in `src/tests/backend/setup-env.contract.test.ts`
      - `no-unused-vars` in `webpack.netlify.functions.cjs`
  - `yarn run prettier --list-different .`
    - fails on `eslint.config.mjs`
  - `yarn typecheck`
    - passes
- Active `eslint.config.mjs` baseline before checklist cleanup:
  - includes `@eslint/js` recommended rules
  - includes duplicated top-level `ignores` blocks
  - includes shared browser/node globals
  - includes a TypeScript-only `src/**/*.ts` rules block
  - does not yet include the working Cypress override from the WSL-native copy
  - does not yet include a working Svelte config block
- Current package baseline:
  - `prettier`: `2.6.2`
  - `prettier-plugin-svelte`: `^2.10.1`
  - `@eslint/eslintrc`: `^3.3.5`
- Repo search baseline:
  - `@eslint/eslintrc` is only present as a dependency/lockfile entry
  - no active `FlatCompat` or compat usage is present in the current flat-config path

## Representative TS / Svelte / Cypress Config Probes

- Before config cleanup:
  - `./node_modules/.bin/eslint --print-config src/tests/mockComment.ts`
    - returns a TypeScript-aware config with `@typescript-eslint` rules active
  - `./node_modules/.bin/eslint src/tests/mockComment.ts`
    - exits cleanly
  - `./node_modules/.bin/eslint --print-config src/components/CommentInput.svelte`
    - returns `undefined`
  - `./node_modules/.bin/eslint src/components/CommentInput.svelte`
    - warns: `File ignored because no matching configuration was supplied`
  - `./node_modules/.bin/eslint --print-config cypress/e2e/generic/basic.cy.js`
    - returns core JS config only, without Cypress globals
  - `./node_modules/.bin/eslint cypress/e2e/generic/basic.cy.js`
    - fails with `no-undef` on `cy`, `describe`, `it`, and `expect`

## ESLint Config Cleanup Decisions

Pending.

## Prettier Alignment Disposition

Pending.

## Residual Follow-on Notes

Pending.
