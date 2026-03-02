# Phase 04 - Type Safety and Environment Handling

Status: Planned

## Goal

Increase type safety and make startup/runtime errors clearer and easier to reason about.

## Scope

- Incremental TypeScript strictness improvements in backend and shared libs.
- Replace string throws with `Error` instances.
- Centralize and type environment-variable validation.
- Remove broad implicit `any` hotspots where practical.

## Inputs and evidence

- Strict options mostly disabled in `tsconfig.netlify.functions.json`.
- Many string throws in functions/libs (examples: `src/functions/auth.ts`, `src/lib/backend-utilities.ts`, `src/lib/MongodbService.ts`).

## Implementation steps

1. Introduce env schema/validator module:
   - single import point for validated config
   - fail fast with typed errors
2. Replace top-level string throws with explicit errors.
3. Enable strict flags in stages:
   - start with `noImplicitAny`
   - then `strictNullChecks`
   - then broader `strict`
4. Fix surfaced typing issues phase-locally with minimal behavior change.
5. Update tests for new error types/messages where needed.

## Risk and mitigation

- Risk: broad strictness enablement creates high churn.
- Mitigation:
  - staged PRs inside this phase if needed
  - temporary targeted suppressions with tracked cleanup tickets

## Acceptance criteria

- Env validation is centralized and tested.
- String throws removed from target modules.
- At least one additional strictness level enabled with green CI.

## Rollback

- Revert strictness level toggles independently from env centralization.
- Keep non-controversial error-type upgrades if strictness rollback is needed.
