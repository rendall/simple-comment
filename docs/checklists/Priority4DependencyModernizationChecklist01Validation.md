# Priority 4 Checklist 01 Validation — Residual Dependency Declaration Fixes

Status: complete

Checklist: `docs/checklists/Priority4DependencyModernizationChecklist01.md`

## Baseline Residual Findings

Baseline captured on 2026-03-23 before checklist implementation:

- `yarn knip` reported:
  - unresolved import `svelte-eslint-parser`
  - unlisted dependency `jsdom`
  - unused dependency `@babel/preset-typescript`
  - additional intentionally deferred residual findings outside this checklist's scope
- `yarn lint` passed with two pre-existing warnings in `src/tests/frontend/frontend-utilities.test.ts`
- `yarn test:frontend` passed: 6 suites, 139 tests
- `yarn build` passed
  - backend retained the known MongoDB webpack warning
  - frontend build completed successfully

## Per-Step Dependency Changes

- C02:
  - added `svelte-eslint-parser` to `package.json` so the parser named directly in `src/.eslintrc.json` is explicitly declared
  - `yarn.lock` already contained a matching `svelte-eslint-parser@^0.32.2` entry from the existing dependency graph, so this step required no lockfile content change
- C03:
  - added `jsdom` to `package.json` so the frontend Jest environment usage reported from `src/tests/frontend/frontend-utilities.test.ts` is explicitly declared
  - `yarn.lock` already contained a matching `jsdom@^20.0.0` entry from the existing Jest environment dependency graph, so this step required no lockfile content change
- C04:
  - removed `@babel/preset-typescript` from `package.json`
  - removed the direct `@babel/preset-typescript@^7.28.5` stanza from `yarn.lock`
  - verified beforehand that `babel.config.cjs` references only `@babel/preset-env`

## Command Evidence

- C02:
  - `yarn knip`
    - pass condition met for this step: unresolved `svelte-eslint-parser` is no longer reported
    - intentionally deferred residual findings remain visible
  - `yarn lint`
    - passed with the same two pre-existing warnings in `src/tests/frontend/frontend-utilities.test.ts`
- C03:
  - `yarn knip`
    - pass condition met for this step: unlisted `jsdom` is no longer reported
    - intentionally deferred residual findings remain visible
  - `yarn test:frontend`
    - passed: 6 suites, 139 tests
- C04:
  - `yarn knip`
    - pass condition met for this step: unused `@babel/preset-typescript` is no longer reported
    - intentionally deferred residual findings remain visible
  - `yarn test:frontend`
    - passed: 6 suites, 139 tests
  - `yarn build`
    - passed
    - backend retained the known MongoDB webpack warning
    - frontend build completed successfully

## Before/After Knip Comparison

Before this checklist:

- `yarn knip` reported:
  - unresolved import `svelte-eslint-parser`
  - unlisted dependency `jsdom`
  - unused dependency `@babel/preset-typescript`
  - additional intentionally deferred residual findings outside this checklist's scope

After C02-C04:

- `yarn knip` no longer reports:
  - unresolved `svelte-eslint-parser`
  - unlisted `jsdom`
  - unused `@babel/preset-typescript`
- the current calibrated residual report remains focused on intentionally deferred follow-up work rather than declaration gaps for the active frontend lint/test stack
- the residual unused dependency list is now:
  - `@netlify/functions`
  - `@xstate/cli`
  - `@xstate/test`
  - `mongodb-memory-server`
  - `ts-node`
  - `webpack-bundle-analyzer`
  - `webpack-license-plugin`
  - `yarn`
- the residual unused file list is now:
  - `scripts/createTestEnv.mjs`
  - `scripts/mockComment.mjs`
  - `src/components/low-level/IconToggle.svelte`
  - `src/lib/NoOpNotificationService.ts`

## Deferred Residual Queue

Deferred from this checklist for later Priority 4 work:

- ambiguous dependency removals:
  - `@netlify/functions`
  - `@xstate/cli`
  - `@xstate/test`
  - `mongodb-memory-server`
  - `ts-node`
  - `webpack-bundle-analyzer`
  - `webpack-license-plugin`
  - `yarn`
- file cleanup candidates:
  - `scripts/createTestEnv.mjs`
  - `scripts/mockComment.mjs`
  - `src/components/low-level/IconToggle.svelte`
  - `src/lib/NoOpNotificationService.ts`
- residual Knip follow-up:
  - redundant `src/entry/index.ts` entry hint from `knip.json`
  - remaining unused exports and unused exported types report

This checklist intentionally leaves those items visible for later manual verification rather than suppressing or removing them opportunistically.
