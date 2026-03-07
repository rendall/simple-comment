# Phase 4.4 Checklist - Environment Contract and Runtime Error Clarity

Source plan: `docs/plans/phase-04-type-safety-and-env-handling.md`

## Checklist

- [ ] C01 `[governance]` Confirm Phase 4.4 scope is limited to environment contract hardening and startup/runtime error clarity in backend/functions paths; keep API contract behavior, database logic, and frontend strictness changes out of scope. Depends on: none.
- [ ] C02 `[backend]` Add a centralized environment contract module at `src/lib/env.ts` that defines required/optional backend environment keys and provides typed accessors for backend/functions runtime use. Depends on: C01.
- [ ] C03 `[backend]` Update backend entrypoints and runtime modules (`src/functions/auth.ts`, `src/functions/comment.ts`, `src/functions/gauth.ts`, `src/functions/topic.ts`, `src/functions/user.ts`, `src/functions/verify.ts`, `src/lib/backend-utilities.ts`, `src/lib/crypt.ts`, `src/lib/MongodbService.ts`, `src/lib/SendGridNotificationService.ts`) to use the centralized environment contract accessors instead of direct ad-hoc `process.env` reads. Depends on: C02.
- [ ] C04 `[backend]` Normalize environment/startup failure throws in the same scoped files to structured `Error` objects with explicit variable names and actionable messages; avoid string throws in these env-related paths. Depends on: C03.
- [ ] C05 `[docs]` Update `example.env` and `README.md` to reflect the authoritative environment contract (required variables, optional variables, and semantics used by backend/functions runtime). Depends on: C04.
- [ ] C06 `[backend]` If any env/runtime clarity issue remains out-of-scope for Phase 4.4, add narrow suppression or explicit deferred note with inline `TODO(phase-04.5)` and list each hotspot in the Phase 4.5 gate note; otherwise explicitly record no `TODO(phase-04.5)` deferments. Depends on: C04, C05.
- [ ] C07 `[docs]` Record the Phase 4.5 gate decision in `docs/plans/phase-04-type-safety-and-env-handling.md` with one of: close Phase 04 as complete, or proceed to a scoped follow-up checklist for residual hotspots (including any `TODO(phase-04.5)` entries). Depends on: C06.

## Behavior Slices

- Goal: Establish explicit Phase 4.4 scope boundaries and centralized environment contract shape.
  Items: C01, C02
  Type: mechanical

- Goal: Apply centralized env access and improve startup/runtime failure clarity in backend/functions paths without changing API behavior.
  Items: C03, C04
  Type: behavior

- Goal: Align contributor-facing environment documentation and capture carry-forward decision/deferments.
  Items: C05, C06, C07
  Type: mechanical
