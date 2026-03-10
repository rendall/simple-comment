# Phase 04 - Type Safety and Environment Handling

Status: Complete

## Goal

Increase type safety and make startup/runtime errors clearer and easier to reason about.

## Execution model

Phase 04 is executed incrementally:

- Phase 04.1 (completed on 2026-03-03): enabled `noImplicitAny` and remediated surfaced findings.
- Phase 04.2 (completed on 2026-03-05): enabled `strictNullChecks` and remediated surfaced findings.
- Phase 04.3 (completed on 2026-03-06): enabled broader backend/functions `strict` and remediated surfaced findings.
- Phase 04.4 (completed on 2026-03-09): hardened environment contract usage and startup/runtime error clarity.

## Current scope (Phase 4.4)

- Add centralized backend environment contract accessors.
- Migrate scoped backend/functions modules from ad-hoc `process.env` reads to centralized accessors.
- Replace env-related string throws in scoped backend/functions paths with structured `Error` objects and actionable messages.
- Keep API behavior unchanged and avoid unrelated frontend/database-logic refactors.

## Scope (Phase 4.1 baseline)

- Phase 04.1 strictness change:
  - Enable `noImplicitAny` in backend/functions TypeScript config.
  - Fix surfaced `implicit any` issues with minimal behavior change.
- Keep verification and change volume small enough to evaluate signal/churn before next strictness step.

## Out of scope (Phase 04.1)

- Enabling `strictNullChecks` or full `strict`.
- Broad refactors for environment handling architecture.
- Repo-wide string-throw cleanup not required by `noImplicitAny` remediation.
- Frontend build-system changes.

## Inputs and evidence

- Strict options mostly disabled in `tsconfig.netlify.functions.json`.
- Many string throws in functions/libs (examples: `src/functions/auth.ts`, `src/lib/backend-utilities.ts`, `src/lib/MongodbService.ts`).

## Implementation steps

1. Enable `noImplicitAny` in `tsconfig.netlify.functions.json`.
2. Run `yarn run typecheck` and collect surfaced `implicit any` violations.
3. Remediate `implicit any` violations in scoped backend/shared files with minimal behavior change.
4. Validate with:
   - `yarn run typecheck`
   - `yarn test:backend`
   - `yarn test:frontend`
5. Record post-merge strictness gate decision for Phase 04.2:
   - proceed to `strictNullChecks`, or
   - stop and resolve churn hotspots first.

## Risk and mitigation

- Risk: even `noImplicitAny` can create unexpected churn in legacy paths.
- Mitigation:
  - keep this phase to one strictness knob (`noImplicitAny`)
  - avoid broad refactors while remediating type errors
  - if temporary suppressions are unavoidable, require explicit TODO and follow-up issue

## Current acceptance criteria (Phase 4.4)

- Centralized env contract module is in place and used by scoped backend/functions runtime paths.
- Env/startup error surfaces in scoped files no longer rely on string throws.
- `example.env` and `README.md` reflect authoritative env contract semantics.
- A Phase 4.5 gate decision is documented with closure or scoped follow-up.

## Acceptance criteria (Phase 4.1 baseline)

- `noImplicitAny` is enabled in `tsconfig.netlify.functions.json`.
- `yarn run typecheck` passes.
- `yarn test:backend` and `yarn test:frontend` pass.
- A documented go/no-go decision exists for Phase 04.2 strictness escalation.

## Rollback

- Revert `noImplicitAny` toggle independently from remediation commits if churn/regression risk is too high.
- Keep low-risk explicit typing improvements that do not depend on strictness toggle.

## Checklist completeness pass (2026-03-03)

- Result: checklist required additions for full Phase 4.1 intent representation.
- Missing intent added:
  - explicit scope guard to prevent strictness/refactor drift in this phase.
  - explicit coupling of remediation items to `yarn run typecheck` surfaced findings.
  - explicit conditional outcome for suppression handling (`TODO(phase-04.2)` entries or an explicit no-suppression note).

