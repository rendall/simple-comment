# Modernization Program Plan

Last updated: 2026-03-02

This folder contains the phased modernization plans for this repository.

The implementation model is:

1. Plan
2. Implement
3. PR
4. Merge
5. Re-plan next phase

Each phase has its own plan file and acceptance criteria.

---

## Why this order

Dependency and platform upgrades are Phase 1 per team direction.  
This is reasonable, with one guardrail: we keep behavior changes out of Phase 1 so we can isolate upgrade risk.  
A short Phase 1.5 stabilizes CI test gating after platform changes, then runtime logic defects are handled in Phase 2.

---

## Current baseline (observed)

- Runtime/tooling:
  - Node pinned to `22.22.0` in `.nvmrc`.
  - CI workflow uses Node `22` in `.github/workflows/netlify-api-test.yml`.
  - Yarn classic (`1.22.x`) lockfile.
  - Svelte `^3.0.0`, Webpack 5 custom frontend and functions bundling.
- Lint:
  - `yarn lint` passes.
  - ESLint config is legacy `.eslintrc` format in `src/.eslintrc.json`.
- Tests:
  - `yarn test:backend` fails locally without `.env` and with import-time env validation.
  - `yarn test:frontend` has locale-string assertion failures across ICU/CLDR variants.

---

## Confirmed findings to address

### Critical / High

1. Topic deletion logic can leave orphaned replies.
   - `src/lib/MongodbService.ts:1451` checks cursor truthiness, not whether rows exist.
   - `src/lib/MongodbService.ts:1469` maps aggregate top-level IDs and misses nested `replies[].id`.

2. `topicListGET` auth check bug when public reads are disabled.
   - `src/lib/MongodbService.ts:1327` stores a cursor instead of a user document and later checks it as truthy/falsy.

3. Referer matching likely rejects documented origins.
   - `example.env:17` uses protocol-prefixed origins.
   - `src/lib/backend-utilities.ts:227` normalizes referer by stripping protocol.
   - `src/lib/backend-utilities.ts:246` matches normalized referer against unnormalized patterns.
   - `src/lib/MongodbService.ts:1048` uses this check for topic creation authorization.

4. `/topic` CORS allow-methods mismatch.
   - `src/functions/topic.ts:44` advertises only `GET,OPTIONS`.
   - `src/functions/topic.ts:79`, `:93`, `:101` implement `POST`, `PUT`, `DELETE`.

### Medium

5. Test reliability issues:
   - `src/tests/backend/secrets.test.ts:21` requires local `.env` presence.
   - `src/tests/frontend/frontend-utilities.test.ts:186` asserts exact localized strings; fails across Intl/CLDR variants.

6. Strict typing not enabled in backend tsconfig.
   - `tsconfig.netlify.functions.json` has strict options commented out.

7. Frequent string throws for env/runtime failures.
   - Present across functions and libs (example: `src/lib/backend-utilities.ts:36`, `src/functions/auth.ts:23`).

8. (Resolved in Phase 01) ts-jest deprecation warning.
   - `isolatedModules` was moved to tsconfig-based configuration during Phase 01 implementation.

---

## Program phases

- [Phase 01 - Dependency and Platform Upgrade](../archive/phase-01-dependency-and-platform-upgrade.md)
- [Phase 01.5 - CI Stabilization and Test Gating](./phase-01-5-ci-stabilization-and-test-gating.md)
- [Phase 02 - Backend Correctness and CORS](./phase-02-backend-correctness-and-cors.md)
- [Phase 03 - Test Determinism and CI Hardening](./phase-03-test-determinism-and-ci-hardening.md)
- [Phase 04 - Type Safety and Environment Handling](./phase-04-type-safety-and-env-handling.md)
- [Phase 05 - Frontend Build Modernization](./phase-05-frontend-build-modernization.md)

---

## Global constraints (apply to every phase)

- One phase per PR.
- No unrelated refactors in phase PRs.
- Every phase must include:
  - Scope statement
  - Implementation notes
  - Validation evidence
  - Rollback approach
- Validation evidence is mandatory, but test steps do not need to appear as atomic checklist items when `docs/norms/checklist.md` exclusions apply; execution/testing is governed by `docs/norms/implementation.md`.
- Keep release notes per phase in the PR description.
