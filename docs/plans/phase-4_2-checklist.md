# Phase 4.2 Checklist - strictNullChecks Baseline

Source plan: `docs/plans/phase-04-type-safety-and-env-handling.md`

## Checklist

- [ ] C01 `[governance]` Confirm Phase 4.2 remains scoped to `strictNullChecks` only (no full `strict` toggle, no broad env/string-throw refactor) per `docs/plans/phase-04-type-safety-and-env-handling.md`.
- [ ] C02 `[config]` Enable `strictNullChecks` in `tsconfig.netlify.functions.json` while keeping `noImplicitAny` enabled and leaving other strictness flags unchanged for Phase 4.2 scope. Depends on: C01.
- [ ] C03 `[backend]` Add null-safe typing/guards for `strictNullChecks` findings reported by `yarn run typecheck` under `src/functions/**/*.ts` after `C02`, keeping runtime behavior unchanged where possible. Depends on: C02.
- [ ] C04 `[backend]` Add null-safe typing/guards for `strictNullChecks` findings reported by `yarn run typecheck` in backend/shared runtime files imported by functions (`src/lib/**/*.ts`) after `C02`, keeping runtime behavior unchanged where possible. Depends on: C02.
- [ ] C05 `[backend]` If `strictNullChecks` findings surface in backend test files compiled in the backend test path, apply minimal typing fixes in `src/tests/backend/**/*.ts` required to keep Phase 4.2 validation green. Depends on: C03, C04.
- [ ] C06 `[backend]` If any `strictNullChecks` issue remains out-of-scope to remediate in Phase 4.2, add narrow suppression with inline `TODO(phase-04.3)` and document each deferred hotspot in the Phase 4.3 gate note; otherwise explicitly record that no suppressions were added. Depends on: C03, C04, C05.
- [ ] C07 `[docs]` Record the Phase 4.3 strictness gate decision in `docs/plans/phase-04-type-safety-and-env-handling.md` with one of: proceed to broader `strict` evaluation or pause for hotspot cleanup, including deferred `TODO(phase-04.3)` hotspots (if any). Depends on: C06.

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
