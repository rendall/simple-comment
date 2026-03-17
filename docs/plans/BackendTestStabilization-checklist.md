# Backend Test Bootstrap Defaults Stabilization Checklist

Status: active

Source plan: `docs/plans/BackendTestStabilization.md`

## Checklist

- [x] C01 `[backend]` Add a shared backend test env utility module to parse `example.env`, classify sensitive keys, and expose deterministic secret replacement rules for backend test bootstrap and secret-validation code.
  - Validation: T01.
  - Implementation notes:
    - Keep the shared helper under `src/tests/backend/`.
    - Keep `src/tests/backend/setup-env.ts` as the canonical Jest bootstrap entrypoint.
    - Keep the shared utility pure; do not mutate `process.env` inside it.
    - Separate file reading from text parsing.
    - Preserve entry order from `example.env`.
    - Treat only lines beginning with `#` as comments.
  - Trace:
    - "Centralize backend test env parsing, sensitive-key classification, and deterministic secret replacement rules into shared test utility code consumed by bootstrap and secret-validation tests." (In Scope)
    - "Sensitive-key classification remains name-based for keys containing `SECRET` or `PASSWORD` only; expanding that rule is out of scope for this plan." (Locked Decisions)
    - "`example.env` remains the baseline declaration of expected env keys for backend test bootstrap in this plan." (Locked Decisions)

- [x] C02 `[backend]` Refactor `src/tests/backend/setup-env.ts` to consume the shared utility and preserve the bootstrap contract: inject missing keys from `example.env`, preserve pre-set non-default values, and replace sensitive defaults with deterministic non-default values only when unset or still equal to the `example.env` default.
  - Depends on: C01.
  - Validation: T01, T03.
  - Trace:
    - "Preserve and formalize deterministic secret replacement behavior for keys classified as sensitive." (In Scope)
    - "missing keys are injected from `example.env`" (Acceptance Criteria)
    - "sensitive keys use deterministic non-default values" (Acceptance Criteria)
    - "pre-set non-default env values are not overwritten" (Acceptance Criteria)

- [x] C03 `[backend]` Refactor `src/tests/backend/secrets.test.ts` to remove `dotenv.config()`, consume the shared utility contract, and validate against the Jest bootstrap-injected environment instead of a local `.env` bootstrap path.
  - Depends on: C01, C02.
  - Validation: T01, T02.
  - Trace:
    - "Remove backend test bootstrap dependence on `dotenv.config()` in backend secret tests so Jest-injected env setup remains canonical." (In Scope)
    - "Backend secret tests no longer rely on `dotenv.config()` to pass and instead validate against the Jest bootstrap-injected environment." (Acceptance Criteria)

- [ ] C04 `[backend]` Add targeted backend bootstrap contract tests that cover parser and setup behavior for blank lines, full-line comments, fail-fast handling for missing-`=` lines, blank-key lines, and duplicate keys, first-`=` parsing, deterministic sensitive-value replacement, and non-overwrite rules.
  - Depends on: C01, C02, C03.
  - Validation: T01.
  - Trace:
    - "Add focused tests for backend bootstrap contract behavior" (In Scope)
    - "blank lines and full-line comments are ignored" (Acceptance Criteria)
    - "non-comment, non-blank lines must contain `=` and a non-blank key; otherwise parsing fails fast" (Acceptance Criteria)
    - "duplicate keys in `example.env` cause parsing to fail fast" (Acceptance Criteria)
    - "parsing uses the first `=` as the key/value separator, and additional `=` characters remain part of the value" (Acceptance Criteria)

- [ ] C05 `[docs]` Inspect backend test-facing comments and documentation touched by this work and update only any text that contradicts the canonical Jest bootstrap path.
  - Depends on: C03.
  - Validation: T04.
  - Trace:
    - "Update backend test-facing comments and documentation only where they contradict the canonical Jest bootstrap path." (In Scope)
    - "Any backend test-facing comments or documentation touched by this work do not contradict the stabilized canonical bootstrap approach." (Acceptance Criteria)

- [ ] T01 `[test]` Run the targeted backend bootstrap contract tests and record that parser, classification, deterministic replacement, and setup-rule coverage passes for the intended contract.
  - Depends on: C01, C02, C03, C04.
  - Trace:
    - "Add/adjust targeted backend bootstrap tests for parser/classification + setup rules." (Validation Strategy)
    - "Pass condition: tests for intended bootstrap contract rules pass." (Validation Strategy)

- [ ] T02 `[test]` Run `yarn test:backend` and record that the full backend suite passes without requiring a local `.env` bootstrap path.
  - Depends on: C03, C04.
  - Trace:
    - "Run `yarn test:backend`." (Validation Strategy)
    - "Pass condition: full backend suite passes without requiring a local `.env` bootstrap path." (Validation Strategy)

- [ ] T03 `[config]` Verify that `jest.backend.config.ts` still routes backend setup through one canonical `setupFiles` path and that the shared utility remains on that path.
  - Depends on: C02.
  - Trace:
    - "Validate that `jest.backend.config.ts` still routes setup through backend Jest `setupFiles` with the shared bootstrap utility path." (Validation Strategy)
    - "Pass condition: backend tests use one canonical setup path locally/CI." (Validation Strategy)

- [ ] T04 `[docs]` Verify that any backend test-facing comments or documentation updated by this work do not reintroduce `.env` coupling or describe a conflicting bootstrap path.
  - Depends on: C05.
  - Trace:
    - "Validate that any backend test-facing comments or documentation updated by this work do not contradict the canonical Jest bootstrap path." (Validation Strategy)
    - "Fail condition: touched backend test-facing docs/comments reintroduce `.env` coupling or describe a conflicting bootstrap path." (Validation Strategy)

## Behavior Slices

- Goal: Establish one shared backend test env contract and route backend bootstrap through it.
  Items: C01, C02, C03, T03
  Type: behavior

- Goal: Lock the backend bootstrap parsing and replacement rules in targeted tests.
  Items: C04, T01
  Type: behavior

- Goal: Confirm full-suite behavior and keep touched backend test-facing guidance consistent with the canonical Jest bootstrap path.
  Items: C05, T02, T04
  Type: behavior
