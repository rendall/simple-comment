# Priority 5 Frontend Architecture Decoupling Checklist

Status: planning

Classification: proposed implementation checklist draft (not approved)

Source plan: `docs/plans/Priority5FrontendArchitectureDecouplingPlan.md`

## Scope Lock (from Source Plan)

In scope:

- reduce component-bound behavior coupling where the repo already flags it as a concern
- clarify boundaries between view components, state machines, and auth/workflow logic

Success signals to satisfy:

- auth and identity flows are less dependent on component presence
- UI modules are easier to test at the right boundary
- future frontend upgrades require less behavioral archaeology
- login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns

Out of scope:

- changing backend/API contracts
- introducing auth feature behavior changes beyond boundary ownership refactor
- unrelated frontend architecture rewrites outside login/auth surfaces

Implementation stance for this checklist:

- auth ownership is scoped to the current `SimpleComment` instance, not page-global
- components should read auth state through published stores/snapshots and trigger auth behavior through narrow controller commands
- new auth-facing types should come from existing canonical shared types where possible; introduce `src/lib/auth/auth-types.ts` only if an auth-local type has no clear existing home

Behavior parity that must be preserved:

- session restore on startup
- login tab persistence
- username/password login
- signup
- guest login
- logout
- profile read/update flow
- auth state availability when `Login.svelte` is not mounted
- no backend/API contract changes

## Parity Matrix (Execution Guardrail)

These parity IDs are the behavioral source of truth for implementation review. During execution, failing tests must be classified against this matrix before code or tests are changed.

| ID | Contract |
| --- | --- |
| P01 | Session restore on startup: if stored auth/session data exists and verification succeeds, the user is restored without requiring an explicit login action. |
| P02 | Login tab persistence: the selected login mode/tab persists across reloads according to current storage behavior. |
| P03 | Username/password login: an unauthenticated user can log in, is verified, self data is fetched, and authenticated actions work afterward. |
| P04 | Signup: a new user can sign up successfully, and invalid signup states preserve current behavior. |
| P05 | Guest login: an unauthenticated guest flow still acquires guest auth, creates/fetches guest user state, and allows comment/reply submission. |
| P06 | Logout: an authenticated user can log out and returns to unauthenticated UI/state. |
| P07 | Profile read/update flow: authenticated self/profile state remains readable and profile update behavior remains intact. |
| P08 | Auth lifecycle independent of `Login.svelte`: auth verification/session restore still works when the runtime is mounted but `Login.svelte` is not rendered at startup. |
| P09 | No backend/API contract change: frontend decoupling does not change endpoint shape, sequencing assumptions, or payload semantics. |
| P10 | Consumer behavior parity: `CommentInput` and `SelfDisplay` preserve current user-visible behavior after relay-event decoupling. |

Test-change rule during implementation:

- Treat failing tests as evidence, not as the contract itself.
- Classify each failing test as one of:
  - `regression`: the implementation broke a listed parity contract
  - `stale test`: the test asserted implementation detail rather than a listed parity contract
  - `ambiguous`: the checklist/parity matrix does not clearly answer whether the behavior should change
- Do not change a failing test unless it can be justified against this parity matrix.
- If classification lands on `ambiguous`, stop and document the decision boundary before proceeding.

## Current Cypress Contract Coverage

The current Cypress suite should be treated as black-box contract evidence for existing auth behavior, but not as the sole source of truth.

Well covered now:

- `P01` by `cypress/e2e/generic/auto-login.cy.js`
- `P03` by `cypress/e2e/generic/login.cy.js`
- `P04` by `cypress/e2e/generic/signup.cy.js`
- `P05` by `cypress/e2e/generic/public-comment.cy.js` and `cypress/e2e/generic/reply.cy.js`
- `P06` by `cypress/e2e/generic/logout.cy.js`
- `P09` partially by existing `cy.intercept(...)` assertions in the auth-related specs

Partially covered:

