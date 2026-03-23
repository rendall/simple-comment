# Priority 4 Checklist 01 Validation — Knip Reliability Calibration

Status: in progress

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

## Before/After Knip Comparison

To be filled after the post-change `yarn knip` run.

## Residual Noise

To be filled if any findings remain after config and entry-point tuning.

## Rationale and Interpretation Guidance

To be finalized after checklist execution so future Priority 4 work can interpret calibrated `knip` output consistently.
