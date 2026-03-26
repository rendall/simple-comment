# Priority 4 Checklist 01 Validation — Knip Reliability Calibration

Status: complete

Checklist: `docs/checklists/Priority4KnipReliabilityChecklist01.md`

## Baseline Findings

Initial `knip` evidence for this checklist comes from the 2026-03-23 planning pass recorded in `docs/plans/Priority4KnipReliabilityMiniPlan.md`.

Known noisy areas before calibration:

- config-driven unused dependency findings for ESLint-related packages referenced by `src/.eslintrc.json`
- config-driven unused dependency findings for Jest and Mongo test-stack packages
- unused-file findings for repo-owned entry points such as `src/simple-comment-icebreakers.ts` and `src/scss/simple-comment-style.scss`
- binary/config noise around Cypress and Netlify usage

## Configuration Changes

- C02:
  - updated `knip.json` schema from Knip 5 to Knip 6 to match the installed local `knip` version `6.0.3`
  - retained `"tags": ["-lintignore"]` after validating that the local Knip 6 schema still documents `-lintignore` as a supported example for tag-based exclusion
- C03:
  - added an ESLint plugin config override for `src/.eslintrc.json`
  - added Jest plugin config overrides for `jest.backend.config.ts` and `jest.frontend.config.ts`
  - added a webpack plugin config override for `webpack.netlify.functions.cjs`
  - added a Cypress plugin config override for `cypress.config.ts` so the repo's explicit Cypress config path is modeled directly
- C04:
  - added explicit top-level Knip entry points for the repo's Vite-managed frontend and build artifacts:
    - `src/entry/index.ts`
    - `src/entry/icebreakers/index.ts`
    - `src/simple-comment.ts`
    - `src/simple-comment-icebreakers.ts`
    - `src/scss/simple-comment-style.scss`
  - chose explicit entry modeling instead of ignore-based suppression because Knip's built-in Vite discovery only auto-reads a root `index.html`, while this repo uses a custom `src/entry` root plus additional Rollup inputs
- C06:
  - added `ignoreFiles` entries for:
    - `jest-mongodb-config.js` because it is consumed indirectly by the Jest Mongo preset path
    - `src/tests/mockComment.ts` because it is imported by Cypress specs but still reported as unused after the repo-aware config pass
  - added `ignoreBinaries` entries for `cypress` and `netlify` because both are intentionally used as optional CLI tooling rather than as imported source dependencies
  - added `ignoreDependencies` entries only for dependencies that are clearly repo-used but difficult for Knip to model in the current structure:
    - `http-server`, because usage is through shell scripts and `npx`
    - `jest-environment-jsdom`, because usage is driven by Jest environment directives rather than direct imports in source
    - `prettier-plugin-svelte`, because usage is through Prettier's plugin discovery rather than an explicit code import
  - deliberately did not suppress likely real cleanup candidates such as `@babel/preset-typescript`, `@netlify/functions`, `@xstate/cli`, `@xstate/test`, `mongodb-memory-server`, `ts-node`, `webpack-bundle-analyzer`, `webpack-license-plugin`, `yarn`, `scripts/createTestEnv.mjs`, `scripts/mockComment.mjs`, `src/components/low-level/IconToggle.svelte`, or `src/lib/NoOpNotificationService.ts`

## Before/After Knip Comparison

Post-change local validation on 2026-03-23:

- `yarn knip` was rerun successfully three times after the C02-C04 configuration changes.
- all three runs produced the same findings, which indicates the calibrated output is stable in the current local environment.

Material improvements compared with the baseline captured in the source mini-plan:

- `cypress.config.ts` no longer appears as an unused file
- `src/simple-comment-icebreakers.ts` no longer appears as an unused file
- `src/scss/simple-comment-style.scss` no longer appears as an unused file
- ESLint-config-driven dependency noise no longer includes `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-svelte`, or `eslint-config-prettier`

Remaining post-change findings are narrower and more believable:

- likely blind spots that still need interpretation:
  - `jest-mongodb-config.js`
  - `src/tests/mockComment.ts`
  - `http-server`
  - `jest-environment-jsdom`
  - `prettier-plugin-svelte`
  - unlisted `netlify` / `cypress` binaries
- likely real cleanup or follow-up candidates:
  - `@babel/preset-typescript`
  - `@netlify/functions`
  - `@xstate/cli`
  - `@xstate/test`
  - `mongodb-memory-server`
  - `ts-node`
  - `webpack-bundle-analyzer`
  - `webpack-license-plugin`
  - `yarn`
  - `scripts/createTestEnv.mjs`
  - `scripts/mockComment.mjs`
  - `src/components/low-level/IconToggle.svelte`
  - `src/lib/NoOpNotificationService.ts`
- likely actionable declaration gap rather than a Knip blind spot:
  - unresolved import `svelte-eslint-parser` from `src/.eslintrc.json`

Known residual config hint from the calibrated run:

- `src/entry/index.ts` is now considered a redundant explicit entry pattern by Knip
- keep this as a follow-up cleanup hint rather than treating it as evidence that C04 failed, because the broader entry calibration still removed the intended false positives

## Residual Noise

Residual findings that should remain visible after the narrow C06 suppressions:

- post-C06 verification (`yarn knip` on 2026-03-23) no longer reports:
  - `jest-mongodb-config.js`
  - `src/tests/mockComment.ts`
  - `http-server`
  - `jest-environment-jsdom`
  - `prettier-plugin-svelte`
  - unlisted `netlify` / `cypress` binaries

- likely dependency cleanup candidates:
  - `@babel/preset-typescript`
  - `@netlify/functions`
  - `@xstate/cli`
  - `@xstate/test`
  - `mongodb-memory-server`
  - `ts-node`
  - `webpack-bundle-analyzer`
  - `webpack-license-plugin`
  - `yarn`
- likely file cleanup candidates:
  - `scripts/createTestEnv.mjs`
  - `scripts/mockComment.mjs`
  - `src/components/low-level/IconToggle.svelte`
  - `src/lib/NoOpNotificationService.ts`
- remaining follow-up investigation candidates:
  - unlisted dependency `jsdom`
  - unresolved import `svelte-eslint-parser`
  - the redundant `src/entry/index.ts` entry hint

## Rationale and Interpretation Guidance

Use the current `knip` output as calibrated triage input, not as automatic deletion authority.

Interpretation guidance for future Priority 4 work:

- treat the remaining unused dependency and unused file findings as a review queue for manual verification
- treat unresolved `svelte-eslint-parser` as a likely package-declaration/config gap, not as cleanup noise
- treat unlisted `jsdom` as a follow-up dependency declaration question tied to the frontend Jest environment
- do not remove `mongodb-memory-server` only because Knip reports it; verify first whether the direct dependency is still intentionally needed alongside `@shelf/jest-mongodb`
- keep using plugin/config and `entry` modeling first whenever new Knip false positives appear
- use `ignoreDependencies` only for clearly repo-used but structurally hard-to-model dependencies, as done here for shell-script CLI usage and implicit tool plugin loading
- prefer leaving plausible cleanup candidates visible rather than over-suppressing them to get a perfectly quiet report

Result of this calibration pass:

- Knip now models the repo's non-default ESLint, Jest, webpack, and Cypress config surfaces
- Knip now understands the repo's custom frontend/build entry surface well enough to remove the most obvious false positives from the baseline run
- the remaining report is small enough to support planned Priority 4 dependency/file triage without pretending every finding is automatically correct
