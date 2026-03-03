# Phase 04 - Type Safety and Environment Handling

Status: Planned

## Goal

Increase type safety and make startup/runtime errors clearer and easier to reason about.

## Execution model

Phase 04 will be executed incrementally:

- Phase 04.1 (current): enable `noImplicitAny` only and remediate surfaced issues.
- Phase 04.2+ (future): consider additional strictness (`strictNullChecks`, then broader `strict`) only after a post-merge gate review.

## Scope

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

## Acceptance criteria

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
