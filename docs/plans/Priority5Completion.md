# Priority 5 Completion Items

- 1. [x] Confirm completed baseline: `auth-service` owns login-machine runtime, initial verification, `login()`, and `logout()` behavior.

  Findings:

  - Confirmed for the `auth-service` service boundary: `src/lib/auth-service.ts` now creates and owns the live interpreted `loginMachine` runtime via `interpret(loginMachine)`.
  - Confirmed initial verification ownership: `authService.init()` calls `verifySelf()`, maps success / `401` / non-`401` outcomes onto the live login machine, and publishes `currentUser` from the service.
  - Confirmed `login()` command ownership: `authService.login()` calls `postAuth()`, verifies the resulting session with `verifySelf()`, maps success/error onto the live login machine, and publishes authenticated `currentUser` from the service.
  - Confirmed `logout()` command ownership: `authService.logout()` calls `deleteAuth()`, maps success/error onto the live login machine, clears `currentUser` on successful logout, and preserves `currentUser` on logout failure.
  - Validation evidence: `yarn test:frontend --runInBand src/tests/frontend/auth-service.test.ts src/tests/frontend/auth-service.init.test.ts src/tests/frontend/auth-service.login.test.ts src/tests/frontend/auth-service.logout.test.ts` passed with 4 suites and 12 tests passing.
  - Scope caveat: this confirms the service baseline only. `Login.svelte` still contains legacy direct auth side-effect handlers and has not yet been rewired to use `auth-service`; that remains future completion work.

- 2. [x] Archive or mark completed any finished auth-service slice docs so active planning only shows unfinished work.

  Findings:

  - Confirmed no `Priority5AuthServiceSlice*Checklist.md` files remain under `docs/plans/`.
  - Confirmed completed auth-service slice checklists are archived under `docs/archive/`: `Priority5AuthServiceSlice1Checklist.md`, `Priority5AuthServiceSlice2Checklist.md`, and `Priority5AuthServiceSlice3Checklist.md`.
  - Confirmed all checklist items in slices 1, 2, and 3 are checked.
  - Updated slice 1 and slice 2 archive headers from `Status: archived` to `Status: archived, completed` so they match the completed state already shown by their checked items.
  - Slice 3 was already marked `Status: archived, completed`.
  - Active planning surface is now clear for auth-service slices: future Priority 5 planning should start from this completion inventory rather than any stale active slice checklist.

- 3. [x] Identify remaining direct auth side effects in `Login.svelte`, limited to signup, guest login, guest profile update, session/localStorage handling, and shared-store publication.

  Findings:

  - Important caveat: the item wording is too narrow if read literally. `Login.svelte` still contains legacy direct calls for behaviors now owned by `auth-service`: `verifySelf()`, `postAuth()`, and `deleteAuth()`. These should not be treated as new service-surface work, but they must be removed when `Login.svelte` is rewired to call `auth-service`.
  - Already service-owned but still duplicated in `Login.svelte`: initial verification uses `verifySelf()` and writes `simple_comment_user`; user login uses `postAuth(userId, userPassword)`; logout uses `deleteAuth()`.
  - Still not owned by `auth-service`: signup uses `createUser(userInfo)` from the `signingUp` state handler. This is the cleanest next command-ownership candidate because it is simpler than guest login and already maps onto the existing `SIGNUP -> signedUp -> loggingIn` machine path.
  - Still not owned by `auth-service`: guest login flow reads stored guest credentials, attempts `postAuth(storedId, storedChallenge)`, calls `verifyUser()`, falls back to `getGuestToken()`, calls `verifyUser()` again, creates a guest with `createGuestUser(...)`, and sends success/error machine events.
  - Still not owned by `auth-service`: guest profile update uses `updateUser({ id: storedId, name: displayName, email: userEmail })` when stored guest identity differs from the submitted guest form values.
  - Session/localStorage handling remains in `Login.svelte`: login tab selection reads/writes `simple_comment_login_tab`; verified/current user state reads/writes `simple_comment_user`; guest login reads stored `simple_comment_user` to reuse guest credentials; mount logic hydrates form fields from stored user data.
  - Shared-store publication remains in `Login.svelte`: `currentUserStore.set(self)` runs on destroy and reactively; `loginStateStore.set({ state, nextEvents })` publishes machine state; `loginStateStore.set({ select: selectedIndex })` publishes selected tab state.
  - Relay coupling remains in `Login.svelte`: it subscribes to `dispatchableStore` and reacts to `loginIntent` / `logoutIntent` by driving its local machine. This is the component-side half of the later `CommentInput.svelte` / `SelfDisplay.svelte` decoupling work.
  - Recommendation: do not plan all of these as one implementation phase. Keep the next slice to one command surface, preferably `signup()` first, then guest login/profile update, then rewiring/removal of legacy verify/login/logout handlers from `Login.svelte`.