- `P07` profile read behavior is indirectly covered by authenticated self-display assertions; profile update behavior is not yet covered
- `P10` is indirectly covered by login/comment/reply/logout user-visible flows, but not by an explicit decoupling-focused assertion set

Weak or missing coverage:

- `P02` login tab persistence
- `P07` profile update flow
- `P08` auth lifecycle when `Login.svelte` is not mounted at startup

Implementation guardrail for Cypress work:

- Existing Cypress auth specs should stay green unless a parity-matrix-backed reason for change is recorded.
- Avoid opportunistic selector churn; preserve current selectors where feasible during this checklist.
- If selector changes become necessary to preserve a parity contract, document the reason in validation notes rather than silently rewriting tests “to get green.”
- If additional coverage is needed for `P02`, `P07`, or `P08`, add it only as part of the approved validation scope for this checklist.

## Explicit Duplication Guardrails

These existing systems are at elevated risk of accidental duplication during Priority 5. Implementation must extract from or reuse them; it must not recreate them under new names.

- `src/components/Login.svelte`
  - implementation must treat this file as the extraction source for current auth orchestration, persistence wiring, error mapping, and guest-auth sequencing
  - if a planned module cannot extract or relocate one of these concerns cleanly, implementation must stop and explain rather than reimplementing the logic from scratch
- `src/lib/login.xstate.ts`
  - implementation must use this file as the auth state-machine source of truth
  - implementation must not create a second controller-owned state model that duplicates machine semantics
- `src/lib/svelte-stores.ts`
  - implementation must use, wrap, relocate, or re-export the existing auth-related stores from this module
  - implementation must not create a parallel auth store family beside `currentUserStore`, `loginStateStore`, and `dispatchableStore`
- `src/frontend-utilities.ts` and `src/lib/shared-utilities.ts`
  - implementation must not introduce a third validation layer for auth/user-id/email/display-name rules
  - implementation must extract, unify, or reuse the existing validation helpers and must stop and explain if the existing helpers cannot be reused safely
- `src/simple-comment.ts` and `src/components/SimpleComment.svelte`
  - implementation must integrate runtime ownership with the existing widget bootstrap and lifecycle boundaries
  - implementation must not introduce a second bootstrap or mount path for auth
- `src/apiClient.ts`
  - implementation must use the existing auth-facing client functions for transport and response handling
  - implementation must not duplicate request sequencing, response parsing, or auth endpoint semantics in workflow/controller code

## Atomic Checklist Items

### Reviewer-Requested Explicit Export Contracts (C01-C03)

To remove ambiguity, C01-C03 must include the following concrete exports:

- C01 `auth-storage.ts` exports:
  - `AUTH_STORAGE_KEYS`
  - `readStoredSession`, `writeStoredSession`
  - `readStoredLoginTab`, `writeStoredLoginTab`
  - `clearStoredAuthState`
- C02 `auth-workflows.ts` exports:
  - `verifySessionWorkflow`, `loginWorkflow`, `signupWorkflow`
  - `guestLoginWorkflow`, `logoutWorkflow`, `updateProfileWorkflow`
  - `toAuthWorkflowError`
- C03 `auth-controller.ts` exports:
  - `createAuthController`
  - returned controller contract includes `subscribe`, `getSnapshot`, `init`, `login`, `signup`, `guestLogin`, `logout`, `setTab`, `destroy`

### C01-C03 File Contract Definitions (Quick Reference)

This section is a reviewer-facing summary so contracts are visible without scanning each checklist item body.

| Item | File | Required named exports |
| --- | --- | --- |
| C01 | `src/lib/auth/auth-storage.ts` | `AUTH_STORAGE_KEYS`, `readStoredSession`, `writeStoredSession`, `readStoredLoginTab`, `writeStoredLoginTab`, `clearStoredAuthState` |
| C02 | `src/lib/auth/auth-workflows.ts` | `verifySessionWorkflow`, `loginWorkflow`, `signupWorkflow`, `guestLoginWorkflow`, `logoutWorkflow`, `updateProfileWorkflow`, `toAuthWorkflowError` |
| C03 | `src/lib/auth/auth-controller.ts` | `createAuthController` (returns `AuthController` with `subscribe`, `getSnapshot`, `init`, `login`, `signup`, `guestLogin`, `logout`, `setTab`, `reset`, `destroy`) |

