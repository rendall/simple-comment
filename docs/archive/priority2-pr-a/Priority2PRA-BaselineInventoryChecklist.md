# Priority 2 PR A Checklist — Baseline and Inventory Only

Status: archived

Source plan: `docs/archive/priority2-pr-a/Priority2PRA-BaselineInventoryPlan.md`

## Phase Intent (PR A Only)

This checklist covers only baseline capture and warning/bundle inventory for Priority 2.

It does **not** include warning remediation, bundle optimization, frontend warning cleanup, CI enforcement changes, or finalization reporting from later PRs.

## Checklist

- [x] C01 `[baseline]` Capture canonical backend build output from `yarn run build` and persist a reproducible log artifact for review.
  - Depends on: none.
  - Validation: T01.
  - Trace:
    - "Capture canonical `yarn run build` backend/frontend logs for baseline evidence." (In Scope)
    - "Create a reliable baseline for Priority 2 by capturing canonical build evidence" (Goal)

- [x] C02 `[baseline]` Capture canonical frontend build output from `yarn run build` and persist a reproducible log artifact for review.
  - Depends on: C01.
  - Validation: T01.
  - Trace:
    - "Capture canonical `yarn run build` backend/frontend logs for baseline evidence." (In Scope)
    - "Build artifacts/logs come from canonical `yarn run build` path" (Validation Strategy)

- [x] C03 `[inventory]` Create a warning register artifact with one row per unique warning signature observed in canonical logs.
  - Depends on: C01, C02.
  - Validation: T02.
  - Trace:
    - "Produce one warning register covering all unique warning signatures seen in canonical logs." (In Scope)
    - "A warning register exists with every unique warning from canonical logs." (Acceptance Criteria)

- [x] C04 `[inventory]` Populate required warning-register columns for each unique warning: tool/stage, exact signature, source path/module, frequency pattern, and risk category.
  - Depends on: C03.
  - Validation: T02.
  - Trace:
    - "Every warning row includes required metadata (tool/stage, signature, source, frequency, risk category)." (Acceptance Criteria)
    - "Add required metadata per warning (source, frequency, risk category)." (How We Will Execute PR A)

- [x] C05 `[classification]` Assign one disposition for each warning (`ELIMINATE`, `MITIGATE`, `TOLERATE`, `DEFER-UPSTREAM`) in the warning register.
  - Depends on: C04.
  - Validation: T03.
  - Trace:
    - "Classify each warning disposition as one of: `ELIMINATE` `MITIGATE` `TOLERATE` `DEFER-UPSTREAM`" (In Scope)
    - "Every warning row has exactly one disposition from the approved set." (Acceptance Criteria)

- [x] C06 `[classification]` Record rationale and acceptance owner for each warning disposition entry.
  - Depends on: C05.
  - Validation: T03.
  - Trace:
    - "Record rationale and ownership for every warning disposition." (In Scope)
    - "Every warning row has rationale and an owner." (Acceptance Criteria)

- [x] C07 `[bundle-baseline]` Record per-function backend artifact size baseline from canonical build output for all Netlify functions built in this repo.
  - Depends on: C01.
  - Validation: T04.
  - Trace:
    - "Record per-function backend artifact size baseline from canonical build output." (In Scope)
    - "Backend function size baseline is recorded for all function artifacts emitted by canonical build." (Acceptance Criteria)

- [x] C08 `[bundle-baseline]` Record initial artifact composition notes (largest modules/shared duplication hypotheses) as baseline inputs only, without making optimization changes.
  - Depends on: C07.
  - Validation: T04.
  - Trace:
    - "Record initial artifact composition observations as baseline notes only." (In Scope)
    - "Any bundle-size optimization implementation." (Out of Scope)

- [x] C09 `[docs]` Add PR A baseline section in docs describing captured artifacts, warning register location, and interpretation boundaries for this phase.
  - Depends on: C03, C07.
  - Validation: T05.
  - Trace:
    - "Document PR A boundaries and baseline interpretation rules to prevent drift into remediation." (In Scope)
    - "This PR should reduce ambiguity, not reduce warning count." (Intent)

- [x] C10 `[scope-control]` Add explicit PR A scope guard language stating that remediation/optimization/CI enforcement work is deferred to later PRs.
  - Depends on: C09.
  - Validation: T05.
  - Trace:
    - "Any warning-remediation code/config changes." (Out of Scope)
    - "Any bundle-size optimization implementation." (Out of Scope)
    - "Any CI policy/enforcement changes." (Out of Scope)

- [x] T01 `[validation]` Canonical-log validation: confirm backend and frontend log artifacts are reproducible and tied to the same command surface (`yarn run build`).
  - Depends on: C01, C02.
  - Trace:
    - "Build artifacts/logs come from canonical `yarn run build` path" (Validation Strategy)
    - "Pass: backend and frontend logs are present and attributable to the same canonical command surface." (Validation Strategy)

- [x] T02 `[validation]` Warning-register structure validation: confirm every unique warning from canonical logs appears exactly once with required structural fields.
  - Depends on: C03, C04.
  - Trace:
    - "A warning register exists with every unique warning from canonical logs." (Acceptance Criteria)
    - "Pass: every unique warning appears once with required fields" (Validation Strategy)

- [x] T03 `[validation]` Classification validation: confirm each warning has one valid disposition plus rationale and owner.
  - Depends on: C05, C06.
  - Trace:
    - "Every warning row has exactly one disposition from the approved set." (Acceptance Criteria)
    - "Every warning row has rationale and an owner." (Acceptance Criteria)

- [x] T04 `[validation]` Bundle-baseline validation: confirm per-function size baseline is recorded for all built Netlify function outputs and is traceable to canonical logs.
  - Depends on: C07, C08.
  - Trace:
    - "Backend function size baseline is recorded for all function artifacts emitted by canonical build." (Acceptance Criteria)
    - "Pass: ... all built function artifacts have recorded sizes." (Validation Strategy)

- [x] T05 `[validation]` Scope-conformance validation: confirm PR A artifacts contain no remediation, optimization, CI-gating, or frontend warning-fix implementation changes.
  - Depends on: C09, C10.
  - Trace:
    - "PR A documentation clearly states deferred work boundaries so remediation is not implied in this phase." (Acceptance Criteria)
    - "Pass: docs explicitly defer remediation/optimization/CI gating to later PRs." (Validation Strategy)

## Behavior Slices

- Goal: Capture canonical, reproducible backend/frontend build evidence used as Priority 2 baseline.
  Items: C01, C02, T01
  Type: mechanical

- Goal: Produce a complete, normalized warning register ready for follow-on remediation planning.
  Items: C03, C04, T02
  Type: behavior

- Goal: Disposition all warnings with accountable rationale/ownership so tolerated debt is explicit.
  Items: C05, C06, T03
  Type: behavior

- Goal: Establish backend artifact-size baseline and composition context without implementing optimizations.
  Items: C07, C08, T04
  Type: behavior

- Goal: Lock PR A boundaries and prevent cross-track drift into remediation or policy-enforcement work.
  Items: C09, C10, T05
  Type: mechanical
