# Phase 4.1 Checklist - noImplicitAny Baseline

Status: Complete

Source plan: `docs/plans/phase-04-type-safety-and-env-handling.md`

## Checklist

- [x] C01 `[governance]` Confirm Phase 4.1 remains scoped to `noImplicitAny` only (no `strictNullChecks`/`strict` toggle, no broad env/string-throw refactor) per `docs/plans/phase-04-type-safety-and-env-handling.md`.
- [x] C02 `[config]` Enable `noImplicitAny` in `tsconfig.netlify.functions.json` and keep other strictness flags unchanged for Phase 4.1 scope. Depends on: C01.
- [x] C03 `[backend]` Add explicit types for `implicit any` findings reported by `yarn run typecheck` under `src/functions/**/*.ts` after `C02`, keeping runtime behavior unchanged where possible. Depends on: C02.
- [x] C04 `[backend]` Add explicit types for `implicit any` findings reported by `yarn run typecheck` in backend/shared runtime files imported by functions (`src/lib/**/*.ts`) after `C02`, keeping runtime behavior unchanged where possible. Depends on: C02.
- [x] C05 `[backend]` If any `implicit any` remains out-of-scope to remediate in Phase 4.1, add narrow suppression with inline `TODO(phase-04.2)` and document each deferred hotspot in the Phase 4.2 gate note; otherwise explicitly record that no suppressions were added. Depends on: C03, C04.
- [x] C06 `[docs]` Record the Phase 4.2 strictness gate decision in `docs/plans/phase-04-type-safety-and-env-handling.md` with one of: proceed to `strictNullChecks` or pause for hotspot cleanup, including deferred `TODO(phase-04.2)` hotspots (if any). Depends on: C05.

## Behavior Slices

- Goal: Enable `noImplicitAny` for backend/functions TypeScript compilation without broad strictness escalation.
  Items: C01, C02
  Type: mechanical

- Goal: Remove surfaced implicit-`any` issues in Phase 4.1 scope with minimal behavior change.
  Items: C03, C04, C05
  Type: behavior

- Goal: Capture explicit go/no-go decision and carry-forward items for Phase 4.2.
  Items: C06
  Type: mechanical
