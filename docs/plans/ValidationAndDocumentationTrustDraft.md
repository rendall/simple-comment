# Validation and Documentation Trust Draft

Status: exploratory draft

Classification: pre-formal planning note

This document is intentionally not a formal plan under `docs/norms/plan.md` and not an implementation checklist under `docs/norms/checklist.md`.

Its purpose is to list what we want to happen for Priority 1 before we refine that into an approved formal plan.

## Why This Exists

Priority 1 in `RepoHealthImprovementBacklog.md` is about improving trust in the repo's validation and documentation signals.

Right now, the repo already has meaningful validation commands and CI/local-parity governance, but the main PR gate does not yet reflect the full minimum validation surface that contributors are likely to assume from a green result.

There is also at least some doc and command drift, which weakens contributor confidence even when the code itself is healthy.

## What We Want To Happen

We want the repo's green signals to mean something closer to "safe to trust" rather than "some checks passed."

More specifically, we want:

- the PR validation gate to cover the agreed minimum set of checks that best represents deployable repo health
- the local parity command to keep mirroring that agreed PR gate wherever this repo's CI-parity norms say it should
- contributor-facing docs to reference commands that actually exist and workflows that are still current
- the repo to distinguish clearly between:
  - the minimum PR gate
  - deeper optional validation
  - validation that is intentionally out of scope for PR gating
- future dependency or architecture work to inherit a stronger safety net than the repo currently has

## What "Better" Would Look Like

A contributor should be able to answer these questions quickly and confidently:

- What does PR CI guarantee when it is green?
- What is the single local command that best mirrors that PR gate?
- Which validations are intentionally not in the PR gate?
- Where do I go to run deeper checks?
- Which documented commands are current and canonical?

## Main Areas We Probably Want In Scope

These are the areas that currently look most relevant for a later formal plan:

- PR workflow gating in `.github/workflows/netlify-api-test.yml`
- local parity behavior in `scripts/ci-local.sh`
- package script references in `package.json`
- contributor-facing test/build guidance in `README.md`
- any small related docs updates needed to keep CI/local expectations legible

## Candidate Outcomes We Likely Want

These are not approved plan commitments yet. They are the likely outcomes we should discuss and either confirm, narrow, or reject before formalizing.

### 1. Stronger Minimum PR Gate

We likely want the main PR gate to include more than lint, format, backend function build, and Jest suites.

The likely missing candidates are:

- `yarn run typecheck`
- full `yarn run build`, or a deliberately narrower equivalent if full build is not the right gate
- a minimum browser smoke subset, if we decide the repo needs one at PR time

### 2. Clearer CI/Local Parity Story

We likely want one short explanation of what `yarn run ci:local` mirrors and what it deliberately does not mirror.

That explanation already exists in parts, but we probably want it to be easier for contributors to discover and trust.

### 3. README and Command Parity Cleanup

We likely want README and nearby contributor guidance to stop referencing stale or non-canonical commands.

Known examples worth checking during formal planning:

- `README.md` references `yarn run test:e2e`
- `package.json` currently exposes `test:cypress` rather than `test:e2e`

### 4. Clear Separation Between Required and Optional Validation

We likely want to document which checks are:

- required for the main PR gate
- available for deeper confidence
- intentionally excluded from the mirrored local parity path

This matters because a repo can feel flaky or confusing even when its tests pass if contributors do not know which signals are authoritative.

## Things We Should Avoid

Before formalizing this work, we should be careful not to let it silently expand into:

- broad CI redesign unrelated to validation trust
- dependency modernization
- build-warning cleanup
- frontend architecture refactors
- speculative test expansion without a clear gating purpose

## Questions To Settle Before Formalizing

These are the main decisions that should probably be resolved during formal planning:

- Should the PR gate require full `yarn run build`, or should backend and frontend build coverage be split more deliberately?
- Should the PR gate include any Cypress/browser smoke coverage, or should browser validation stay outside the main gate for now?
- If browser smoke coverage is added, what is the smallest useful subset?
- Should `typecheck` be treated as mandatory PR gating or as a deeper optional check?
- Which docs should be considered canonical for contributor validation guidance: `README.md` only, or `README.md` plus dedicated docs pages?
- Are there any current CI/local differences that are intentional but under-documented rather than incorrect?

## Likely Constraints For The Later Formal Plan

When this draft becomes a formal plan, it will probably need to preserve these constraints:

- keep CI/local parity aligned with `docs/norms/ci-parity.md`
- avoid turning one validation-improvement effort into a broad platform modernization phase
- keep the minimum PR gate strong enough to be useful, but not so heavy that it becomes counterproductive
- preserve clear boundaries between required validation and advisory/deeper validation

## Likely Validation Evidence For A Later Formal Plan

This section is still only exploratory, but a later formal plan will probably need evidence along lines like:

- workflow validation: the PR workflow reflects the agreed minimum gate
- local parity validation: `yarn run ci:local` mirrors the agreed CI behavior where parity is required
- documentation validation: touched docs reference existing commands and current workflows
- smoke validation: any newly gated browser/build checks actually run and pass under the agreed path

## Proposed Shape For The Later Formal Plan

A future formal plan will probably be easier to review if it is organized into one of these shapes:

### Option A: Single small plan

One plan that covers:

- minimum PR gate decisions
- local parity updates
- README/doc parity cleanup

Why this could work:

- the surfaces are closely related
- the user-facing outcome is easy to explain

Risk:

- browser-smoke gating can enlarge scope if not kept narrow

### Option B: Two smaller plans

Plan 1:

- PR gate and local parity alignment

Plan 2:

- README/docs and command parity cleanup

Why this could work:

- easier review and less coupling between CI mechanics and docs cleanup

Risk:

- contributors may still see an inconsistent story between plan 1 and plan 2 while only one is complete

## Working Recommendation

The likely best next step is to turn this into a small formal plan that:

- defines the minimum PR validation gate
- states what `ci:local` must mirror
- fixes only the documentation drift needed to keep that validation story coherent

If browser smoke coverage is included, it should stay narrow and explicitly justified rather than being treated as an open-ended test expansion effort.
