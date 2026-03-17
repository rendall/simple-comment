# Backend Test Bootstrap Defaults Stabilization Plan

Status: Draft for approval (non-phase scoped plan)

## Goal

Stabilize backend test bootstrap defaults so backend tests run deterministically across local and CI environments without hidden `.env` or parser drift dependencies.

## Intent

Make backend test startup behavior predictable and easy to reason about.

Contributors should be able to run backend tests and get the same bootstrap behavior every time: one shared source for parsing expected environment keys, deterministic secret replacement rules, and explicit tests that lock that behavior in place.

## In Scope

- Backend test bootstrap hardening only.
- Centralize backend test env parsing/classification logic into shared test utility code used by bootstrap and secret-validation tests.
- Remove backend test bootstrap dependence on `dotenv.config()` in backend secret tests so Jest-injected env setup remains canonical.
- Preserve and formalize deterministic secret replacement behavior for keys classified as sensitive.
- Add focused tests for backend bootstrap contract behavior (e.g., parsing, default injection, secret replacement, malformed-line handling, and non-overwrite rules).
- Update test-facing docs/comments where needed to reflect the canonical backend bootstrap path.

## Out of Scope

- Frontend test or build behavior changes.
- Runtime (non-test) env loading changes in Netlify functions or production code.
- API behavior, schema, policy, or persistence changes.
- CI workflow redesign unrelated to backend bootstrap defaults.
- Dependency upgrades unless strictly required to complete this plan.

## Constraints

- Preserve the existing "Jest-injected env only" strategy selected in prior determinism work.
- Do not expand this plan into broader test refactors outside backend bootstrap defaults.
- Keep changes atomic and reviewable, with one coherent stabilization theme for this plan.

## Risks and Mitigations

- Risk: Over-tightening bootstrap tests could codify accidental behavior.
  - Mitigation: Write bootstrap contract tests only for intentionally desired rules and keep edge-case assertions directly tied to documented defaults.

- Risk: Removing `dotenv.config()` from a backend test could expose implicit local-only assumptions.
  - Mitigation: Ensure setup file remains the single source of injected defaults and validate with full backend test runs.

- Risk: Sensitive-key classification rules may drift from future env naming.
  - Mitigation: Keep classification logic centralized and explicitly tested so future naming-rule updates are single-surface and deliberate.

## Open Questions / Assumptions

- Assumption: Sensitive key classification remains name-based (currently `SECRET`/`PASSWORD`) unless explicitly expanded during approved checklist authoring.
- Assumption: `example.env` remains the baseline declaration of expected env keys for backend test bootstrap.

## Acceptance Criteria

1. Backend bootstrap and backend secret tests consume the same shared parser/classification utility (no duplicated parsing logic across those surfaces).
2. Backend secret tests no longer rely on `dotenv.config()` to pass and instead validate against the Jest bootstrap-injected environment.
3. Bootstrap behavior is covered by focused backend tests that verify at least:
   - missing keys are injected from `example.env`
   - sensitive keys use deterministic non-default values
   - pre-set non-default env values are not overwritten
   - malformed/blank/comment lines are ignored safely
4. `yarn test:backend` passes with these changes.
5. Documentation/comments that describe backend test env behavior align with the stabilized canonical bootstrap approach.

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