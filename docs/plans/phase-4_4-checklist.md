# Phase 4.4 Checklist - Environment Contract and Runtime Error Clarity

Intent: consolidate backend/functions environment access behind a typed contract, replace env-related string throws with actionable `Error` objects, and align runtime/docs semantics without changing API behavior or broadening scope into frontend or database-logic refactors.

Source plan: `docs/plans/phase-04-type-safety-and-env-handling.md`

## Checklist

- [x] C01 `[governance]` Document and confirm the Phase 4.4 scope boundary: environment contract hardening and startup/runtime error clarity in backend/functions paths only; keep API behavior, database-logic behavior, and frontend strictness out of scope. Depends on: none. Execution notes: see `Execution Notes -> C01 Scope Guard`.
- [x] C02 `[backend]` Create `src/lib/env.ts` as the centralized environment contract module with typed required/optional backend keys and accessor functions for backend/functions runtime use. Depends on: C01. Execution notes: see `Execution Notes -> C02 Contract Shape`.
- [x] C03 `[backend]` Migrate the scoped modules (`src/functions/auth.ts`, `src/functions/comment.ts`, `src/functions/gauth.ts`, `src/functions/topic.ts`, `src/functions/user.ts`, `src/functions/verify.ts`, `src/lib/backend-utilities.ts`, `src/lib/crypt.ts`, `src/lib/MongodbService.ts`, `src/lib/SendGridNotificationService.ts`) from direct `process.env` reads to centralized env accessors. Depends on: C02. Execution notes: see `Execution Notes -> C03 Slice Plan and Guardrails`.
- [x] C04 `[backend]` Replace env-related string throws in the scoped C03 files with structured `Error` objects that include explicit variable names and actionable messages. Depends on: C03. Execution notes: see `Execution Notes -> C04 Error Normalization`.
- [x] C05 `[docs]` Update `example.env` and `README.md` so required/optional variables and backend runtime semantics match the implemented environment contract. Depends on: C04. Execution notes: see `Execution Notes -> C05 Documentation Alignment`.
- [x] C06 `[backend]` Handle residual out-of-scope env/runtime clarity hotspots by adding narrow inline `TODO(phase-04.5)` markers and listing each hotspot in the Phase 4.5 gate note; if none remain, explicitly record that no `TODO(phase-04.5)` deferments were added. Depends on: C04, C05. Execution notes: see `Execution Notes -> C06 Deferment Rules`. Outcome: no `TODO(phase-04.5)` deferments were added.
- [x] C07 `[docs]` Add the Phase 4.5 gate decision to `docs/plans/phase-04-type-safety-and-env-handling.md`, stating either Phase 04 closure or a scoped follow-up checklist with residual hotspots (including any `TODO(phase-04.5)` entries). Depends on: C06. Execution notes: see `Execution Notes -> C07 Gate Note Format`.

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

## Execution Notes (Non-Checklist Guidance)

### C01 Scope Guard

- Keep Phase 4.4 limited to environment contract hardening and env/runtime error clarity in backend/functions paths.
- Do not change API contract behavior, database logic behavior, or frontend strictness as part of this phase.

### C02 Contract Shape

Required backend runtime keys:

- `DB_CONNECTION_STRING`
- `DATABASE_NAME`
- `JWT_SECRET`
- `ALLOW_ORIGIN`
- `SIMPLE_COMMENT_MODERATOR_ID`
- `SIMPLE_COMMENT_MODERATOR_PASSWORD`
- `SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL`

Optional backend runtime keys:

- `IS_CROSS_SITE` (default: `false`)
- `NOTIFICATION_SERVICE_API_KEY` (required only when SendGrid notifications are enabled)
- `SENDGRID_VERIFIED_SENDER` (required only when SendGrid notifications are enabled)

Proposed accessor API:

```ts
// src/lib/env.ts
export class EnvContractError extends Error {
  readonly key: string
  constructor(key: string, message: string)
}

export type BackendEnv = Readonly<{
  dbConnectionString: string
  databaseName: string
  jwtSecret: string
  allowOrigin: string
  moderatorId: string
  moderatorPassword: string
  moderatorContactEmail: string
  isCrossSite: boolean
  notificationServiceApiKey?: string
  sendGridVerifiedSender?: string
}>

export const getBackendEnv: (source?: NodeJS.ProcessEnv) => BackendEnv

export const getOptionalNotificationEnv: (
  source?: NodeJS.ProcessEnv
) => {
  notificationServiceApiKey?: string
  sendGridVerifiedSender?: string
}
```

Contract behavior notes:

