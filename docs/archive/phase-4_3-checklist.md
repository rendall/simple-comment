# Phase 4.3 Checklist - Backend `strict` Baseline

Status: Complete

Source plan: `docs/plans/phase-04-type-safety-and-env-handling.md`

## Checklist

- [x] C01 `[governance]` Confirm Phase 4.3 is scoped to backend/functions strictness escalation only: enable broader `strict` in `tsconfig.netlify.functions.json` and remediate only findings surfaced by the first post-toggle `yarn run typecheck` baseline in `src/functions/**/*.ts` plus directly involved runtime dependencies under `src/lib/**/*.ts`; keep frontend strictness, broad env architecture refactors, and API behavior changes out of scope. Depends on: none.
- [x] C02 `[config]` Enable `"strict": true` in `tsconfig.netlify.functions.json` while preserving existing Phase 4.1/4.2 strictness gains (`noImplicitAny`, `strictNullChecks`) and avoiding unrelated compiler-option churn. Depends on: C01.
- [x] C03 `[backend]` From the first `yarn run typecheck` baseline after `C02`, remediate surfaced strictness findings in `src/functions/**/*.ts` with explicit narrowing/typing (for example catch-variable narrowing and response-union guards) while keeping endpoint runtime behavior unchanged. Depends on: C02.
- [x] C04 `[backend]` From the same post-`C02` baseline, remediate surfaced strictness findings in backend runtime dependencies under `src/lib/**/*.ts` imported by functions (for example class field initialization and interface/abstract-contract compatibility) with minimal behavior change. Depends on: C02.
- [x] C05 `[backend]` Confirm strictness closure for the post-`C02` baseline: all surfaced strict diagnostics are remediated in scope; if any finding remains out-of-scope, use a narrow suppression with inline `TODO(phase-04.4)` and capture each deferred hotspot for gate-note tracking. Depends on: C03, C04. Outcome: no `TODO(phase-04.4)` suppressions were added.
- [x] C06 `[docs]` Record the Phase 4.4 gate decision in `docs/plans/phase-04-type-safety-and-env-handling.md`: if strictness closure is achieved, create `docs/plans/phase-4_4-checklist.md` for environment/runtime error-clarity hardening; otherwise pause strictness escalation and document unresolved hotspots (including any `TODO(phase-04.4)` suppressions). Depends on: C05.

## Behavior Slices

- Goal: Lock Phase 4.3 to strictness escalation without scope drift.
  Items: C01, C02
  Type: mechanical

- Goal: Remediate strictness findings in backend/functions runtime paths with minimal behavior change.
  Items: C03, C04, C05
  Type: behavior

- Goal: Capture explicit carry-forward decision and ensure a concrete Phase 4.4 path for runtime/env clarity.
  Items: C06
  Type: mechanical
