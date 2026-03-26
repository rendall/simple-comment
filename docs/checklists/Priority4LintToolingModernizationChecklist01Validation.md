# Priority 4 — Lint / Tooling Checklist 01 Validation

## Current Lint / Format / Typecheck Command Evidence

- Baseline command run in `/home/rendall/projects/simple-comment` on `priority-4`:
  - `yarn lint`
    - passes
  - `yarn run prettier --list-different .`
    - passes
  - `yarn typecheck`
    - passes
- Active `eslint.config.mjs` baseline before checklist cleanup:
  - one top-level ignore block with:
    - `*.js`
    - `functions/**/*.js`
    - `dist/**/*.js`
    - `src/policy.ts`
  - `@eslint/js` recommended rules
  - shared browser/node globals block
  - dedicated Cypress globals block for `cypress/**/*.js`
  - `eslint-plugin-svelte` base config
  - a dedicated `.svelte` block that forwards script parsing to `@typescript-eslint/parser`
  - a dedicated `src/**/*.ts` block with the current TypeScript ruleset
- Package baseline:
  - `prettier`: `3.8.1`
  - `prettier-plugin-svelte`: `^3.5.1`
- Migration-leftover baseline:
  - repo search found no active `FlatCompat`/compat usage in the current flat-config path
  - `@eslint/eslintrc` is already absent from `package.json`

## Representative TS / Svelte / Cypress Config Probes

- Before config cleanup:
  - `./node_modules/.bin/eslint --print-config src/tests/mockComment.ts`
    - shows `typescript-eslint/parser@8.57.2`
    - includes `@typescript-eslint/no-unused-vars`
  - `./node_modules/.bin/eslint --print-config src/components/CommentInput.svelte`
    - shows `svelte-eslint-parser@1.6.0`
    - forwards script parsing to `typescript-eslint/parser@8.57.2`
    - includes `@typescript-eslint/no-unused-vars`
  - `./node_modules/.bin/eslint --print-config cypress/e2e/generic/basic.cy.js`
    - includes Cypress globals:
      - `cy`
      - `Cypress`
      - Mocha `describe`

## ESLint Config Cleanup Decisions

Pending.

## Prettier Alignment Disposition

Pending.

## Residual Follow-on Notes

Pending.
