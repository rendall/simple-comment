# Phase 03 - Test Determinism and CI Hardening

Status: Planned

## Goal

Make test runs reproducible across local and CI environments.

## Scope

- Backend env test setup hardening:
  - Remove dependency on manually created local `.env`.
  - Standardize automated test env bootstrap.
- Frontend locale/date test stabilization:
  - Replace brittle exact-string assertions with stable expectations.
  - Preserve i18n coverage across the full existing locale/language matrix.
  - Keep at least one integration test for localized rendering behavior.
- CI hardening:
  - Ensure CI runs use the same env bootstrap path as local test scripts.

## Out of scope

- Product formatting redesign or UI copy/style changes outside deterministic test concerns.
- Adding/removing supported product locales beyond preserving current locale matrix coverage.
- Frontend build-system modernization (owned by Phase 05).
- New feature development unrelated to determinism/CI gating.

## Inputs and evidence

- Backend failure source:
  - `src/tests/backend/secrets.test.ts:21` expects `.env` file to exist.
- Frontend failure source:
  - exact locale strings in `src/tests/frontend/frontend-utilities.test.ts:186+` fail across Intl data variants.

## Phase 1.5 handoff

Phase 03 owns the frontend locale-determinism refactor: replace brittle exact
locale-string assertions with deterministic assertions and restore frontend CI
gating by making `yarn test:frontend` a required check.

## Backend env strategy decision

Selected option: **#1 Jest-injected env only** as the canonical backend test bootstrap.

- Add a backend Jest setup file (for example `src/tests/backend/setup-env.ts`) loaded by `jest.backend.config.ts` via `setupFiles`.
- Parse `example.env` in setup and populate missing `process.env` keys for backend tests.
- For keys containing `SECRET` or `PASSWORD`, inject deterministic non-default test values so secret checks remain meaningful.
- Remove backend test coupling to filesystem `.env` existence.
- Align CI and local backend test execution to the same path (`yarn test:backend`) without pre-creating `.env`.
- Preserve fork/onboarding guidance in docs and optional helper script messaging, but do not make backend test pass/fail depend on `.env` on disk.

Exact files in scope for backend env coupling:
- `jest.backend.config.ts`
- `src/tests/backend/setup-env.ts` (new)
- `src/tests/backend/secrets.test.ts`
- `.github/workflows/netlify-api-test.yml`
- `package.json` (only if test command wiring needs adjustment)

## CI hardening scope decision

Use `.github/workflows/netlify-api-test.yml` as the required CI gate for this phase.

- Keep existing lint/format/build checks in place.
- Restore required frontend test gating in this workflow by running both suites:
  - `yarn test:backend`
  - `yarn test:frontend`
- Keep backend Mongo test binary pinning behavior unless a Phase 03 checklist item explicitly changes it.
- If split into multiple jobs for diagnostics, both backend and frontend test jobs remain required.

Exact workflow file in scope:
- `.github/workflows/netlify-api-test.yml`

## Timezone determinism decision

Pin test execution timezone to `UTC` for deterministic date/time assertions.

- CI: set `TZ=UTC` in `.github/workflows/netlify-api-test.yml` for test jobs.
- Local test scripts: run frontend tests under `TZ=UTC` (for portability, use `cross-env TZ=UTC` if needed).
- Frontend locale/date tests: use UTC-stable fixtures (`Date.UTC(...)` or ISO timestamps with `Z`) to avoid local timezone drift.

## Implementation steps

1. Define test env strategy:
   - Implement in-memory env injection via backend Jest setup (no `.env` file dependency for backend tests).
   - Wire setup through `jest.backend.config.ts` `setupFiles`.
   - Remove `.env` bootstrap from backend test execution path in CI and local default test commands.
2. Refactor backend secret tests:
   - Validate required keys are present in test environment.
   - Replace hard `.env exists` failure in `src/tests/backend/secrets.test.ts` with non-blocking guidance (warning/log) for local development.
   - Keep test assertions focused on effective environment values, not filesystem state.
3. Refactor frontend locale tests:
   - Keep the full current locale matrix in test coverage (no locale removals in this phase).
   - Assert deterministic structural properties via locale-aware parts (year/month/day/hour/minute), not runtime-variant filler words.
   - Add explicit fallback guardrails:
     - verify each locale in the matrix is supported by runtime Intl (`supportedLocalesOf`).
     - verify formatter resolves to requested locale family (no silent collapse to default locale).
   - Use UTC-stable fixtures and run tests under `TZ=UTC`.
4. Update CI workflow steps to use the same bootstrap sequence.
   - Ensure required CI gating includes both `yarn test:backend` and `yarn test:frontend`.
   - Set `TZ=UTC` for test execution in workflow.
5. Document deterministic test expectations in `README.md` or `docs/`.

## Checklist QC decisions (2026-03-03)

1. Issue: `C08` only depended on backend env bootstrap wiring (`C02`) but not backend secret-test refactor (`C03`), which could allow CI workflow changes before `.env`-coupled assertions are removed.
   Decision: make `C08` depend on both `C02` and `C03`.

2. Issue: `C11` had ambiguous docs target (`README.md` or `docs/`), reducing checkability.
   Decision: pin `C11` output target to `README.md`.

3. Issue: `C07` did not explicitly define cross-platform handling for `TZ=UTC` script wiring.
   Decision: require `cross-env` addition only when needed for shell portability and make that explicit in the checklist item.

## Checklist integration pass (2026-03-03)

- Verified checklist items still map directly to approved Phase 03 scope (backend env determinism, frontend locale determinism with full matrix coverage, CI hardening).
- Verified updated dependency graph coherence:
  - `C08` now depends on `C02` and `C03`.
  - `C10` depends on `C09`.
  - `C11` depends on `C03` and `C10`.
- Verified all checklist items belong to exactly one behavior slice.

## Checklist sanity pass (2026-03-03)

- No remaining blockers identified for Phase 03 implementation.
- Checklist is atomic, scoped, and checkable per `docs/norms/checklist.md`.
- Proceed with implementation per `docs/norms/implementation.md`.

## Risk and mitigation

- Risk: weaker assertions can hide formatting regressions.
- Mitigation:
  - Keep targeted snapshot or golden tests per selected locale/runtime.
  - Pair unit tests with a smaller number of integration checks.

## Acceptance criteria

- `yarn test:backend` and `yarn test:frontend` pass on clean checkout after documented setup.
- CI passes without ad hoc manual environment setup.
- Test docs updated with exact command sequence.
- Frontend i18n coverage remains intact:
  - all locales currently covered by `frontend-utilities` locale tests remain covered.
  - tests validate locale-aware behavior for every locale without relying on fragile exact prose strings.
- CI required checks include both backend and frontend test suites with `TZ=UTC`.

## Rollback

- Revert assertion refactors if they reduce signal.
- Keep env bootstrap improvements even if locale test strategy needs iteration.
