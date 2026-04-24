# Priority 5 Auth Service Slice 7 Checklist

Status: planning

Classification: proposed implementation checklist draft (not approved)

Source plan: `docs/plans/Priority5Completion.md` (Item 7: Draft a slice for wiring `Login.svelte` to call `auth-service` commands)

## Scope Lock

In scope:

- wire `Login.svelte` auth actions through `auth-service` command methods instead of direct `src/apiClient.ts` calls
- keep form-local field state, field validation, selected-tab UI, selected-tab persistence, and status-message formatting in `Login.svelte`
- create a widget-scoped `AuthService` instance at the current widget composition root and thread it explicitly down the current render path to `Login.svelte`
- replace `Login.svelte` local auth-machine runtime ownership with reads from the service-owned auth runtime
- expose the minimal service-owned auth state metadata needed for `Login.svelte` to preserve the existing `loginStateStore` publication shape during the transition
- keep `CommentInput.svelte` and `SelfDisplay.svelte` working through the existing relay stores for now
- validate command delegation with fail-first tests before implementation

Out of scope:

- moving `simple_comment_user` persistence out of `Login.svelte`
- replacing `loginStateStore`, `dispatchableStore`, or `currentUserStore`
- removing relay behavior from `CommentInput.svelte` or `SelfDisplay.svelte`
- deciding the final broader auth-state exposure strategy for the whole widget beyond this explicit prop-threaded seam
- introducing a singleton auth-service import, a new event bus, an auth controller, or a runtime wrapper component
- splitting `Login.svelte` into smaller components
- changing backend/API contracts
- editing tests during an implementation pass; if fail-first tests cannot be made green through production-code changes only, stop and discuss

## Slice Intent

This slice removes the remaining direct auth command side effects from `Login.svelte` without reopening the large architecture churn that earlier Priority 5 planning flirted with. `auth-service` already owns the live auth runtime and the auth commands. `Login.svelte` should become the place that validates fields, gathers form input, chooses which auth command to invoke, and renders the resulting auth state, not the place that talks to auth endpoints directly.

The safe implementation path is to create a widget-scoped `AuthService` instance at the current composition root, thread it explicitly down the existing render path, and have `Login.svelte` delegate to it. That is narrower and safer than introducing a singleton or broad new store, and it does not decide the later direct-props versus thin-store question for every other auth-aware component.

Because `CommentInput.svelte` and `SelfDisplay.svelte` still depend on `loginStateStore`, this slice should preserve that store shape for now. The key constraint is to avoid two authoritative auth runtimes: `Login.svelte` should observe the service-owned auth state rather than continue interpreting its own auth machine.

## Atomic Checklist Items

- [ ] T01 `[tests]` Add fail-first frontend component tests for `Login.svelte` auth-service delegation in `src/tests/frontend/Login.auth-service.test.ts`.
  - Depends on: none.
  - [ ] T01.01 Add a fail-first test proving mount/init delegates the initial auth check through `authService.init()` rather than running direct `verifySelf()` logic inside `Login.svelte`.
  - [ ] T01.02 Add a fail-first test proving a valid login submission calls `authService.login({ userId, password })` with the current form values.
  - [ ] T01.03 Add a fail-first test proving a valid signup submission calls `authService.signup({ userId, password, displayName, email })` with the current form values.
  - [ ] T01.04 Add a fail-first test proving a valid guest submission calls `authService.loginGuest({ displayName, email })` when no explicit stored guest override is provided by the component.
  - [ ] T01.05 Add fail-first tests proving local validation failures still surface component-local errors and do not call `authService.login()`, `authService.signup()`, or `authService.loginGuest()`.
  - [ ] T01.06 Add a fail-first test proving logout intent delegates through `authService.logout()` only when logout is currently allowed by the observed auth state.
  - [ ] T01.07 Add fail-first tests proving `Login.svelte` no longer performs direct auth command calls to `postAuth`, `createUser`, `getGuestToken`, `createGuestUser`, `updateUser`, or `deleteAuth()` for the delegated flows covered by this slice.
  - [ ] T01.08 Add a fail-first test proving `Login.svelte` publishes the existing `loginStateStore` compatibility shape from observed service-owned auth state rather than from a second authoritative local auth runtime.
  - Trace:
    - "Draft a slice for wiring `Login.svelte` to call `auth-service` commands while keeping form-local state and field validation in `Login.svelte`." (`docs/plans/Priority5Completion.md`, Item 7)
    - "Already service-owned but still duplicated in `Login.svelte`: initial verification uses `verifySelf()` ... user login uses `postAuth(userId, userPassword)`; logout uses `deleteAuth()`." (`docs/plans/Priority5Completion.md`, Item 3 findings)
    - "Still not owned by `auth-service`: signup uses `createUser(userInfo)` ..." (`docs/plans/Priority5Completion.md`, Item 3 findings)
    - "Still not owned by `auth-service`: guest login flow reads stored guest credentials..." (`docs/plans/Priority5Completion.md`, Item 3 findings)