- [x] C01 `[frontend]` Create `src/lib/auth/auth-storage.ts` to centralize `localStorage` reads/writes for login/session persistence keys currently embedded in `Login.svelte`.
  - Depends on: none.
  - Validated by: T01, T03.
  - Contract + exports:
    - `AUTH_STORAGE_KEYS`: readonly key map for `"simple_comment_user"` and `"simple_comment_login_tab"`.
    - `type StoredAuthSession = { user: SimpleCommentUser | null }`.
    - `type StoredLoginTab = "login" | "signup" | "guest"`.
    - `readStoredSession(): StoredAuthSession | null` (never throws on malformed JSON; returns `null` fallback).
    - `writeStoredSession(session: StoredAuthSession | null): void`.
    - `readStoredLoginTab(): StoredLoginTab` (returns safe default, e.g. `"login"`).
    - `writeStoredLoginTab(tab: StoredLoginTab): void`.
    - `clearStoredAuthState(): void` (removes both keys).
    - Existing persisted values must remain readable; this item does not introduce a storage schema migration.
  - Trace:
    - "extract login/session persistence currently embedded in `Login.svelte`" (In Scope)
    - "`Login.svelte` no longer owns auth persistence" (Acceptance Criteria)

- [x] C02 `[frontend]` Create `src/lib/auth/auth-workflows.ts` to orchestrate auth workflows by composing existing `src/apiClient.ts` functions (no duplicated transport/client logic) and normalizing workflow-level error/result handling currently mixed in component handlers.
  - Depends on: C01.
  - Validated by: T01, T03.
  - Contract + exports:
    - `type AuthWorkflowResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: number }`.
    - `verifySessionWorkflow(): Promise<AuthWorkflowResult<VerifiedUser>>`.
    - `loginWorkflow(credentials: { username: string; password: string }): Promise<AuthWorkflowResult<LoginPayload>>`.
    - `signupWorkflow(input: SignupPayload): Promise<AuthWorkflowResult<SignupPayload>>`.
    - `guestLoginWorkflow(input: { name: string; email: string }): Promise<AuthWorkflowResult<LoginPayload>>`.
    - `logoutWorkflow(): Promise<AuthWorkflowResult<{ loggedOut: true }>>`.
    - `updateProfileWorkflow(input: UpdateUserPayload): Promise<AuthWorkflowResult<UpdatedUser>>`.
    - `toAuthWorkflowError(error: unknown): { error: string; code?: number }` (shared normalization helper).
    - All workflow functions must call `src/apiClient.ts` exports rather than implementing transport logic directly.
    - Type sourcing rule:
      - prefer existing canonical types from `src/lib/simple-comment-types.ts` and existing `src/apiClient.ts` result shapes
      - if a workflow-local type has no clear existing home, add it once in `src/lib/auth/auth-types.ts` rather than redefining it per file
    - Error normalization rule:
      - preserve current user-visible behavior by normalizing transport/API errors into existing message semantics rather than inventing new UX wording in this checklist
  - Trace:
    - "extract auth-related API orchestration currently embedded in `Login.svelte`" (In Scope)
    - "Auth workflow orchestration is moved into dedicated frontend modules that reuse existing `apiClient.ts`" (Acceptance Criteria)

