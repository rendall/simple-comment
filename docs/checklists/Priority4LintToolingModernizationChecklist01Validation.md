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
- T01 command validation after the accepted implementation step:
  - after C03 (`eslint.config.mjs` structure-only cleanup):
    - `yarn lint` passes
    - `yarn run prettier --list-different .` passes
    - `yarn typecheck` passes
  - C04 and C05 were documentation/disposition-only in this repo copy and did not change executable tooling state

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
- T02 before/after comparison after C03:
  - TypeScript probe:
    - parser unchanged
    - `@typescript-eslint/no-unused-vars` unchanged
  - Svelte probe:
    - top-level parser unchanged
    - TS handoff in `parserOptions` unchanged
    - `@typescript-eslint/no-unused-vars` unchanged
  - Cypress probe:
    - `cy` global unchanged
    - `Cypress` global unchanged
    - Mocha `describe` global unchanged

## ESLint Config Cleanup Decisions

- C03 mechanical cleanup:
  - preserved the existing working flat-config behavior
  - added explicit section comments for:
    - base ignores
    - shared defaults
    - Cypress globals
    - Svelte / TS-in-Svelte handling
    - TypeScript rules
  - did not change rule intent, parser selection, or file globs during the cleanup
- C04 migration-leftover disposition:
  - `@eslint/eslintrc` required no removal in this repo copy because it was already absent from `package.json` and `yarn.lock`
  - no active `FlatCompat` or compat bridge usage remains in the current flat-config path

## Prettier Alignment Disposition

- C05 disposition:
  - the current formatter path is accepted for this checklist
  - evidence:
    - `yarn run prettier --list-different .` is green
    - `prettier` is already on `3.8.1`
    - `prettier-plugin-svelte` is already on `^3.5.1`
  - no separate Prettier modernization follow-on is required to close this lint/tooling lane

## Residual Follow-on Notes

Pending.