- 4. [x] Draft a slice for `signup()` command ownership in `auth-service`, with fail-first tests first and implementation in a separate pass.

  Findings:

  - Created `docs/plans/Priority5AuthServiceSlice4Checklist.md` as the proposed slice-4 checklist draft.
  - Kept the slice narrow: `signup()` command ownership in `auth-service` only.
  - Preserved the test/code separation convention: T01 adds fail-first tests, C01 implements production code later, and the checklist explicitly says implementation must stop if tests cannot be made green without changing tests.
  - Kept out of scope: `Login.svelte` UI rewiring, form-local signup validation, guest-login behavior, localStorage handling, shared-store publication, `CommentInput.svelte`, and `SelfDisplay.svelte`.
  - The proposed slice preserves current behavior intent: successful signup should create the user and continue through the existing post-signup login/session verification path to publish authenticated `currentUser`.

- 5. [x] Draft a slice for `loginGuest()` command ownership in `auth-service`, including existing guest-token, verify, create guest, and update-if-changed behavior.

  Findings:

  - Created `docs/plans/Priority5AuthServiceSlice5Checklist.md` as the proposed slice-5 checklist draft.
  - Kept the slice narrow: `loginGuest()` command ownership in `auth-service` only.
  - Captured the storage seam explicitly: preserving stored guest reuse requires stored guest `id`/`challenge`/profile data, but this slice should not move `localStorage` ownership into `auth-service`; the service contract should accept reusable stored guest identity as explicit command input/dependency.
  - Required reuse of existing `src/apiClient.ts` primitives: `postAuth`, `verifyUser`, `getGuestToken`, `createGuestUser`, `updateUser`, and `verifySelf`.
  - Preserved the test/code separation convention: C01 tightens the command contract, T01 adds fail-first tests, C02 implements production code later, and implementation must stop if tests cannot be made green without changing tests.
  - Kept out of scope: `Login.svelte` UI rewiring, guest form-local validation, `localStorage` extraction, shared-store publication, `CommentInput.svelte`, and `SelfDisplay.svelte`.

- 6. [x] Draft a slice for moving session/localStorage persistence out of `Login.svelte` only if it blocks service ownership or component decoupling.

  Findings:

  - Resolved the conditional in favor of moving session/guest persistence out of `Login.svelte`: auth/session continuity and guest reuse should not depend on the `Login.svelte` component being mounted.
  - Created `docs/plans/Priority5AuthServiceSlice6Checklist.md` as the proposed slice-6 checklist draft.
  - Kept the slice narrow: move only `simple_comment_user` session/guest persistence behind a small auth persistence boundary, then let `auth-service` consume that boundary through an injectable dependency.
  - Explicitly kept `simple_comment_login_tab` persistence out of scope because it is UI preference state owned by `Login.svelte`, not auth/session persistence.
  - Preserved server verification as the source of truth: persisted user data is cache/form/guest-reuse support, not authoritative authentication state.
  - Avoided broad architecture churn: no auth controller, no runtime component, no workflow module, no new event bus, and no `CommentInput.svelte` / `SelfDisplay.svelte` rewiring in this slice.

- 7. [x] Draft a slice for wiring `Login.svelte` to call `auth-service` commands while keeping form-local state and field validation in `Login.svelte`.

  Findings:

  - Created `docs/plans/Priority5AuthServiceSlice7Checklist.md` as the proposed slice-7 checklist draft.
  - Backed up and created `docs/plans/Priority5AuthServiceSlice7Plan.md` per `docs/norms/plan.md`, with explicit `Intent`, `Motivation`, scope boundaries, acceptance criteria, and validation strategy.
  - Kept the slice narrow: `Login.svelte` should stop calling auth APIs directly and instead delegate auth commands to `auth-service` while retaining form-local state, field validation, selected-tab UI, selected-tab persistence, and status-message rendering.
  - Chose the narrowest wiring seam: create a widget-scoped `AuthService` instance and thread it explicitly through the current component path rather than introducing a singleton import, new event bus, or broad store redesign.
  - Called out a key constraint explicitly: `Login.svelte` should not keep a second authoritative auth runtime once it is delegating to `auth-service`; it should observe service-owned auth state and preserve the existing `loginStateStore` publication shape only as transitional compatibility for unreworked consumers.
  - Kept item 8 and the relay-removal work out of scope: `CommentInput.svelte` and `SelfDisplay.svelte` still rely on `loginStateStore` / `dispatchableStore`, so slice 7 preserves those contracts rather than removing them prematurely.
  - The existing slice-7 checklist should now be treated as pre-plan draft input and reconciled to the approved slice-7 plan before it is used for implementation.

