# Priority 5 Auth Service Slice 4 Checklist

Status: planning

Classification: proposed implementation checklist draft (not approved)

Source plan: `docs/plans/Priority5Completion.md` (Item 4: Draft a slice for `signup()` command ownership in `auth-service`)

## Scope Lock

In scope:

- move `signup()` command ownership into `src/lib/auth-service.ts`
- make `auth-service.signup()` own the `createUser` auth/account side effect currently handled by `Login.svelte`
- compose existing `src/apiClient.ts` exports (`createUser`, and the existing service-owned login/session verification path through `postAuth` / `verifySelf`) rather than duplicating HTTP transport or request-body encoding logic
- preserve the existing post-signup behavior path: successful signup proceeds through the login/auth verification path and publishes authenticated `currentUser`
- validate the service boundary with fail-first tests before implementation

Out of scope:

- changing backend/API contracts
- implementing custom fetch, auth header, response-resolution, or user transport logic inside `auth-service`
- adding new auth/user API helpers outside `src/apiClient.ts`
- changing signup form-local field state or field-level validation UI in `Login.svelte`
- rewiring `Login.svelte` to call `auth-service.signup()`
- moving guest-login, guest-profile-update, localStorage, or shared-store behavior
- modifying `CommentInput.svelte`, `SelfDisplay.svelte`, or relay-store behavior
- editing tests during the implementation pass; if the fail-first tests cannot be made green through production-code changes only, stop and discuss

## Slice Intent

This slice moves signup command ownership into `auth-service` so user creation and the follow-on authenticated-session transition no longer depend on `Login.svelte` state handlers.

The existing `Login.svelte` behavior creates the user, transitions the login machine through the signup success path, then continues into login/session verification. Slice 4 should preserve that behavior at the service boundary while keeping form-local validation and component rewiring out of scope.

`src/apiClient.ts` already exposes the API primitives needed for this slice:
`createUser` for account creation, `postAuth` for login/authentication, and
`verifySelf` for publishing the authenticated user. `auth-service` should
compose those primitives. If implementation discovers a missing reusable user
or auth API primitive, stop and propose adding it to `src/apiClient.ts` rather
than creating a one-off client inside `auth-service`.

## Atomic Checklist Items

- [x] T01 `[tests]` Add fail-first frontend tests for `signup` command ownership in `src/tests/frontend/auth-service.signup.test.ts` proving `auth-service.signup()` owns the `createUser` side effect via `src/apiClient.ts`, maps the service payload to the existing `createUser` input shape, drives the live `src/lib/login.xstate.ts` runtime through the signup success path, performs the existing post-signup authentication/verification continuation through existing `apiClient.ts` primitives, publishes authenticated `currentUser` on successful signup, and leaves `currentUser` undefined while transitioning to `error` on signup failure.
  - Depends on: none.
  - Trace:
    - "`Login.svelte` still contains legacy direct calls ... signup uses `createUser(userInfo)` from the `signingUp` state handler." (`docs/plans/Priority5Completion.md`, Item 3 findings)
    - "Draft a slice for `signup()` command ownership in `auth-service`, with fail-first tests first and implementation in a separate pass." (`docs/plans/Priority5Completion.md`, Item 4)
    - "UI modules are easier to test at the right boundary" (`docs/RepoHealthImprovementBacklog.md`, Priority 5)

- [ ] C01 `[frontend]` Implement `signup` command ownership in `src/lib/auth-service.ts` so `signup()` owns the `createUser` side effect by importing it from `src/apiClient.ts`, maps success/error onto the live interpreted `src/lib/login.xstate.ts` runtime, reuses the existing service-owned login/session verification path after successful signup, and publishes authenticated user state from the service rather than from `Login.svelte`.
  - Depends on: T01.
  - Validated by: T01.
  - Trace:
    - "`Login.svelte` still contains legacy direct calls ... signup uses `createUser(userInfo)` from the `signingUp` state handler." (`docs/plans/Priority5Completion.md`, Item 3 findings)
    - "Draft a slice for `signup()` command ownership in `auth-service`, with fail-first tests first and implementation in a separate pass." (`docs/plans/Priority5Completion.md`, Item 4)
    - "login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns" (`docs/RepoHealthImprovementBacklog.md`, Priority 5)

## Behavior Slices

### Slice 4A

Goal: lock the signup command ownership contract in fail-first tests before implementation.

Items: T01

Type: behavior

### Slice 4B

Goal: move the `createUser` signup side effect and post-signup auth/session continuation into `auth-service`.

Items: C01

Type: behavior
