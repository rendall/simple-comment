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
  - Keep at least one integration test for localized rendering behavior.
- CI hardening:
  - Ensure CI runs use the same env bootstrap path as local test scripts.

## Inputs and evidence

- Backend failure source:
  - `src/tests/backend/secrets.test.ts:21` expects `.env` file to exist.
- Frontend failure source:
  - exact locale strings in `src/tests/frontend/frontend-utilities.test.ts:186+` fail across Intl data variants.

## Phase 1.5 handoff

Phase 03 owns the frontend locale-determinism refactor: replace brittle exact
locale-string assertions with deterministic assertions and restore frontend CI
gating by making `yarn test:frontend` a required check.

## Implementation steps

1. Define test env strategy:
   - Use generated `.env` in test setup, or in-memory env injection.
2. Refactor backend secret tests:
   - Validate required keys are present in test environment.
   - Avoid filesystem coupling where possible.
3. Refactor frontend locale tests:
   - Assert structural properties and parseable components.
   - Avoid asserting locale filler words that vary by runtime.
4. Update CI workflow steps to use the same bootstrap sequence.
5. Document deterministic test expectations in `README.md` or `docs/`.

## Risk and mitigation

- Risk: weaker assertions can hide formatting regressions.
- Mitigation:
  - Keep targeted snapshot or golden tests per selected locale/runtime.
  - Pair unit tests with a smaller number of integration checks.

## Acceptance criteria

- `yarn test:backend` and `yarn test:frontend` pass on clean checkout after documented setup.
- CI passes without ad hoc manual environment setup.
- Test docs updated with exact command sequence.

## Rollback

- Revert assertion refactors if they reduce signal.
- Keep env bootstrap improvements even if locale test strategy needs iteration.