- 8. [x] Draft a slice for moving `Login.svelte` auth/session shared-store publication to a temporary widget-scoped `auth-service` bridge.

  Findings:

  - Created `docs/plans/Priority5AuthServiceSlice8Plan.md` and `docs/plans/Priority5AuthServiceSlice8Checklist.md` for the temporary bridge slice.
  - Confirmed the slice keeps the bridge widget-scoped at the current composition root and avoids making `auth-service.ts` import legacy global stores directly.
  - Confirmed all slice-8 checklist items are complete: fail-first bridge tests, bridge implementation, composition-root installation, `Login.svelte` tests, and removal of `Login.svelte` auth/session store publication.
  - Confirmed `Login.svelte` still owns selected-tab UI publication only, preserving the current unreworked relay consumers for later slices.
  - Validation evidence: `yarn run ci:local` passed after slice-8 implementation.

- 9. [x] Draft a slice for removing `dispatchableStore` / `loginStateStore` login relay behavior from `CommentInput.svelte`.

  Findings:

  - Created and approved `docs/plans/Priority5AuthServiceSlice9Plan.md` and `docs/plans/Priority5AuthServiceSlice9Checklist.md`.
  - Confirmed the slice used the existing widget-scoped `authService.authRequest` / `authOutcome` seam rather than introducing a new event bus or singleton service.
  - Implemented request-scoped auth outcomes in `auth-service` so pending comment-submit auth requests can complete with success or remote/local failure.
  - Updated `Login.svelte` to consume pending auth requests from `authService` while preserving form-local validation, direct form submissions, selected-tab publication, and the existing logout relay for Slice 10.
  - Removed `CommentInput.svelte` imports and use of `dispatchableStore` / `loginStateStore` for login-before-comment behavior.
  - Preserved selected-tab-dependent button copy and guest-comment validation through direct `Login.svelte` selected-tab binding.
  - Validation evidence: `yarn run ci:local` passed after Slice 9 implementation.

- 10. [x] Draft a slice for removing `dispatchableStore` / `loginStateStore` logout relay behavior from `SelfDisplay.svelte`.

  Findings:

  - Created and approved `docs/plans/Priority5AuthServiceSlice10Plan.md` and `docs/plans/Priority5AuthServiceSlice10Checklist.md`.
  - Confirmed the slice kept the logout-relay removal narrow: `SelfDisplay.svelte` now receives the widget-scoped `authService`, reads logout availability and processing state from `authService.authRuntimeSnapshot`, and calls `authService.logout()` directly.
  - Confirmed `src/components/SimpleComment.svelte` passes the existing widget-scoped `authService` to `SelfDisplay.svelte`.
  - Added `src/tests/frontend/components/SelfDisplay.auth-service.test.ts` component coverage for logout button visibility, direct `authService.logout()` delegation, processing skeleton visibility, and a source guard against legacy relay store imports.
  - Kept out-of-scope cleanup deferred: `Login.svelte` logout relay handling, legacy store definitions, and the temporary auth-service bridge remain for the planned cleanup slice.
  - Validation evidence: `yarn run ci:local` passed after Slice 10 implementation.

- 11. [ ] Draft a cleanup slice for removing the temporary auth-service bridge and any legacy auth/session store paths made obsolete by slices 8-10.

- 12. [ ] Decide whether auth state should be passed directly through component props or exposed through a thin auth-service-backed store.

- 13. [ ] Prefer direct `auth-service` API or a thin service-backed store; avoid introducing another ad-hoc event bus.

- 14. [ ] Add validation expectations per slice: fail-first tests in one pass, production implementation in a later pass, no test edits during implementation unless the implementation session stops and explains why the test is wrong.

- 15. [ ] Keep explicitly out of scope: splitting `Login.svelte` into form components, adding `auth-controller.ts`, adding `AuthRuntime.svelte`, creating broad auth workflow modules, or redesigning frontend state architecture.
