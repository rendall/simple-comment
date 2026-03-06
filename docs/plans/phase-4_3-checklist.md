# Phase 4.3 Checklist - Backend `strict` Baseline

Source plan: `docs/plans/phase-04-type-safety-and-env-handling.md`

## Checklist

- [ ] C01 `[governance]` Confirm Phase 4.3 is scoped to backend/functions strictness escalation only: enable broader `strict` in `tsconfig.netlify.functions.json` and remediate only surfaced findings in `src/functions/**/*.ts` and runtime dependencies imported by functions under `src/lib/**/*.ts`; keep frontend strictness, broad env architecture refactors, and API behavior changes out of scope. Depends on: none.
- [ ] C02 `[config]` Enable `"strict": true` in `tsconfig.netlify.functions.json` while preserving existing Phase 4.1/4.2 strictness gains (`noImplicitAny`, `strictNullChecks`) and avoiding unrelated compiler-option churn. Depends on: C01.
- [ ] C03 `[backend]` From the first `yarn run typecheck` baseline after `C02`, remediate surfaced strictness findings in `src/functions/**/*.ts` with explicit narrowing/typing (for example catch-variable narrowing and response-union guards) while keeping endpoint runtime behavior unchanged. Depends on: C02.
- [ ] C04 `[backend]` From the same post-`C02` baseline, remediate surfaced strictness findings in backend runtime dependencies under `src/lib/**/*.ts` imported by functions (for example class field initialization and interface/abstract-contract compatibility) with minimal behavior change. Depends on: C02.
- [ ] C05 `[backend]` If any strictness finding remains out-of-scope to remediate in Phase 4.3, add narrow suppression with inline `TODO(phase-04.4)` and document each deferred hotspot in the Phase 4.4 gate note; otherwise explicitly record that no `TODO(phase-04.4)` suppressions were added. Depends on: C03, C04.
- [ ] C06 `[docs]` Record the Phase 4.4 gate decision in `docs/plans/phase-04-type-safety-and-env-handling.md` with one of: proceed to environment contract hardening checklist work, or pause for strictness hotspot cleanup; include deferred `TODO(phase-04.4)` hotspots (if any). Depends on: C05.

## Behavior Slices

- Goal: Lock Phase 4.3 to strictness escalation without scope drift.
  Items: C01, C02
  Type: mechanical

- Goal: Remediate strictness findings in backend/functions runtime paths with minimal behavior change.
  Items: C03, C04, C05
  Type: behavior

- Goal: Capture explicit carry-forward decision and deferred strictness hotspots for Phase 4.4.
  Items: C06
  Type: mechanical
