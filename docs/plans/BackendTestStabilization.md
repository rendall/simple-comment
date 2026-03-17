# Backend Test Bootstrap Defaults Stabilization Plan

Status: active

## Goal

Stabilize backend test bootstrap defaults so backend tests run deterministically across local and CI environments without hidden `.env` or parser drift dependencies.

## Intent

Make backend test startup behavior predictable and easy to reason about.

Contributors should be able to run backend tests and get the same bootstrap behavior every time: one shared source for parsing expected environment keys, deterministic secret replacement rules, and explicit tests that lock that behavior in place.

## In Scope

- Backend test bootstrap hardening only.
- Centralize backend test env parsing, sensitive-key classification, and deterministic secret replacement rules into shared test utility code consumed by bootstrap and secret-validation tests.
- Remove backend test bootstrap dependence on `dotenv.config()` in backend secret tests so Jest-injected env setup remains canonical.
- Preserve and formalize deterministic secret replacement behavior for keys classified as sensitive.
- Add focused tests for backend bootstrap contract behavior (e.g., parsing, default injection, secret replacement, malformed-line handling, and non-overwrite rules).
- Update backend test-facing comments and documentation only where they contradict the canonical Jest bootstrap path.

## Out of Scope

- Frontend test or build behavior changes.
- Runtime (non-test) env loading changes in Netlify functions or production code.
- API behavior, schema, policy, or persistence changes.
- CI workflow redesign unrelated to backend bootstrap defaults.
- Dependency upgrades unless strictly required to complete this plan.

## Constraints

- Preserve the existing "Jest-injected env only" strategy selected in prior determinism work.
- Keep the shared bootstrap parser intentionally minimal; do not expand this plan into full `dotenv`-compatibility work.
- Do not expand this plan into broader test refactors outside backend bootstrap defaults.
- Keep changes atomic and reviewable, with one coherent stabilization theme for this plan.

## Risks and Mitigations

- Risk: Over-tightening bootstrap tests could codify accidental behavior.
  - Mitigation: Write bootstrap contract tests only for intentionally desired rules and keep edge-case assertions directly tied to documented defaults.

- Risk: Removing `dotenv.config()` from a backend test could expose implicit local-only assumptions.
  - Mitigation: Ensure setup file remains the single source of injected defaults and validate with full backend test runs.

- Risk: Sensitive-key classification rules may drift from future env naming.
  - Mitigation: Keep classification logic centralized and explicitly tested so future naming-rule updates are single-surface and deliberate.

## Locked Decisions

- Sensitive-key classification remains name-based for keys containing `SECRET` or `PASSWORD` only; expanding that rule is out of scope for this plan.
- `example.env` remains the baseline declaration of expected env keys for backend test bootstrap in this plan.

## Acceptance Criteria

1. Backend bootstrap and backend secret tests consume the same shared utility for `example.env` parsing, sensitive-key classification, and deterministic secret replacement rules (no duplicated contract logic across those surfaces).
2. Backend secret tests no longer rely on `dotenv.config()` to pass and instead validate against the Jest bootstrap-injected environment.
3. Bootstrap behavior is covered by focused backend tests that verify at least:
   - missing keys are injected from `example.env`
   - sensitive keys use deterministic non-default values
   - pre-set non-default env values are not overwritten
   - blank lines and full-line comments are ignored
   - non-comment, non-blank lines must contain `=` and a non-blank key; otherwise parsing fails fast
   - duplicate keys in `example.env` cause parsing to fail fast
   - parsing uses the first `=` as the key/value separator, and additional `=` characters remain part of the value
4. `yarn test:backend` passes with these changes.
5. Any backend test-facing comments or documentation touched by this work do not contradict the stabilized canonical bootstrap approach.

## Validation Strategy

Because this plan changes deterministic test bootstrap behavior, required evidence includes:

- Unit evidence
  - Add/adjust targeted backend bootstrap tests for parser/classification + setup rules.
  - Pass condition: tests for intended bootstrap contract rules pass.
  - Fail condition: any bootstrap contract rule is untested or failing.

- Integration/smoke evidence
  - Run `yarn test:backend`.
  - Pass condition: full backend suite passes without requiring a local `.env` bootstrap path.
  - Fail condition: suite depends on local `.env` side effects or otherwise fails due to bootstrap regression.

- Contract/parity evidence
  - Validate that `jest.backend.config.ts` still routes setup through backend Jest `setupFiles` with the shared bootstrap utility path.
  - Pass condition: backend tests use one canonical setup path locally/CI.
  - Fail condition: multiple conflicting bootstrap paths or reintroduced `.env` coupling.

- Documentation/parity evidence
  - Validate that any backend test-facing comments or documentation updated by this work do not contradict the canonical Jest bootstrap path.
  - Pass condition: touched backend test-facing docs/comments remain consistent with the stabilized bootstrap contract.
  - Fail condition: touched backend test-facing docs/comments reintroduce `.env` coupling or describe a conflicting bootstrap path.
