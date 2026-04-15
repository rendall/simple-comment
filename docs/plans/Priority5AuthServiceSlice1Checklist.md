# Priority 5 Auth Service Slice 1 Checklist

Status: planning

Classification: proposed implementation checklist draft (not approved)

Source plan: `docs/RepoHealthImprovementBacklog.md` (Priority 5: Frontend Architecture Decoupling)

## Scope Lock (from Source Plan)

In scope:

- reduce component-bound behavior coupling where the repo already flags it as a concern
- clarify boundaries between view components, state machines, and auth/workflow logic

Success signals to satisfy:

- auth and identity flows are less dependent on component presence
- UI modules are easier to test at the right boundary
- login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns

Out of scope:

- changing backend/API contracts
- introducing auth feature behavior changes beyond boundary ownership refactor
- request/outcome coordination for `CommentInput.svelte` and reply flows
- moving login form-local field state or field-level validation UI out of `Login.svelte`
- extracting auth API workflows in this slice

## Slice Intent

This slice establishes only the minimal contract for a widget-scoped `auth-service` that owns login-machine runtime lifecycle outside `Login.svelte`.

Execution note:

- maintainer preference requires three separate sessions for this slice:
  - export scaffold
  - fail-first tests
  - implementation to green
- if implementation cannot reach green without changing the tests, stop and discuss rather than modifying tests in the implementation session

## Atomic Checklist Items

- [ ] C01 `[frontend]` Add the minimal slice-1 runtime scaffold to `src/lib/auth-service.ts` by defining `AuthSessionState` from `src/lib/login.xstate.ts`, adding `destroy` to the `AuthService` lifecycle contract, and preserving exploratory request/outcome, current-user, and auth-command surfaces unless they directly conflict with the slice-1 runtime contract.
  - Depends on: none.
  - Trace:
    - "clarify boundaries between view components, state machines, and auth/workflow logic" (Priority 5)
    - "auth/session behavior is coupled to component presence and lifecycle rather than being owned by a smaller dedicated workflow/service boundary" (Priority 5)

- [ ] T01 `[tests]` Add fail-first frontend tests for the slice-1 `auth-service` contract in `src/tests/frontend/auth-service.test.ts` that prove `createAuthService()` returns an object with readable `sessionState`, that `sessionState` uses the `loginMachine` session vocabulary, and that `destroy()` is part of the public lifecycle contract.
  - Depends on: C01.
  - Trace:
    - "UI modules are easier to test at the right boundary" (Priority 5)
    - "clarify boundaries between view components, state machines, and auth/workflow logic" (Priority 5)

- [ ] C02 `[frontend]` Implement slice-1 runtime ownership in `src/lib/auth-service.ts` so `createAuthService()` owns a live interpreted instance of `src/lib/login.xstate.ts`, publishes session state from that runtime rather than manual string stores, and disposes the runtime through `destroy()`.
  - Depends on: T01.
  - Validated by: T01.
  - Trace:
    - "it drives the `loginMachine` state machine" (Priority 5)
    - "auth/session behavior is coupled to component presence and lifecycle rather than being owned by a smaller dedicated workflow/service boundary" (Priority 5)
    - success target: "auth and identity flows are less dependent on component presence" (Priority 5)

## Behavior Slices

### Slice 1A

Goal: define the minimal public contract for auth-service runtime ownership while preserving non-conflicting exploratory auth-service surfaces for later slices.

Items: C01

Type: behavior

### Slice 1B

Goal: lock the slice-1 runtime contract in tests before runtime implementation begins.

Items: T01

Type: behavior

### Slice 1C

Goal: move login-machine runtime lifecycle ownership into auth-service and expose it through the tested contract.

Items: C02

Type: behavior