- [x] C03 `[frontend]` Create `src/lib/auth/auth-controller.ts` that centralizes (does not remove) `loginMachine` orchestration and transition/effect execution outside `Login.svelte`; keep `src/lib/login.xstate.ts` as the state-machine source of truth and expose typed commands (`init`, `login`, `signup`, `guestLogin`, `logout`, `setTab`) plus subscription API.
  - Depends on: C02.
  - Validated by: T01, T03.
  - Contract + exports:
    - `type AuthControllerSnapshot = { state: LoginMachineState; context: LoginMachineContext; uiTab: StoredLoginTab; nextEvents: string[]; currentUser?: User; message?: string; error?: string }`.
    - `type AuthController = {`
      - `subscribe(run: (snapshot: AuthControllerSnapshot) => void): () => void`
      - `getSnapshot(): AuthControllerSnapshot`
      - `init(): Promise<void>`
      - `login(input: { username: string; password: string }): Promise<void>`
      - `signup(input: SignupPayload): Promise<void>`
      - `guestLogin(input: { name: string; email: string }): Promise<void>`
      - `logout(): Promise<void>`
      - `setTab(tab: StoredLoginTab): void`
      - `reset(): void`
      - `destroy(): void`
      - `}`
    - `createAuthController(deps?: AuthControllerDeps): AuthController` as the module factory export.
    - `createAuthController` owns machine interpreter lifecycle but does not redefine `loginMachine`.
    - Extraction rule:
      - this item must extract and relocate the existing auth orchestration now embedded in `Login.svelte`
      - this item must not introduce a second independent auth controller model alongside the current logic
      - if a helper already exists in the repo and matches the needed behavior, this item must reuse it rather than duplicate it under a new name
    - Ownership rule:
      - controller instances are scoped to the current `SimpleComment` instance, not page-global singletons
    - Concurrency rule:
      - `init()` must be safe to call once during startup and safe against duplicate startup invocation
      - command methods must preserve current behavior if called while another auth workflow is active; if current behavior is ambiguous, stop and document the boundary before broadening semantics
  - Trace:
    - "`src/lib/login.xstate.ts` must remain the state-machine source of truth for this phase." (Constraints)
    - "clarify boundaries between view components, state machines, and auth/workflow logic" (In Scope)

- [x] C04 `[frontend]` Add `src/lib/auth/auth-stores.ts` and migrate login/session shared-state publication out of `Login.svelte` reactive blocks into controller-owned store updates.
  - Depends on: C03.
  - Validated by: T01, T03.
  - Contract:
    - this file is the publication boundary for auth-related shared state
    - this file must become the single place where controller-owned auth state is published for consumers
    - this item must reuse, wrap, relocate, or re-export the existing auth-related stores from `src/lib/svelte-stores.ts`
    - this item must not create a second parallel auth store family that duplicates `currentUserStore`, `loginStateStore`, or `dispatchableStore` semantics without retiring or folding those semantics into the new boundary in the same slice
    - if implementation reveals that reuse or relocation of the existing auth-related stores is not viable, implementation must stop and document why before introducing a replacement shape
    - this item does not introduce a new page-global auth singleton
  - Trace:
    - "centralize auth-related shared-state publication behind one auth boundary" (In Scope)
    - "Auth workflow orchestration is moved into dedicated frontend modules that reuse existing ... auth-store surfaces instead of duplicating them." (Acceptance Criteria)

- [x] C05 `[frontend]` Refactor `src/components/Login.svelte` into render-focused container + child form components (`src/components/auth/LoginForm.svelte`, `SignupForm.svelte`, `GuestForm.svelte`) that emit intent payloads to the controller.
  - Depends on: C03, C04.
  - Validated by: T02, T03.
  - Boundary rule:
    - `Login.svelte` may keep view-local rendering concerns such as tab selection presentation, helper text presentation, and wiring child-form submit intents to controller commands
    - `Login.svelte` should no longer own storage reads/writes, direct auth API orchestration, or machine-interpreter lifecycle
  - Trace:
    - "Reduce auth/login coupling to component presence by moving auth persistence, workflow orchestration, and shared-state publication out of `Login.svelte`" (Goal)
    - "`Login.svelte` no longer owns auth persistence, direct auth API orchestration, or auth machine lifecycle." (Acceptance Criteria)

