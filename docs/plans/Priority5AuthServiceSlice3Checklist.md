# Priority 5 Auth Service Slice 3 Checklist

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
- signup and guest-login command implementation
- request/outcome coordination for `CommentInput.svelte` and reply flows
- login-tab ownership and form-local field/validation UI concerns
- localStorage/session persistence extraction

## Slice Intent

This slice moves `login` and `logout` command ownership into `auth-service` so those auth API side effects no longer depend on `Login.svelte`.

Execution note:

- maintainer preference requires three separate sessions for this slice:
  - export scaffold
  - fail-first tests
  - implementation to green
- if implementation cannot reach green without changing the tests, stop and discuss rather than modifying tests in the implementation session

## Atomic Checklist Items

- [ ] C01 `[frontend]` Tighten the slice-3 public contract in `src/lib/auth-service.ts` so `login` and `logout` are the explicit slice-owned command surfaces for authenticated-session command ownership, while preserving non-conflicting exploratory `signup`, `loginGuest`, and request/outcome surfaces unchanged.
  - Depends on: none.
  - Validated by: T01, T02.
  - Trace:
    - "clarify boundaries between view components, state machines, and auth/workflow logic" (Priority 5)
    - "auth/session behavior is coupled to component presence and lifecycle rather than being owned by a smaller dedicated workflow/service boundary" (Priority 5)

- [ ] T01 `[tests]` Add fail-first frontend tests for `login` command ownership in `src/tests/frontend/auth-service.login.test.ts` that prove `auth-service.login()` owns the `postAuth` side effect, drives the live `src/lib/login.xstate.ts` runtime through the login success/error path rather than leaving the behavior in `Login.svelte`, publishes authenticated user state on successful login, and leaves `currentUser` undefined while transitioning to `error` on failed login.
  - Depends on: C01.
  - Trace:
    - "it performs auth-related API calls such as ... login" (Priority 5)
    - "UI modules are easier to test at the right boundary" (Priority 5)

- [ ] C02 `[frontend]` Implement `login` command ownership in `src/lib/auth-service.ts` so `login()` owns the `postAuth` side effect, maps success/error onto the live interpreted `src/lib/login.xstate.ts` runtime, and publishes authenticated user state from the service rather than from `Login.svelte`.
  - Depends on: T01.
  - Validated by: T01.
  - Trace:
    - "it performs auth-related API calls such as ... login" (Priority 5)
    - success target: "login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns" (Priority 5)

- [ ] T02 `[tests]` Add fail-first frontend tests for `logout` command ownership in `src/tests/frontend/auth-service.logout.test.ts` that prove `auth-service.logout()` owns the `deleteAuth` side effect, drives the live `src/lib/login.xstate.ts` runtime through the logout success/error path rather than leaving the behavior in `Login.svelte`, clears `currentUser` on successful logout, and transitions to `error` on failed logout.
  - Depends on: C01, C02.
  - Trace:
    - "it performs auth-related API calls such as ... logout" (Priority 5)
    - "UI modules are easier to test at the right boundary" (Priority 5)

- [ ] C03 `[frontend]` Implement `logout` command ownership in `src/lib/auth-service.ts` so `logout()` owns the `deleteAuth` side effect, maps success/error onto the live interpreted `src/lib/login.xstate.ts` runtime, and clears authenticated user state from the service rather than from `Login.svelte`.
  - Depends on: T02.
  - Validated by: T02.
  - Trace:
    - "it performs auth-related API calls such as ... logout" (Priority 5)
    - success target: "login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns" (Priority 5)

## Behavior Slices

### Slice 3A

Goal: make `login` and `logout` explicit auth-service command surfaces without expanding into signup, guest login, or consumer request/outcome seams.

Items: C01

Type: behavior

### Slice 3B

Goal: lock `login` command ownership in fail-first tests and then move the `postAuth` side effect into auth-service.

Items: T01, C02

Type: behavior

### Slice 3C

Goal: lock `logout` command ownership in fail-first tests and then move the `deleteAuth` side effect into auth-service.

Items: T02, C03

Type: behavior
