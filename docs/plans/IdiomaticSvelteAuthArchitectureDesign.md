**Design Doc**

**Title**
Idiomatic Svelte Auth Architecture for Simple Comment

**Status**
Conceptual design only. No implementation implied.

**Goal**
Make auth state, auth actions, and auth-request outcomes available through one widget-scoped Svelte boundary so components coordinate through shared state rather than relay events, incidental mount effects, or partial adapter stores.

**Success Criteria**
Success means:
- auth lifecycle does not depend on `Login.svelte`
- `Login.svelte` remains a UI/form component
- `CommentInput.svelte` and `SelfDisplay.svelte` consume the same auth boundary
- local validation failure, remote auth failure, and auth success are all explicit and observable
- no component needs another component to be mounted in order for auth to work
- no module-global auth state is required for widget-local behavior

**Non-Goals**
This design does not require:
- multi-widget support
- removal of XState
- replacement of the existing auth workflows or API client
- a visual redesign of the login UI
- introducing Svelte Testing Library immediately

**Design Principles**
- Prefer Svelte `context` for subtree-scoped shared state.
- Prefer Svelte stores for published reactive state.
- Keep form-local state local to the form component.
- Keep async workflow orchestration in plain TypeScript.
- Use one public auth boundary, not two parallel ones.
- Make outcome state explicit rather than inferred from timing or UI side effects.

**High-Level Shape**
Each mounted `SimpleComment` instance creates one auth model.
That auth model is placed into Svelte context at the widget root.
Descendant components consume that auth model through a single hook, for example `useAuth()`.

The auth model exposes:
- readable stores for auth state
- narrow command methods for auth actions
- readable request/outcome state for auth-required flows

This is the Svelte-native equivalent of “controller plus runtime,” but shaped around context and stores rather than around a separate controller API plus adapter stores.

**Core Architecture**
**1. Widget-Scoped Auth Model**
At widget startup, `SimpleComment.svelte` creates an auth model.

That model owns:
- lifecycle initialization
- current auth state
- current user
- selected login tab
- auth UI request state
- last auth request outcome
- actions like login, signup, guest login, logout

It is destroyed with the widget.

This avoids:
- module-global auth state
- hidden coupling between unrelated components
- dependence on render order

**2. Svelte Context as the Distribution Mechanism**
`SimpleComment.svelte` calls `setContext(...)` with the auth model.
Consumers call `getContext(...)` through a helper like `useAuth()`.

Why this is idiomatic:
- all auth-aware components are in the same subtree
- the state is widget-scoped, not app-global
- components do not need parent prop threading
- unrelated siblings do not need direct references to each other

**3. Stores as the Published Read Boundary**
The auth model publishes Svelte stores such as:
- `authState`
- `currentUser`
- `selectedTab`
- `authRequest`
- `authOutcome`

These are readable stores from the component perspective.

A component can subscribe reactively to:
- whether the user is logged in
- whether an auth request is pending
- whether the last request failed locally
- whether the last request failed remotely
- whether auth succeeded

This is cleaner than a partial `loginStateStore`, because the store boundary is the canonical boundary.

**4. Plain TS Actions as the Write Boundary**
The same auth model exposes methods like:
- `init()`
- `login(payload)`
- `signup(payload)`
- `guestLogin(payload)`
- `logout()`
- `requestAuth(options)`
- `clearAuthOutcome()`

These methods call the existing workflows and machine orchestration internally.

Components do not call each other.
Components do not dispatch relay events.
Components only:
- read stores
- call actions

**State Model**
A clean state model would separate three concerns.

**A. Auth Session State**
Examples:
- `idle`
- `verifying`
- `loggedOut`
- `loggingIn`
- `loggedIn`
- `loggingOut`
- `error`

This is the durable auth lifecycle state.

**B. Auth UI State**
Examples:
- selected tab
- whether auth UI is currently requested/open
- why auth was requested, such as `comment-submit` or `reply-submit`

This is not the same as auth session state.
It exists to coordinate UI across components.

**C. Auth Request Outcome State**
This is the missing seam in the current design.
It should explicitly represent the result of a specific auth request.

Examples:
- `none`
- `pending`
- `localValidationError`
- `remoteAuthError`
- `success`
- `cancelled`

Optionally, it may include:
- a request id
- a reason
- field-level metadata
- an error message

This allows `CommentInput.svelte` to know whether to remain blocked or recover.

**Component Responsibilities**
**`SimpleComment.svelte`**
Responsibilities:
- create the auth model
- place it in context
- run `init()` on mount
- render children

It should not interpret auth behavior beyond widget-level setup.

**`Login.svelte`**
Responsibilities:
- own auth form fields
- own field-level validation UI
- render helper/status messages
- call auth model actions on submit
- reflect shared auth/UI/outcome state as needed

