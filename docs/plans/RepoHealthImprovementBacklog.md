# Repo Health Improvement Backlog

Status: proposed

Classification: future-looking planning document only

This document is intentionally not an approved implementation checklist under `docs/norms/checklist.md`.

It does not authorize code changes by itself. Its purpose is to capture the current repo-health assessment, identify the highest-value follow-on planning areas, and provide a stable source from which future scoped plans, checklists, and implementation phases may be derived.

## Goal

Improve project reliability, maintainability, and contributor confidence without creating accidental scope expansion or collapsing planning directly into implementation.

## Intent

Make it easier to trust the repo.

Contributors should be able to look at CI, local validation, docs, dependencies, and key architecture seams and quickly understand:

- what is healthy already
- where the real risks are
- which improvements should happen first
- which future work should be planned separately rather than bundled together

## Current Assessment Summary

Assessment basis:

- based on repository review and local validation observed on 2026-03-17
- intended as a time-bound snapshot, not a permanent claim about repo state
- should be refreshed or revalidated before deriving future formal plans from time-sensitive observations

Current project health at that review point is moderate-to-good:

- recent maintenance activity is strong
- local CI-parity validation passes
- backend and frontend Jest suites pass
- full typecheck passes
- full production build passes

Current project friction is concentrated in a smaller set of strategic areas:

- PR CI does not gate on all important validation paths
- documentation has some command and workflow drift
- dependency lag is meaningful across several core tools
- backend function bundles are heavy and emit warnings
- test value is uneven across the suite
- some frontend behavior remains tightly coupled to component structure
- planning/governance continuity is weaker than the archived phase history suggests it should be

## In Scope

- prioritizing repo-health improvement themes
- identifying planning slices that can become future formal plans
- calling out sequencing, tradeoffs, and likely validation needs
- separating quick wins from higher-risk modernization work

## Out of Scope

- direct implementation instructions
- executable checklist authoring under `docs/norms/checklist.md`
- code changes, dependency upgrades, or workflow edits
- reinterpreting runtime/API behavior beyond the currently observed repo state

## Constraints

- Keep future work scoped so that each follow-on plan can remain reviewable and reversible.
- Prefer small planning slices over one broad "modernize everything" effort.
- Preserve the existing governance boundary between planning, checklist approval, and implementation.
- Treat merged code/tests and documented contracts as the source of truth unless a future approved plan explicitly changes them.

## Risks and Mitigations

- Risk: bundling multiple health topics into one plan will blur acceptance criteria and slow delivery.
  - Mitigation: derive separate plans for CI gating, dependency upgrades, test-value cleanup, and architecture decoupling.

- Risk: dependency upgrades could be framed as "routine maintenance" and smuggle in behavior changes.
  - Mitigation: split low-risk patch/minor hygiene from high-risk major-version migrations.

- Risk: warning cleanup could turn into architecture churn without user-visible value.
  - Mitigation: require each warning-reduction plan to define what warning or size signal is being improved and why it matters.

- Risk: replacing weak tests without agreeing on desired coverage could reduce protection.
  - Mitigation: future test-quality planning should pair removal of low-signal tests with explicit replacement coverage.

## Priority Tracks

### Priority 1: Validation and Documentation Trust

This is the highest-leverage near-term area because it reduces false confidence and improves day-to-day contributor flow without requiring broad runtime changes.

Focus:

- bring PR CI closer to the repo's real validation surface
- remove command/document drift
- make the "green" signal more representative of deployable health

Why first:

- the repo already has `typecheck`, full `build`, and Cypress capabilities, but PR gating does not currently enforce the most meaningful subset
- README usage/testing guidance currently contains at least one stale command reference
- stronger validation trust improves the safety of every later change

Likely derivable plan slices:

- CI gate expansion plan
- README and developer command parity cleanup plan
- lightweight browser-smoke gating plan

Success signals for a future plan:

- PR CI covers the agreed minimum validation set
- repo docs reference commands that actually exist
- local and PR validation expectations are easier to explain in one short path

See: [ValidationAndDocumentationTrustDraft.md](ValidationAndDocumentationTrustDraft.md)

### Priority 2: Build and Bundle Warning Reduction

This area targets warning debt and backend deploy ergonomics without immediately forcing a full platform rewrite.

Focus:

- investigate Netlify function bundle size
- reduce or intentionally document webpack/MongoDB warnings
- improve signal-to-noise in build output

Why second:

- the app currently builds and tests successfully, so this is not a stop-the-line issue
- the warnings and heavy backend bundles are a maintainability and deployment-quality concern, not an immediate correctness failure
- build hygiene work is easier to reason about once validation gates are trustworthy

Likely derivable plan slices:

- backend bundling warning-audit plan
- function bundle-size reduction plan
- build-output hygiene plan

Success signals for a future plan:

- materially fewer unactioned build warnings
- smaller or better-justified backend function artifacts
- clearer distinction between ignorable output and real build risk

### Priority 3: Test Suite Signal Quality

This area is about making the test suite more meaningful, faster to trust, and less padded with placeholder coverage.

Focus:

- identify low-value tests and stale assumptions
- replace placeholder tests with behavior-oriented protection
- decide whether coverage reporting or thresholds should become part of the quality bar

Why third:

- the current suite passes and protects meaningful behavior already
- the issue is not absence of tests, but uneven signal and cost
- this work benefits from first clarifying which validations should be authoritative in CI

Likely derivable plan slices:

- frontend test-value audit plan
- coverage-reporting or coverage-threshold decision plan
- backend/frontend test-runtime reduction plan

Success signals for a future plan:

- placeholder tests are removed or replaced with product-relevant checks
- test runtime and confidence are better aligned
- contributors can explain what the suite is protecting, not just that it is green

### Priority 4: Dependency Modernization

This area should be treated as a sequence of planning efforts, not one umbrella upgrade.

Focus:

- separate low-risk maintenance from major-version migrations
- identify which outdated packages are operationally important
- reduce the chance of security, tooling, or ecosystem drift forcing rushed upgrades later

Why fourth:

- some dependency lag is real and strategically important
- large upgrade bundles are easy to destabilize if they are not sequenced carefully
- stronger CI and better test signal should come first so later upgrades are safer

Likely derivable plan slices:

- low-risk patch/minor dependency refresh plan
- test-stack modernization plan
- lint/format/tooling modernization plan
- runtime/platform major-upgrade plan

Success signals for a future plan:

- upgrade scope is partitioned by risk
- high-risk majors are justified individually
- dependency work no longer depends on broad "trust us" reasoning

### Priority 5: Frontend Architecture Decoupling

This is a valuable but narrower improvement area centered on maintainability rather than immediate repo breakage.

The main known coupling hotspot today is the login/authentication flow in `src/components/Login.svelte`.

That component currently does more than render login UI:

- it owns local form/input state
- it drives the `loginMachine` state machine
- it performs auth-related API calls such as verify, login, signup, guest creation, profile reads, profile updates, and logout
- it reads from and writes to `localStorage`
- it subscribes to and updates shared Svelte stores such as `currentUserStore`, `dispatchableStore`, and `loginStateStore`
- it performs mount/unmount side effects that influence app-level auth behavior

The repo already calls this out in code with an inline TODO noting that login functionality currently depends on the `Login.svelte` component being present on the page. In practice, that means auth/session behavior is coupled to component presence and lifecycle rather than being owned by a smaller dedicated workflow/service boundary.

Focus:

- reduce component-bound behavior coupling where the repo already flags it as a concern
- clarify boundaries between view components, state machines, and auth/workflow logic

Why fifth:

- there is already a concrete coupling hotspot in login behavior, where one UI component currently mixes rendering, orchestration, persistence, shared-store coordination, and remote auth side effects
- this work is easier to execute once validation, docs, and test trust are stronger
- it carries a higher risk of accidental behavioral drift than earlier priorities