## Checklist QC decisions (2026-03-03)

1. Issue: remediation item scope was too broad (`src/lib/**/*.ts`) without tying to actual surfaced violations, risking scope creep.
   Decision: tie remediation items to `yarn run typecheck` findings under Phase 4.1.

2. Issue: suppression item was ambiguous/checkability-poor when no suppression is needed.
   Decision: require explicit no-suppression note when none are added; otherwise require inline TODO plus gate-note hotspot list.

3. Issue: checklist lacked an explicit governance boundary item despite strict Phase 4.1 out-of-scope constraints.
   Decision: add a governance checklist item to lock scope to `noImplicitAny`-only execution.

## Checklist integration pass (2026-03-03)

- Verified checklist items still map directly to Phase 4.1 scope and acceptance criteria.
- Verified dependency graph coherence after updates:
  - C02 depends on governance C01.
  - C03/C04 depend on C02.
  - C05 depends on C03/C04.
  - C06 depends on C05.
- Verified each checklist item belongs to exactly one behavior slice.

## Checklist sanity pass (2026-03-03)

- No remaining blockers identified for Phase 4.1 implementation.
- Checklist is atomic, scoped, and checkable per `docs/norms/checklist.md`.
- Proceed with implementation per `docs/norms/implementation.md`.

## Phase 4.2 gate note (2026-03-03)

- Phase 4.1 outcome:
  - `noImplicitAny` enabled in `tsconfig.netlify.functions.json`.
  - `yarn run typecheck`, `yarn test:backend`, and `yarn test:frontend` are green.
  - No `TODO(phase-04.2)` suppressions were added in Phase 4.1.
- Decision: proceed to Phase 4.2 evaluation with `strictNullChecks` as the next strictness candidate.

## Phase 4.3 gate note (2026-03-05)

- Phase 4.2 outcome:
  - `strictNullChecks` enabled in `tsconfig.netlify.functions.json` while keeping `noImplicitAny` enabled.
  - `yarn run typecheck`, `yarn test:backend`, and `yarn test:frontend` are green.
  - No `TODO(phase-04.3)` suppressions were added in Phase 4.2.
- Decision: proceed to broader `strict` evaluation for Phase 4.3.

## Phase 4.3 checklist integration (2026-03-06)

- Checklist created: `docs/plans/phase-4_3-checklist.md`.
- Intent: execute broader backend/functions `strict` evaluation with explicit strict-closure criteria and deferred-hotspot tracking.

## Phase 4.4 gate note (2026-03-06)

- Phase 4.3 outcome:
  - `"strict": true` enabled in `tsconfig.netlify.functions.json` while preserving `noImplicitAny` and `strictNullChecks`.
  - `yarn run typecheck`, `yarn test:backend`, and `yarn test:frontend` are green.
  - No `TODO(phase-04.4)` suppressions were added in Phase 4.3.
- Decision: proceed to Phase 4.4 environment contract and runtime error-clarity hardening using `docs/plans/phase-4_4-checklist.md`.

## Phase 4.4 checklist integration (2026-03-06)

- Checklist created: `docs/plans/phase-4_4-checklist.md`.
- Intent: harden centralized environment contract usage and make startup/runtime failures clearer and more actionable.

## Phase 4.5 gate note (2026-03-09)

- Phase 4.4 outcome:
  - Centralized backend env contract module added at `src/lib/env.ts`.
  - Scoped backend/functions modules now use centralized env accessors instead of direct ad-hoc `process.env` reads.
  - Env-related string throws in scoped Phase 4.4 paths were replaced with structured `Error` objects (`EnvContractError` included).
  - `example.env` and `README.md` were updated to reflect required/optional env semantics and notification key pairing.
  - `yarn run typecheck`, `yarn run test:backend`, `yarn run test:frontend`, and `yarn run ci:local` are green.
  - No `TODO(phase-04.5)` deferments were added.
- Decision: close Phase 04 as complete and proceed with Phase 05 planning/execution.
