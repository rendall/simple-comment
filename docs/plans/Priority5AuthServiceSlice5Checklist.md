# Priority 5 Auth Service Slice 5 Checklist

Status: planning

Classification: proposed implementation checklist draft (not approved)

Source plan: `docs/plans/Priority5Completion.md` (Item 5: Draft a slice for `loginGuest()` command ownership in `auth-service`)

## Scope Lock

In scope:

- move `loginGuest()` command ownership into `src/lib/auth-service.ts`
- make `auth-service.loginGuest()` own the guest-auth side effects currently handled by `Login.svelte`
- preserve the existing guest reuse flow: when a stored guest id/challenge is available, authenticate it with `postAuth`, verify it with `verifyUser`, and update the guest profile when display name or email changed
- preserve the existing new-guest flow: fetch a guest token with `getGuestToken`, verify it with `verifyUser`, create the guest user with `createGuestUser`, then publish authenticated `currentUser`
- compose existing `src/apiClient.ts` exports (`postAuth`, `verifyUser`, `getGuestToken`, `createGuestUser`, `updateUser`, and `verifySelf`) rather than duplicating HTTP transport or response-resolution logic
- validate the service boundary with fail-first tests before implementation

Out of scope:

- changing backend/API contracts
- implementing custom fetch, auth header, guest-token, response-resolution, or user transport logic inside `auth-service`
- adding new auth/user API helpers outside `src/apiClient.ts`
- changing guest form-local field state or field-level validation UI in `Login.svelte`
- rewiring `Login.svelte` to call `auth-service.loginGuest()`
- moving `localStorage` reads/writes into `auth-service`
- changing `simple_comment_user` persistence semantics
- modifying `CommentInput.svelte`, `SelfDisplay.svelte`, or relay-store behavior
- editing tests during the implementation pass; if the fail-first tests cannot be made green through production-code changes only, stop and discuss

## Slice Intent

This slice moves guest-login command ownership into `auth-service` so guest authentication, guest creation, and guest profile update side effects no longer depend on `Login.svelte` state handlers.

The current `Login.svelte` flow reads stored guest identity from `localStorage`, then either reuses the stored guest credentials or creates a new guest. This slice should not silently move storage ownership into `auth-service`. Instead, the service contract should accept any reusable stored guest identity explicitly as command input/dependency, leaving storage extraction to a later slice if still needed.

`src/apiClient.ts` already exposes the API primitives needed for this slice:
`postAuth`, `verifyUser`, `getGuestToken`, `createGuestUser`, `updateUser`, and
`verifySelf`. `auth-service` should compose those primitives. If implementation
discovers a missing reusable guest/user API primitive, stop and propose adding it
to `src/apiClient.ts` rather than creating a one-off client inside
`auth-service`.

## Atomic Checklist Items

- [ ] C01 `[frontend]` Tighten the `loginGuest` public contract in `src/lib/auth-service.ts` so `GuestLoginPayload` can carry the submitted guest display name/email plus optional reusable stored guest identity (`id`, `challenge`, stored `name`, stored `email`) without making `auth-service` read from `localStorage`.
  - Depends on: none.
  - Validated by: T01.
  - Trace:
    - "guest login flow reads stored guest credentials, attempts `postAuth(storedId, storedChallenge)`, calls `verifyUser()`, falls back to `getGuestToken()`, calls `verifyUser()` again, creates a guest with `createGuestUser(...)`, and sends success/error machine events." (`docs/plans/Priority5Completion.md`, Item 3 findings)
    - "guest profile update uses `updateUser({ id: storedId, name: displayName, email: userEmail })` when stored guest identity differs from the submitted guest form values." (`docs/plans/Priority5Completion.md`, Item 3 findings)
    - "Draft a slice for `loginGuest()` command ownership in `auth-service`, including existing guest-token, verify, create guest, and update-if-changed behavior." (`docs/plans/Priority5Completion.md`, Item 5)

- [ ] T01 `[tests]` Add fail-first frontend tests for `loginGuest` command ownership in `src/tests/frontend/auth-service.login-guest.test.ts` proving `auth-service.loginGuest()` owns the stored-guest reuse path, fallback new-guest path, update-if-changed behavior, authenticated `currentUser` publication, and error handling.
  - Depends on: C01.
  - Required coverage:
    - stored guest with valid `id`/`challenge` calls `postAuth(storedId, storedChallenge)` and `verifyUser()`, does not call `getGuestToken()` or `createGuestUser()`, and publishes authenticated `currentUser`
    - stored guest with changed display name or email calls `updateUser({ id: storedId, name: displayName, email })`
    - missing stored guest credentials, or failed stored guest authentication, falls back to `getGuestToken()`, `verifyUser()`, and `createGuestUser({ id, name: displayName, email })`
    - guest-login failure leaves `currentUser` undefined and transitions to `error`
  - Trace:
    - "guest login flow reads stored guest credentials, attempts `postAuth(storedId, storedChallenge)`, calls `verifyUser()`, falls back to `getGuestToken()`, calls `verifyUser()` again, creates a guest with `createGuestUser(...)`, and sends success/error machine events." (`docs/plans/Priority5Completion.md`, Item 3 findings)
    - "UI modules are easier to test at the right boundary" (`docs/RepoHealthImprovementBacklog.md`, Priority 5)

- [ ] C02 `[frontend]` Implement `loginGuest` command ownership in `src/lib/auth-service.ts` so `loginGuest()` composes existing `src/apiClient.ts` guest/auth/user primitives, maps success/error onto the live interpreted `src/lib/login.xstate.ts` runtime, and publishes authenticated user state from the service rather than from `Login.svelte`.
  - Depends on: T01.
  - Validated by: T01.
  - Trace:
    - "guest login flow reads stored guest credentials, attempts `postAuth(storedId, storedChallenge)`, calls `verifyUser()`, falls back to `getGuestToken()`, calls `verifyUser()` again, creates a guest with `createGuestUser(...)`, and sends success/error machine events." (`docs/plans/Priority5Completion.md`, Item 3 findings)
    - "login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns" (`docs/RepoHealthImprovementBacklog.md`, Priority 5)

## Behavior Slices

### Slice 5A

Goal: define the guest-login command input contract without moving storage ownership into `auth-service`.

Items: C01

Type: behavior

### Slice 5B

Goal: lock guest-login command ownership and fallback/update behavior in fail-first tests before implementation.

Items: T01

Type: behavior

### Slice 5C

Goal: move stored-guest reuse, new-guest creation, and update-if-changed side effects into `auth-service`.

Items: C02

Type: behavior

