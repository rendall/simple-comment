# Phase 4.2 Checklist - strictNullChecks Baseline

Status: Complete

Source plan: `docs/plans/phase-04-type-safety-and-env-handling.md`

## Checklist

- [x] C01 `[governance]` Confirm Phase 4.2 remains scoped to `strictNullChecks` only (no full `strict` toggle, no broad env/string-throw refactor) and does not remove or weaken test assertions to satisfy type checks. Depends on: none.
- [x] C02 `[config]` Enable `strictNullChecks` in `tsconfig.netlify.functions.json` while keeping `noImplicitAny` enabled and leaving other strictness flags unchanged for Phase 4.2 scope. Depends on: C01.
- [x] C03 `[backend]` From the first `yarn run typecheck` pass after `C02`, add null-safe typing/guards only in surfaced files under `src/functions/**/*.ts`, keeping runtime behavior unchanged where possible. Depends on: C02.
- [x] C04 `[backend]` From the same post-`C02` typecheck baseline, add null-safe typing/guards only in surfaced backend/shared runtime files imported by functions (`src/lib/**/*.ts`), keeping runtime behavior unchanged where possible. Depends on: C02.
- [x] C05 `[backend]` If `strictNullChecks`-related failures surface while running `yarn test:backend`, apply minimal typing fixes in the failing `src/tests/backend/**/*.ts` files without relaxing test intent/assertions. Depends on: C03, C04.
- [x] C06 `[backend]` If any `strictNullChecks` issue remains out-of-scope to remediate in Phase 4.2, add narrow suppression with inline `TODO(phase-04.3)` and document each deferred hotspot in the Phase 4.3 gate note; otherwise explicitly record that no suppressions were added. Depends on: C03, C04, C05. Outcome: no `TODO(phase-04.3)` suppressions were added.
- [x] C07 `[docs]` Record the Phase 4.3 strictness gate decision in `docs/plans/phase-04-type-safety-and-env-handling.md` with one of: proceed to broader `strict` evaluation or pause for hotspot cleanup, including deferred `TODO(phase-04.3)` hotspots (if any). Depends on: C06.

## Behavior Slices

- Goal: Enable `strictNullChecks` for backend/functions TypeScript compilation without broad strictness escalation.
  Items: C01, C02
  Type: mechanical

- Goal: Remediate surfaced nullability findings in Phase 4.2 scope with minimal behavior change.
  Items: C03, C04, C05, C06
  Type: behavior

- Goal: Capture explicit go/no-go decision and carry-forward items for Phase 4.3.
  Items: C07
  Type: mechanical
