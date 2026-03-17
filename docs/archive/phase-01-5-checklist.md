# Phase 01.5 Checklist - CI Stabilization and Test Gating

Status: Complete

Source plan: `docs/archive/phase-01-5-ci-stabilization-and-test-gating.md`

## Checklist

- [x] C01 `[governance]` Confirm this checklist remains within approved Phase 01.5 scope in `docs/archive/phase-01-5-ci-stabilization-and-test-gating.md` (CI stabilization and gating policy only; no frontend locale refactor).  
- [x] C02 `[config]` Keep `jest-mongodb-config.js` as the canonical `@shelf/jest-mongodb` config file and ensure there is no root-level `jest-mongodb-config.ts` variant in this phase. Depends on: C01.
- [x] C03 `[ci]` Set `MONGOMS_DOWNLOAD_URL` in `.github/workflows/netlify-api-test.yml` to `https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-6.0.14.tgz` and record URL reachability verification in phase notes. Depends on: C02.
- [x] C04 `[ci]` Keep the Netlify workflow test step scoped to backend (`yarn test:backend`) in `.github/workflows/netlify-api-test.yml` rather than `yarn test`. Depends on: C01.
- [x] C05 `[docs]` Add a `Temporary test-gating policy (Phase 01.5)` section in `docs/archive/phase-01-5-ci-stabilization-and-test-gating.md` that explicitly states required gate, deferred gate, and exit criteria. Depends on: C03, C04.
- [x] C06 `[docs]` Add a `Phase 1.5 handoff` note to `docs/archive/phase-03-test-determinism-and-ci-hardening.md` stating: `Phase 03 owns the frontend locale-determinism refactor: replace brittle exact locale-string assertions with deterministic assertions and restore frontend CI gating by making \`yarn test:frontend\` a required check.` Depends on: C05.
- [x] C07 `[docs]` Ensure `docs/archive/ModernizationPlanREADME.md` sequencing and phase descriptions include Phase 01.5 as the bridge between Phase 01 and Phase 02. Depends on: C01.
- [x] C08 `[docs]` Record Phase 01.5 PR phase notes in `docs/archive/phase-01-5-ci-stabilization-and-test-gating.md` covering: CI failure cause, pin rationale, URL verification, temporary gating rationale, retirement criteria, and URL-rotation fallback procedure. Depends on: C03, C04, C05, C06, C07.

## Behavior Slices

- Goal: Confirm governance boundary for Phase 01.5.
  Items: C01
  Type: mechanical

- Goal: Stabilize backend CI runtime path for in-memory Mongo execution.
  Items: C02, C03, C04
  Type: mechanical

- Goal: Document temporary gating policy and handoff ownership to subsequent phases.
  Items: C05, C06, C07, C08
  Type: mechanical