It should not own:
- auth lifecycle initialization
- session restore policy
- cross-component coordination logic
- relay/event bus behavior

**`CommentInput.svelte`**
Responsibilities:
- own comment text and comment-post machine
- request auth when comment submission requires it
- observe auth outcome state
- recover cleanly from:
  - local validation failure
  - remote auth failure
  - auth success

It should not:
- depend on `Login.svelte` being mounted to infer auth behavior
- own auth form payload state
- call `Login.svelte` directly

**`SelfDisplay.svelte`**
Responsibilities:
- observe current user/auth state
- render self information
- call logout action

It should not need a separate legacy store adapter.

**Workflow of a Typical Auth-Required Comment Submit**
1. User submits a comment while unauthenticated.
2. `CommentInput.svelte` calls `auth.requestAuth({ reason: "comment-submit" })`.
3. Auth model updates:
   - `authRequest = pending`
   - `authUiState` marks auth as requested
4. `Login.svelte` reacts and presents the correct form/tab.
5. User submits guest/login/signup.
6. `Login.svelte` validates locally.
7. If local validation fails:
   - field-level UI updates stay inside `Login.svelte`
   - auth model publishes `authOutcome = localValidationError`
8. `CommentInput.svelte` sees `localValidationError` and leaves its blocked state.
9. If local validation passes:
   - auth model executes workflow
   - on success publishes `authOutcome = success`
   - on remote failure publishes `authOutcome = remoteAuthError`
10. `CommentInput.svelte` reacts accordingly:
   - success -> continue posting
   - failure -> recover and remain interactive

This is the crucial difference from the current seam.
The requesting component no longer has to infer failure from whether some other component set a status message.

**Why This Is More Idiomatic Than the Current Path**
The current path is incremental and valid, but it mixes:
- controller snapshots
- runtime/context
- partial adapter stores
- form-local UI state

The idiomatic Svelte version would reduce that to:
- one context-provided auth model
- stores for reading
- actions for writing

That is easier to reason about because:
- there is one published source of truth
- state changes are explicit
- components are coupled to the model, not to one another
- local UI errors and shared workflow outcomes are intentionally separated

**Data Ownership**
Recommended ownership:
- form fields: `Login.svelte`
- field validation UI: `Login.svelte`
- auth lifecycle state: auth model
- selected tab: auth model
- current user: auth model
- auth request/outcome state: auth model
- comment text / comment-post machine: `CommentInput.svelte`

This is important.
The model should not own every input field.
That would be over-centralization.
Only cross-component state belongs in the shared model.

**XState’s Role**
If keeping XState, it should remain an internal implementation detail of the auth model.

Good use:
- drive session/auth lifecycle transitions
- normalize async auth workflow progression

Less good use:
- making every component interpret machine details directly

The ideal boundary is:
- components consume stores and outcomes
- the auth model may internally use `loginMachine`

**Migration Strategy**
If this were implemented from the current repo state, I would do it in slices:

1. Define the auth model contract.
2. Create widget-scoped context provider in `SimpleComment.svelte`.
3. Move published auth state to stores owned by the auth model.
4. Make `Login.svelte` consume the model and keep only form-local concerns.
5. Make `CommentInput.svelte` consume explicit auth request/outcome state.
6. Remove relay/event-bus behavior and partial adapter stores.
7. Validate parity.

The important part is not to keep two public boundaries indefinitely.

**Testing Strategy**
Unit/integration expectations for this architecture:

- auth model tests
  - `init`
  - login
  - signup
  - guest login
  - logout
  - local validation outcome publication
  - remote auth failure publication

- component integration tests
  - `Login.svelte` displays field-level validation correctly
  - `CommentInput.svelte` recovers from `localValidationError`
  - `CommentInput.svelte` continues on `success`
  - `SelfDisplay.svelte` reflects `currentUser`

- Cypress contract tests
  - reply flow does not depend on extra verify caused by UI mounting
  - guest error recovery restores interactivity
  - input validation does not leave hidden/stuck forms
  - auth can initialize without login UI owning lifecycle

**Advantages**
- most idiomatic Svelte shape
- one coherent mental model
- explicit cross-component contract
- easier to test
- less hidden coupling
- better long-term maintainability

**Costs**
- larger up-front design commitment
- more migration work early
- requires discipline about what is local UI state versus shared auth state

**Recommendation**
If we were planning from scratch, this is the path I would choose:
- widget-scoped auth model
- provided by context
- published as stores and actions
- explicit auth request/outcome state
- `Login.svelte` as form UI only
- `CommentInput.svelte` as a consumer of shared auth outcomes, not of `Login.svelte`

The key design rule is:
- if state must be understood by more than one component, it belongs in the shared auth model
- if state only exists to render and validate a form, it stays in `Login.svelte`

If you want, I can turn this into a repo-style plan under `docs/plans/` language next, or condense it into an implementable checklist outline.
