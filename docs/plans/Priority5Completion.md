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

- 3. [ ] Identify remaining direct auth side effects in `Login.svelte`, limited to signup, guest login, guest profile update, session/localStorage handling, and shared-store publication.

- 4. [ ] Draft a slice for `signup()` command ownership in `auth-service`, with fail-first tests first and implementation in a separate pass.

- 5. [ ] Draft a slice for `loginGuest()` command ownership in `auth-service`, including existing guest-token, verify, create guest, and update-if-changed behavior.

- 6. [ ] Draft a slice for moving session/localStorage persistence out of `Login.svelte` only if it blocks service ownership or component decoupling.

- 7. [ ] Draft a slice for wiring `Login.svelte` to call `auth-service` commands while keeping form-local state and field validation in `Login.svelte`.

- 8. [ ] Draft a slice for replacing `Login.svelte` shared-store publication with auth-service state subscriptions.

- 9. [ ] Draft a slice for removing `dispatchableStore` / `loginStateStore` login relay behavior from `CommentInput.svelte`.

- 10. [ ] Draft a slice for removing `dispatchableStore` / `loginStateStore` logout relay behavior from `SelfDisplay.svelte`.

- 11. [ ] Decide whether auth state should be passed directly through component props or exposed through a thin auth-service-backed store.

- 12. [ ] Prefer direct `auth-service` API or a thin service-backed store; avoid introducing another ad-hoc event bus.

- 13. [ ] Add validation expectations per slice: fail-first tests in one pass, production implementation in a later pass, no test edits during implementation unless the implementation session stops and explains why the test is wrong.

- 14. [ ] Keep explicitly out of scope: splitting `Login.svelte` into form components, adding `auth-controller.ts`, adding `AuthRuntime.svelte`, creating broad auth workflow modules, or redesigning frontend state architecture.