- [x] C06 `[frontend]` Add `src/lib/auth/auth-runtime.ts` and wire it into `src/components/SimpleComment.svelte` lifecycle so auth verification/session lifecycle runs independently of `Login.svelte` visibility.
  - Depends on: C03, C04.
  - Validated by: T02, T03.
  - Runtime rule:
    - runtime ownership is scoped to the current `SimpleComment` instance
    - the runtime lives in plain TypeScript rather than a non-visual Svelte component
    - `SimpleComment.svelte` (or the immediate widget lifecycle boundary) is responsible for starting and tearing down the runtime for that instance
    - this item must integrate with the existing widget lifecycle in `src/simple-comment.ts` and `src/components/SimpleComment.svelte` rather than creating a second bootstrap or mount path
    - this item must not duplicate app bootstrap, widget initialization, or component mount responsibilities that already exist outside auth
  - Trace:
    - "centralize auth controller/runtime ownership outside `Login.svelte`" (In Scope)
    - "Auth controller/runtime ownership is scoped to the current `SimpleComment` instance and does not depend on `Login.svelte` being the lifecycle owner." (Acceptance Criteria)

- [ ] C07 `[frontend]` This item is superseded by `C09-C10`; keep this item as the original discovery point, but do not implement it directly.
  - Original item text:
    - Update `src/components/CommentInput.svelte` to consume the controller/store interface instead of relay login events (`loginIntent`) and ad-hoc cross-machine synchronization.
  - Depends on: C04, C06.
  - Validated by: T03.
  - Consumer-boundary rule:
    - consumer components should read auth state from the published auth store/snapshot boundary
    - consumer components may call narrow controller commands only when they need to trigger auth behavior
    - this item should not recreate relay-event coupling under a different name
  - Trace:
    - "migrate `CommentInput.svelte` ... off relay-event coupling (`loginIntent` / `logoutIntent`) onto the new controller/store boundary" (In Scope)
    - "`CommentInput.svelte` ... no longer depend on legacy relay-event coupling as their primary auth coordination mechanism." (Acceptance Criteria)

- [x] C08 `[frontend]` Update `src/components/SelfDisplay.svelte` to consume the controller/store interface instead of relay logout events (`logoutIntent`) and direct dependency on legacy login-state relay semantics.
  - Depends on: C04, C06.
  - Validated by: T03.
  - Consumer-boundary rule:
    - consumer components should read auth state from the published auth store/snapshot boundary
    - consumer components may call narrow controller commands only when they need to trigger auth behavior
    - this item should not recreate relay-event coupling under a different name
  - Trace:
    - "migrate `CommentInput.svelte` and `SelfDisplay.svelte` off relay-event coupling (`loginIntent` / `logoutIntent`) onto the new controller/store boundary" (In Scope)
    - "`CommentInput.svelte` and `SelfDisplay.svelte` no longer depend on legacy relay-event coupling as their primary auth coordination mechanism." (Acceptance Criteria)

Implementation note:

- C07 exposed a previously unmodeled requirement: removing `loginIntent` cleanly from `CommentInput.svelte` requires a small instance-scoped auth UI intent/state boundary. `C09-C10` capture that discovered requirement without redefining completed items.

- [ ] C09 `[frontend]` Add instance-scoped auth UI intent/state to the existing auth controller/store boundary so components can request auth UI behavior without dispatching relay login events or directly calling `Login.svelte`.
  - Depends on: C06.
  - Validated by: T03.
  - Contract:
    - this item must keep auth UI intent/state scoped to the current `SimpleComment` instance
    - this item must reuse the existing auth runtime/controller/store boundary rather than introducing a page-global singleton or a second event bus
    - this item must publish only the narrow UI intent/state needed for cross-component coordination, such as preferred auth tab and auth request reason
    - this item must not move login/signup/guest form field ownership out of `Login.svelte`
    - if implementation reveals that the existing auth boundary cannot carry this UI intent/state cleanly, implementation must stop and document why before introducing a new shape
  - Trace:
    - "clarify boundaries between view components, state machines, and auth/workflow logic" (In Scope)
    - "auth and identity flows are less dependent on component presence" (Success signals)

