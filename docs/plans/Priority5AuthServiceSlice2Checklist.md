# Priority 5 Auth Service Slice 2 Checklist

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
- login, signup, guest-login, and logout command implementation
- request/outcome coordination for `CommentInput.svelte` and reply flows
- login-tab ownership and form-local field/validation UI concerns
- localStorage/session persistence extraction

## Slice Intent

This slice moves initial auth verification and authenticated-user publication into `auth-service` so session bootstrap no longer depends on `Login.svelte` side effects.

Execution note:

- maintainer preference requires three separate sessions for this slice:
  - export scaffold
  - fail-first tests
  - implementation to green
- if implementation cannot reach green without changing the tests, stop and discuss rather than modifying tests in the implementation session

## Atomic Checklist Items

- [x] C01 `[frontend]` Tighten the slice-2 public contract in `src/lib/auth-service.ts` so `currentUser`, `init`, and `CreateAuthServiceOptions.initialUser` are the explicit public surface for initial auth verification and authenticated-user publication, while preserving non-conflicting exploratory auth-service command and request/outcome surfaces unchanged.
  - Depends on: none.
  - Validated by: T01.
  - Trace:
    - "clarify boundaries between view components, state machines, and auth/workflow logic" (Priority 5)
    - "auth/session behavior is coupled to component presence and lifecycle rather than being owned by a smaller dedicated workflow/service boundary" (Priority 5)

- [x] T01 `[tests]` Add fail-first frontend tests for slice-2 init behavior in `src/tests/frontend/auth-service.init.test.ts` that prove `init()` drives auth bootstrap through `auth-service` rather than `Login.svelte`, calls `verifySelf()` when no `initialUser` is provided, transitions `sessionState` to `loggedIn` and publishes `currentUser` on successful verification, leaves `currentUser` undefined and transitions to `loggedOut` on `401` verification failure, leaves `currentUser` undefined and transitions to `error` on non-`401` verification failure, and defines the `initialUser` contract by proving whether `init()` skips `verifySelf()` when `initialUser` is supplied or still verifies and replaces it.
  - Depends on: C01.
  - Trace:
    - "UI modules are easier to test at the right boundary" (Priority 5)
    - "auth and identity flows are less dependent on component presence" (Priority 5)

- [x] C02 `[frontend]` Implement slice-2 bootstrap behavior in `src/lib/auth-service.ts` so `init()` owns the `verifySelf` auth API side effect, maps verification outcomes onto the live interpreted `src/lib/login.xstate.ts` runtime, and publishes `currentUser` from the service rather than from `Login.svelte`.
  - Depends on: T01.
  - Validated by: T01.
  - Trace:
    - "it performs auth-related API calls such as verify" (Priority 5)
    - "it performs mount/unmount side effects that influence app-level auth behavior" (Priority 5)
    - success target: "login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns" (Priority 5)

## Behavior Slices

### Slice 2A

Goal: make auth-service's public bootstrap contract explicit without expanding into login submission flows.

Items: C01

Type: behavior

### Slice 2B

Goal: lock the init verification and current-user publication contract in fail-first tests.

Items: T01

Type: behavior

### Slice 2C

Goal: move initial auth verification and current-user publication into auth-service runtime ownership.

Items: C02

Type: behavior