- [ ] C01 `[frontend]` Create a widget-scoped `AuthService` instance with `createAuthService()` at the current composition root and thread it explicitly through `src/components/SimpleComment.svelte`, `src/components/DiscussionDisplay.svelte`, and `src/components/CommentInput.svelte` into `src/components/Login.svelte`.
  - Depends on: T01.
  - Validated by: `yarn typecheck`.
  - Trace:
    - "Prefer direct `auth-service` API or a thin service-backed store; avoid introducing another ad-hoc event bus." (`docs/plans/Priority5Completion.md`, Item 12)
    - "Resolved the conditional in favor of moving session/guest persistence out of `Login.svelte`: auth/session continuity and guest reuse should not depend on the `Login.svelte` component being mounted." (`docs/plans/Priority5Completion.md`, Item 6 findings)

- [ ] C02 `[frontend]` Extend `src/lib/auth-service.ts` with the minimal readable auth-runtime metadata needed for `Login.svelte` to mirror the service-owned machine into the existing `loginStateStore` shape without running a second interpreted auth machine inside the component.
  - Depends on: T01.
  - Validated by: T01.
  - Trace:
    - "Relay coupling remains in `Login.svelte`: it subscribes to `dispatchableStore` and reacts to `loginIntent` / `logoutIntent` by driving its local machine." (`docs/plans/Priority5Completion.md`, Item 3 findings)
    - "Draft a slice for replacing `Login.svelte` shared-store publication with auth-service state subscriptions." (`docs/plans/Priority5Completion.md`, Item 8)

- [ ] C03 `[frontend]` Replace direct auth API calls and local auth-machine ownership in `src/components/Login.svelte` with `auth-service` command delegation and service-state subscriptions, while preserving component-local validation/UI behavior and the current `loginStateStore` publication contract for unreworked consumers.
  - Depends on: C01, C02.
  - Validated by: T01.
  - Trace:
    - "Draft a slice for wiring `Login.svelte` to call `auth-service` commands while keeping form-local state and field validation in `Login.svelte`." (`docs/plans/Priority5Completion.md`, Item 7)
    - "Keep explicitly out of scope: ... creating broad auth workflow modules, or redesigning frontend state architecture." (`docs/plans/Priority5Completion.md`, Item 14)
    - "login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns" (`docs/RepoHealthImprovementBacklog.md`, Priority 5)

## Behavior Slices

### Slice 7A

Goal: lock the `Login.svelte` command-delegation boundary in fail-first tests before implementation.

Items: T01

Type: behavior

### Slice 7B

Goal: make a widget-scoped auth-service instance explicitly available to `Login.svelte` without introducing a new global auth mechanism.

Items: C01

Type: mechanical

### Slice 7C

Goal: expose just enough service-owned runtime metadata to avoid a second authoritative auth machine inside `Login.svelte`.

Items: C02

Type: behavior

### Slice 7D

Goal: make `Login.svelte` a command-delegating/view component for auth while preserving its current validation/UI responsibilities and legacy store publication.

Items: C03

Type: behavior
