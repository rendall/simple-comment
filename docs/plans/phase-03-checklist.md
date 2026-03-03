# Phase 03 Checklist - Test Determinism and CI Hardening

Source plan: `docs/plans/phase-03-test-determinism-and-ci-hardening.md`

## Checklist

- [x] C01 `[backend]` Add `src/tests/backend/setup-env.ts` to load `example.env`, inject missing required env keys into `process.env`, and set deterministic non-default test values for `*SECRET*`/`*PASSWORD*` keys.
- [x] C02 `[backend]` Wire backend Jest env bootstrap by adding `src/tests/backend/setup-env.ts` to `setupFiles` in `jest.backend.config.ts`. Depends on: C01.
- [x] C03 `[backend]` Refactor `src/tests/backend/secrets.test.ts` to remove hard `.env exists` failure and assert effective env values instead of filesystem state; include non-blocking local guidance when `.env` is absent. Depends on: C02.
- [ ] C04 `[frontend]` Refactor `longFormatDate` locale assertions in `src/tests/frontend/frontend-utilities.test.ts` to deterministic structural checks (date/time parts) instead of exact locale prose strings, while keeping the full existing locale matrix.
- [ ] C05 `[frontend]` Add locale fallback guardrails in `src/tests/frontend/frontend-utilities.test.ts` for every locale in the matrix using `Intl.DateTimeFormat.supportedLocalesOf` and resolved locale-family checks. Depends on: C04.
- [ ] C06 `[frontend]` Normalize locale-test fixtures in `src/tests/frontend/frontend-utilities.test.ts` to UTC-stable values (`Date.UTC(...)` and/or ISO `...Z`) and keep at least one integration-style localized rendering check. Depends on: C04.
- [ ] C07 `[config]` Update frontend test script wiring in `package.json` so frontend locale tests run under `TZ=UTC` in deterministic paths, and add `cross-env` if required for cross-platform shell compatibility. Depends on: C06.
- [x] C08 `[ci]` Update `.github/workflows/netlify-api-test.yml` to remove `.env` bootstrap from backend test execution path (`node ./scripts/createTestEnv.mjs`) and run backend tests using the Jest-injected env path. Depends on: C02, C03.
- [ ] C09 `[ci]` Set `TZ=UTC` for test execution in `.github/workflows/netlify-api-test.yml` and keep existing MongoDB binary pinning behavior. Depends on: C08.
- [ ] C10 `[ci]` Restore required frontend test gating in `.github/workflows/netlify-api-test.yml` by running `yarn test:frontend` in required CI alongside backend tests. Depends on: C09.
- [ ] C11 `[docs]` Document deterministic test expectations and command sequence in `README.md`, including: backend tests do not require `.env` on disk, timezone policy is `TZ=UTC`, and frontend i18n coverage remains full-matrix. Depends on: C03, C10.

## Behavior Slices

- Goal: Make backend tests deterministic and independent of local `.env` files.
  Items: C01, C02, C03, C08
  Type: behavior

- Goal: Keep full i18n locale coverage while making locale/date tests deterministic.
  Items: C04, C05, C06, C07
  Type: behavior

- Goal: Restore and harden CI gating and document deterministic testing contract.
  Items: C09, C10, C11
  Type: behavior
