# Priority 2 PR A Plan — Baseline and Inventory

Status: active

Source backlog: `docs/RepoHealthImprovementBacklog.md` (`Priority 2: Build and Bundle Warning Reduction`)

Parent plan: `docs/plans/Priority2BuildAndBundleWarningReductionPlan.md`

## Goal

Create a reliable baseline for Priority 2 by capturing canonical build evidence and turning it into a complete warning and artifact-size inventory, without changing build behavior.

## Intent

For this PR, we are not trying to fix warnings yet.

We are trying to make the current state visible and reviewable so later PRs can make focused, low-risk changes.

Success means a contributor can answer, from one place:

- what warnings currently exist,
- where they come from,
- how often they appear,
- who owns each disposition decision,
- and what the current backend function size baseline is.

This PR should reduce ambiguity, not reduce warning count.

## In Scope

- Capture canonical `yarn run build` backend/frontend logs for baseline evidence.
- Produce one warning register covering all unique warning signatures seen in canonical logs.
- Classify each warning disposition as one of:
  - `ELIMINATE`
  - `MITIGATE`
  - `TOLERATE`
  - `DEFER-UPSTREAM`
- Record rationale and ownership for every warning disposition.
- Record per-function backend artifact size baseline from canonical build output.
- Record initial artifact composition observations as baseline notes only.
- Document PR A boundaries and baseline interpretation rules to prevent drift into remediation.

## Out of Scope

- Any warning-remediation code/config changes.
- Any bundle-size optimization implementation.
- Any frontend warning cleanup implementation.
- Any CI policy/enforcement changes.
- Any final before/after reduction reporting (reserved for later PRs).

## Constraints

- Preserve existing runtime behavior and API contracts.
- Keep PR A documentation/inventory-only; no build-output suppression logic.
- Keep artifact capture reproducible from existing project commands.
- Keep phase boundaries explicit to avoid mixing future tracks into PR A.

## How We Will Execute PR A

1. Run canonical production build command and capture backend/frontend output artifacts.
2. Normalize warning signatures into a single warning register.
3. Add required metadata per warning (source, frequency, risk category).
4. Assign disposition + rationale + owner for each warning entry.
5. Capture per-function backend artifact size baseline and initial composition observations.
6. Publish a PR A baseline section with explicit scope guards for deferred work.

## Risks and Mitigations

- Risk: PR A accidentally includes remediation or optimization changes.
  - Mitigation: explicit out-of-scope list plus scope-conformance validation item in checklist.

- Risk: baseline logs are non-reproducible or partial.
  - Mitigation: require canonical command surface and record reproducibility assumptions.

- Risk: warning register misses duplicate/variant signatures.
  - Mitigation: enforce unique-signature normalization and validation pass for completeness.

- Risk: disposition labels become hand-wavy with unclear ownership.
  - Mitigation: require rationale + owner for each warning row before PR A acceptance.

## Acceptance Criteria

1. Canonical backend/frontend build logs are captured and reviewable.
2. A warning register exists with every unique warning from canonical logs.
3. Every warning row includes required metadata (tool/stage, signature, source, frequency, risk category).
4. Every warning row has exactly one disposition from the approved set.
5. Every warning row has rationale and an owner.
6. Backend function size baseline is recorded for all function artifacts emitted by canonical build.
7. PR A documentation clearly states deferred work boundaries so remediation is not implied in this phase.

## Validation Strategy

Required evidence types for PR A:

- **Contract/parity evidence**
  - Build artifacts/logs come from canonical `yarn run build` path used by project validation.
  - Pass: backend and frontend logs are present and attributable to the same canonical command surface.
  - Fail: logs are incomplete, from mixed command paths, or not reproducible.

- **Non-functional evidence**
  - Warning register completeness and normalized uniqueness are demonstrated.
  - Backend per-function artifact size baseline is captured.
  - Pass: every unique warning appears once with required fields; all built function artifacts have recorded sizes.
  - Fail: missing warnings, duplicate normalization errors, or incomplete size baseline.

- **Documentation/process evidence**
  - PR A scope guard language is present and unambiguous.
  - Pass: docs explicitly defer remediation/optimization/CI gating to later PRs.
  - Fail: docs imply implementation work outside PR A scope.

## PR A Baseline Artifacts

Artifacts produced by this phase:

- Full canonical build log: `docs/plans/artifacts/priority2-pr-a/build-full.log`
- ANSI-stripped canonical build log: `docs/plans/artifacts/priority2-pr-a/build-full.clean.log`
- Backend-only canonical segment: `docs/plans/artifacts/priority2-pr-a/build-backend.log`
- Frontend-only canonical segment: `docs/plans/artifacts/priority2-pr-a/build-frontend.log`
- Structured warning register: `docs/plans/artifacts/priority2-pr-a/warning-register.md`
- Backend artifact-size baseline: `docs/plans/artifacts/priority2-pr-a/backend-artifact-size-baseline.md`
- Backend composition notes: `docs/plans/artifacts/priority2-pr-a/backend-artifact-composition-notes.md`

Interpretation boundaries for this phase:

- These artifacts represent a time-bound baseline snapshot.
- Disposition values in PR A are planning-direction signals, not implementation outcomes.
- Build-warning count reduction is not a PR A success criterion; completeness and clarity are.

## Open Questions / Assumptions

- Assumption: current build outputs are stable enough to serve as a baseline for follow-on PRs.
- Assumption: PR A should optimize for decision clarity over immediate warning-count reduction.
- Open question: where should the warning register live long-term (plan artifact vs dedicated build-health doc)?
- Open question: should owner attribution be team alias, role, or named maintainer for this repo?

## PR A Scope Guard (Deferred Work)

The following work is explicitly deferred to later Priority 2 PRs and must not be implemented in PR A:

- backend warning remediation changes (including MongoDB/webpack warning suppression or handling changes)
- backend bundle-size optimization changes (including dependency externalization or import-path optimization)
- frontend build-warning cleanup changes
- CI warning/size gate enforcement changes
- final before/after warning reduction reporting

Any change that reduces warning count, changes bundler/runtime behavior, or alters CI gating is out of scope for PR A and requires the corresponding follow-on checklist slice.

## Conformance QC (Plan)

- Intent clarity issues: none observed; intent is plain-language and phase-specific.
- Missing required sections: none (Goal, Intent, In Scope, Out of Scope, Acceptance Criteria present).
- Ambiguities/assumptions to resolve: owner attribution format and long-term warning-register location.
- Validation strategy gaps: none for PR A baseline/inventory scope.
- Traceability readiness: ready; statements are quoteable for checklist items.
- Pass/Fail: ready for checklist authoring — **Pass**.