- [ ] C10 `[frontend]` Update `src/components/CommentInput.svelte` to use the instance-scoped auth UI intent/state boundary from C09 instead of `loginIntent` relay dispatch when comment submission requires authentication.
  - Depends on: C09.
  - Validated by: T03.
  - Consumer-boundary rule:
    - this item must remove `dispatchableStore.dispatch("loginIntent")` usage from `CommentInput.svelte`
    - this item must not make `CommentInput.svelte` own login/signup/guest form payload state
    - this item must not directly call `Login.svelte`
    - this item must preserve current user-visible behavior for comment submission and auth-required transitions
  - Trace:
    - "migrate `CommentInput.svelte` ... off relay-event coupling (`loginIntent` / `logoutIntent`) onto the new controller/store boundary" (In Scope)
    - "`CommentInput.svelte` ... no longer depend on legacy relay-event coupling as their primary auth coordination mechanism." (Acceptance Criteria)

- [ ] T01 `[validation]` Add unit tests for `auth-controller` transition/effect mapping (verify/login/signup/guest/logout/error) with mocked `auth-workflows` and `auth-storage`.
  - Depends on: C03.
  - Trace:
    - "Unit evidence: Add controller-focused tests that cover verify/login/signup/guest/logout/error transition and effect mapping." (Validation Strategy)

- [ ] T02 `[validation]` Add integration tests proving auth lifecycle works when `Login.svelte` is not mounted at startup (runtime mounted only), while interactive login still works once `Login.svelte` is rendered.
  - Depends on: C05, C06.
  - Harness rule:
    - test the plain runtime/controller lifecycle boundary explicitly rather than relying only on full-page behavior
  - Trace:
    - "Integration evidence: Add integration coverage proving auth lifecycle works when `Login.svelte` is not mounted at startup, while interactive login still works once `Login.svelte` is rendered." (Validation Strategy)

- [ ] T03 `[validation]` Run focused frontend validation and auth smoke coverage (login/signup/guest/logout happy-path + one error-path), then record parity notes against current behavior.
  - Depends on: C08, C09, C10, T01, T02.
  - Validation guardrail:
    - classify failing auth-related tests against `P01`-`P10` before changing code or tests
    - keep existing Cypress auth coverage green unless a parity-matrix-backed test update is explicitly documented in validation notes
  - Trace:
    - "Smoke evidence: Run focused frontend validation covering login/signup/guest/logout happy-path flows plus at least one error path." (Validation Strategy)
    - "Contract/parity evidence: Preserve and use the Priority 5 parity matrix (`P01-P10`) as the behavioral source of truth during implementation." (Validation Strategy)

## Behavior Slices

### Slice A

- Goal: extract non-UI auth persistence and API side effects from `Login.svelte`.
- Items: C01, C02.
- Type: mechanical.

### Slice B

- Goal: move auth workflow ownership from `Login.svelte` into controller/runtime lifecycle owned by the current widget instance.
- Items: C03, C04, C06.
- Type: behavior.

### Slice C

- Goal: reduce `Login.svelte` to presentation + intent dispatch.
- Items: C05.
- Type: behavior.

### Slice D

- Goal: decouple consumer components from relay-event coupling with incremental, lower-risk migration.
- Items: C07, C08, C09, C10.
- Type: behavior.

### Slice E

- Goal: validate decoupling boundaries and behavior parity.
- Items: T01, T02, T03.
- Type: behavior.

## Conformance QC (Checklist Norms)

Missing from plan:

- none identified for current Priority 5 scope.

Extra beyond plan:

- none; items are restricted to login/auth decoupling surfaces.

Atomicity fixes needed:

- resolved by splitting prior combined consumer migration into C07 (`CommentInput`) and C08 (`SelfDisplay`) so each item is independently committable.

Validation mapping gaps:

- none identified; each C-item is validated by direct dependency on T-items or behavior-parity evidence.

Pass/Fail: checklist achieves plan goals:

- Pass (for draft readiness; execution remains blocked until explicit checklist approval).