Likely derivable plan slices:

- login workflow decoupling plan
- state-management boundary cleanup plan
- frontend component responsibility audit plan

Success signals for a future plan:

- auth and identity flows are less dependent on component presence
- UI modules are easier to test at the right boundary
- future frontend upgrades require less behavioral archaeology
- login-related state, side effects, and rendering responsibilities are easier to explain as separate concerns

### Priority 6: Planning Continuity and Governance Hygiene

This track keeps the repo's process legible so future work is easier to stage and review.

This priority is not based on the existence of this backlog document itself. The concern is narrower: the repo has strong archived phase history, but a thinner active formal phase-planning surface than that history suggests contributors may expect.

Focus:

- restore a clearer active-plans story under `docs/plans/`
- keep archived history useful without making the current state ambiguous
- define when a planning backlog item should graduate into a formal plan

Why this remains important:

- recent archived phase history is strong, but the active planning surface is thin
- contributors benefit from seeing what is currently active versus what is historical
- planning clarity reduces scope creep before implementation begins

Likely derivable plan slices:

- active-plan inventory cleanup plan
- plan-to-checklist handoff guidance update
- archive/index maintenance plan

Success signals for a future plan:

- active and archived planning artifacts are easy to distinguish
- contributors can tell what is proposed, approved, in progress, or complete
- phase sequencing is easier to follow without reading commit history first

## Suggested Sequencing

Recommended sequence for follow-on planning:

1. Validation and Documentation Trust
2. Build and Bundle Warning Reduction
3. Test Suite Signal Quality
4. Dependency Modernization
5. Frontend Architecture Decoupling
6. Planning Continuity and Governance Hygiene

This sequence is recommended because it improves confidence first, then build hygiene, then test quality, then uses that stronger safety net to support broader modernization and refactoring work.

## Candidate Quick Wins For Future Planning

These are good candidates for a small, low-risk follow-on plan rather than broad modernization:

- plan a README and script parity cleanup so documented commands match the repo's actual entrypoints
- evaluate whether PR CI should include `yarn run typecheck`
- evaluate whether PR CI should include full `yarn run build` or a narrower frontend-build gate
- define a minimum Cypress smoke subset suitable for future PR gating
- plan a build-warning inventory that classifies existing warnings as ignore, mitigate, or eliminate
- identify obviously low-signal tests that should be candidates for replacement planning

## Candidate Higher-Risk Planning Areas

These should be planned separately and more carefully:

- major Jest ecosystem upgrades
- major ESLint/TypeScript toolchain upgrades
- major Netlify/runtime package upgrades
- major Svelte/XState ecosystem upgrades
- frontend auth/login workflow decoupling that changes component responsibilities

## Acceptance Criteria

This planning backlog is successful if:

1. It clearly distinguishes planning from implementation authorization.
2. It identifies a small number of prioritized, separable health-improvement tracks.
3. Each track is specific enough to seed a future formal plan without becoming an executable checklist itself.
4. The recommended sequencing is understandable and defensible.
5. The document helps collaborators decide what to plan next without silently expanding scope.

## Open Questions / Assumptions

- Assumption: the next repo-health effort should improve trust and maintainability before pursuing broader feature work.
- Assumption: current passing validation is meaningful enough to serve as a baseline, even though CI does not yet gate every important path.
- Open question: should a future CI-focused plan aim for full build parity on every PR, or a narrower minimum gate plus optional nightly/deeper validation?
- Open question: should coverage thresholds be introduced, or would coverage reporting plus targeted gap review be a better fit for this repo?
- Open question: should dependency modernization be organized by tooling domain, runtime surface, or upgrade risk?

## Recommendation

Use this document as the intake source for the next formal planning conversation.

The best next step is to choose one of the Priority 1 slices and refine it into a proper plan under `docs/norms/plan.md`, then derive an executable checklist only after that plan is approved.