- `getBackendEnv()` throws `EnvContractError` for missing required keys.
- `isCrossSite` is parsed as `source.IS_CROSS_SITE === "true"`; any other value resolves to `false`.
- `moderatorContactEmail` stays as raw comma-separated string for backward compatibility; parsing/splitting remains in the notification layer.
- `getOptionalNotificationEnv()` enforces pair semantics: if one SendGrid key is set, the other must also be set.
- C03 migration target is to consume `getBackendEnv()`/`getOptionalNotificationEnv()` and stop direct `process.env` reads in scoped files.

### C03 Slice Plan and Guardrails

Pre-slice invariants:

- No API contract behavior change from env-access migration.
- Required env-key semantics remain unchanged from current runtime behavior.
- `IS_CROSS_SITE` parsing remains `source.IS_CROSS_SITE === "true"` (all other values -> `false`).

Global guardrails:

- Record baseline direct env reads in scoped files with `rg -n "process\\.env" src/functions src/lib`.
- During each slice, do not introduce new direct `process.env` reads in scoped files.
- After each slice, re-run `rg -n "process\\.env"` and verify count is reduced or unchanged only for intentionally deferred sites.
- Keep each slice small and revertable.
- Any deferment should be explicitly annotated with `TODO(phase-04.5)` and listed in Phase 4.5 gate notes.

Slice A - Shared Utility Foundations (`src/lib/crypt.ts`, `src/lib/backend-utilities.ts`):

- Replace direct env reads with `getBackendEnv()` accessors.
- Ensure env/startup failures are structured `Error`/`EnvContractError` objects with explicit key names.
- Validate with `yarn run typecheck`, targeted backend tests for crypt/backend utilities, then `yarn run test:backend`.
- Run guardrail delta check by comparing `rg -n "process\\.env"` to baseline.

Slice B - Notification Layer (`src/lib/SendGridNotificationService.ts`):

- Migrate notification env reads to `getOptionalNotificationEnv()` and `getBackendEnv()` as needed.
- Preserve pair semantics for `NOTIFICATION_SERVICE_API_KEY` and `SENDGRID_VERIFIED_SENDER`.
- Preserve moderator email parsing compatibility (comma-separated parsing remains in notification layer).
- Normalize env-related throws to structured `Error`/`EnvContractError`.
- Validate with `yarn run typecheck`, targeted `SendGridNotificationService` tests, then `yarn run test:backend`.
- Run guardrail delta check by comparing `rg -n "process\\.env"` to baseline.

Slice C - Core Service Layer (`src/lib/MongodbService.ts`):

- Migrate `MongodbService` env reads to centralized accessors while preserving behavior.
- Keep moderator-related semantics unchanged (`SIMPLE_COMMENT_MODERATOR_ID`, password/contact email usage).
- Keep `jwtSecret` and cross-site cookie semantics unchanged.
- Normalize env-related startup/runtime throws to structured `Error`/`EnvContractError`.
- Validate with `yarn run typecheck`, targeted `MongodbService` tests, then `yarn run test:backend`.
- Run guardrail delta check by comparing `rg -n "process\\.env"` to baseline.

Slice D - Function Entrypoints (`src/functions/auth.ts`, `src/functions/comment.ts`, `src/functions/gauth.ts`, `src/functions/topic.ts`, `src/functions/user.ts`, `src/functions/verify.ts`):

- Migrate function-entrypoint env reads to centralized accessors.
- Preserve startup/import-time failure behavior for missing required env keys unless checklist scope is explicitly amended.
- Preserve existing endpoint behavior and headers/cookie semantics.
- Normalize env-related throws to structured `Error`/`EnvContractError`.
- Validate with `yarn run typecheck`, targeted endpoint/backend tests, then full `yarn run test:backend`, `yarn run test:frontend`, and `yarn run ci:local`.
- Run migration-closure guardrail check with `rg -n "process\\.env"` and document any intentional residuals.

### C04 Error Normalization

- Limit normalization to env/startup/runtime-failure surfaces in the scoped files from C03.
- Replace env-related string throws with structured `Error` objects (or `EnvContractError`) containing explicit variable names and actionable messages.
- Avoid unrelated error-shape refactors outside env-related paths.

### C05 Documentation Alignment

- Update `example.env` and `README.md` to match the implemented authoritative env contract.
- Ensure required vs optional semantics are explicit and consistent with `src/lib/env.ts` behavior.
- Ensure `IS_CROSS_SITE` and notification-key semantics are documented exactly as implemented.

### C06 Deferment Rules

- If residual env/runtime clarity hotspots remain out of scope, mark each with inline `TODO(phase-04.5)` and list them in gate notes.
- If no deferments are needed, explicitly record that no `TODO(phase-04.5)` entries were added.

### C07 Gate Note Format

- Update `docs/plans/phase-04-type-safety-and-env-handling.md` with the Phase 4.5 gate decision.
- Gate note must state either:
  - Phase 04 is complete, or
  - a scoped Phase 4.5 follow-up is required with listed hotspots/deferments.
