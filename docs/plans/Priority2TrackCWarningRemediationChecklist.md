# Priority 2 Track C Checklist — Warning Remediation (Backend First)

Status: active

Source plan: `docs/plans/Priority2TrackCWarningRemediationPlan.md`

QC mode: Conformance QC

## Scope Lock (from source plan)

- In scope anchor: "Evaluate current upstream-supported handling for MongoDB optional dependency warnings on the existing stack." (In Scope)
- In scope anchor: "Record the sources of any upstream or external guidance used for Track C decisions so the resulting checklist can require citation-backed remediation notes." (In Scope)
- In scope anchor: "Implement the lowest-risk remediation option that aligns with current upstream guidance and current phase constraints." (In Scope)
- Constraints anchor: "Preserve current runtime behavior and API contracts." (Constraints)
- Constraints anchor: "Do not convert Track C into a modernization phase in order to chase warning-count reduction." (Constraints)
- Acceptance anchor: "Backend warning count/signature outcome after Track C is captured and compared against the pre-Track C baseline." (Acceptance Criteria)
- Acceptance anchor: "Any upstream or external guidance used to support a Track C decision is cited in the relevant planning/evidence artifacts." (Acceptance Criteria)

## Atomic Checklist Items

- [x] C01 `[baseline]` Re-capture the canonical backend warning baseline and confirm the in-scope MongoDB warning signatures, call path, and pre-Track C warning count.
  - Depends on: none.
  - Validation: T01.
  - Trace:
    - "Re-confirm the current backend warning signatures and call path from the canonical backend build." (In Scope)
    - "Re-capture the canonical backend warning evidence and confirm the exact warning signatures still match the current register." (How We Will Execute Track C)

- [x] C02 `[research]` Create a Track C guidance-sources note that records the upstream or external guidance consulted for current-stack MongoDB optional dependency handling and webpack optional dependency treatment.
  - Depends on: C01.
  - Validation: T02.
  - Trace:
    - "Evaluate current upstream-supported handling for MongoDB optional dependency warnings on the existing stack." (In Scope)
    - "Record the sources of any upstream or external guidance used for Track C decisions so the resulting checklist can require citation-backed remediation notes." (In Scope)
    - "Record the guidance sources consulted for Track C decisions, including enough detail for later reviewers to verify what guidance was followed." (How We Will Execute Track C)

- [x] C03 `[analysis]` Create a remediation candidate/decision note that ranks backend-first options by upstream-guidance alignment, runtime-behavior safety, reversibility, warning-reduction impact, and modernization spillover risk.
  - Depends on: C01, C02.
  - Validation: T03.
  - Trace:
    - "Rank remediation candidates by: alignment with upstream guidance, runtime-behavior safety, reversibility, warning-reduction impact, and modernization spillover risk." (How We Will Execute Track C)
    - "When multiple options are available, prefer them in this order..." (Preferred Decision Policy)

- [x] C04 `[backend]` Implement one low-risk backend-first remediation slice that matches current-stack upstream guidance without introducing MongoDB major-version modernization or unrelated toolchain migration.
  - Depends on: C03.
  - Validation: T04, T05, T07.
  - Trace:
    - "Implement the lowest-risk remediation option that aligns with current upstream guidance and current phase constraints." (In Scope)
    - "Implement one low-risk backend-first remediation slice." (How We Will Execute Track C)
    - "Do not convert Track C into a modernization phase in order to chase warning-count reduction." (Constraints)

- [x] C05 `[loop]` Record the Track C loop outcome for the selected remediation candidate by capturing measure, validation, and decision results as `ACCEPT`, `REVISE`, `REVERT`, or `DEFER`.
  - Depends on: C04.
  - Validation: T04, T05, T06.
  - Trace:
    - "Measure the backend build result after that slice..." (How We Will Execute Track C)
    - "Run required parity/smoke validation for accepted remediation slices." (How We Will Execute Track C)
    - "Decide `ACCEPT`, `REVISE`, `REVERT`, or `DEFER` for the candidate." (How We Will Execute Track C)
    - "Loop rule: do not batch multiple remediation approaches before completing one full implement → measure → validate → decide cycle." (How We Will Execute Track C)

- [x] C06 `[control]` Apply the Track C continuation rule after each recorded candidate decision: if the warning path is not yet cleanly remediated and another eligible low-risk current-stack candidate remains, return to C03 and execute another full C04-C05 cycle; otherwise proceed to final disposition documentation.
  - Depends on: C05.
  - Validation: T08.
  - Trace:
    - "Stop once the backend warning path is either: cleanly remediated with acceptable risk, or explicitly dispositioned as a documented residual warning with owner and re-check trigger." (How We Will Execute Track C)
    - "Loop rule: do not batch multiple remediation approaches before completing one full implement → measure → validate → decide cycle." (How We Will Execute Track C)
    - "If the lowest-risk current-stack approach cannot eliminate a warning cleanly, document and tolerate it explicitly rather than forcing higher-risk dependency churn." (Constraints)

- [x] C07 `[docs]` Update the warning register and Track C evidence artifacts so they reflect the measured warning outcome, the cited guidance basis, and the final disposition of the backend MongoDB warning path.
  - Depends on: C06.
  - Validation: T02, T06.
  - Trace:
    - "Update warning documentation and Track C evidence artifacts to reflect the selected disposition." (In Scope)
    - "The warning register and Track C evidence artifacts reflect the final disposition of the backend MongoDB warnings." (Acceptance Criteria)
    - "Any upstream or external guidance used to support a Track C decision is cited in the relevant planning/evidence artifacts." (Acceptance Criteria)

- [x] C08 `[handoff]` If any backend MongoDB warning remains after the loop exits, record the residual-warning rationale, owner, and re-evaluation trigger without expanding Track C into out-of-scope modernization work.
  - Depends on: C06.
  - Validation: T06, T07, T08.
  - Trace:
    - "Record any residual backend warning as intentionally accepted only if elimination would require out-of-scope modernization or unacceptable runtime risk." (In Scope)
    - "Any warning that remains is intentionally documented with owner and re-evaluation trigger." (Acceptance Criteria)
    - "If the lowest-risk current-stack approach cannot eliminate a warning cleanly, document and tolerate it explicitly rather than forcing higher-risk dependency churn." (Constraints)

## Validation Items

- [x] T01 `[validation]` Baseline validation: confirm the refreshed Track C backend warning baseline comes from the canonical backend build path and still matches the warning register's in-scope signatures.
  - Trace:
    - "Re-capture the canonical backend warning evidence and confirm the exact warning signatures still match the current register." (How We Will Execute Track C)
    - "Backend warning count/signature outcome after Track C is captured and compared against the pre-Track C baseline." (Acceptance Criteria)

- [x] T02 `[validation]` Guidance-citation validation: confirm the guidance-sources artifact identifies the upstream or external sources actually used and that those citations appear in the relevant decision/evidence artifacts.
  - Trace:
    - "Record the guidance sources consulted for Track C decisions, including enough detail for later reviewers to verify what guidance was followed." (How We Will Execute Track C)
    - "Any upstream or external guidance used to support a Track C decision is cited in the relevant planning/evidence artifacts." (Acceptance Criteria)

- [x] T03 `[validation]` Candidate-ranking validation: confirm the remediation candidate note ranks options using the plan's required decision factors and preserves the preferred current-stack ordering policy.
  - Trace:
    - "Rank remediation candidates by..." (How We Will Execute Track C)
    - "When multiple options are available, prefer them in this order..." (Preferred Decision Policy)

- [x] T04 `[validation]` Warning-outcome validation: compare pre- and post-slice backend build output and record the exact warning count/signature delta attributable to the selected remediation candidate.
  - Trace:
    - "Re-run backend build validation after each remediation slice and compare warning count/signature against baseline." (In Scope)
    - "Backend warning count/signature before and after each remediation slice is captured." (Validation Strategy)

- [x] T05 `[validation]` Parity/smoke validation: verify the accepted remediation slice shows no observed runtime-behavior or API-contract drift.
  - Trace:
    - "Preserve current runtime behavior and API contracts." (Constraints)
    - "Backend build remediation must not introduce API-contract or runtime-behavior drift." (Validation Strategy)

- [ ] T06 `[validation]` Documentation/disposition validation: confirm the warning register, Track C evidence notes, and any residual-warning documentation are current, internally consistent, and aligned with the recorded Track C decision.
  - Trace:
    - "Warning disposition artifacts are updated to match the actual measured Track C result." (Validation Strategy)
    - "Pass: warning register entries, residual-warning rationale, re-check triggers, and guidance-source citations are current and internally consistent." (Validation Strategy)

- [ ] T07 `[validation]` Scope-conformance validation: confirm Track C does not introduce MongoDB major-version migration, unrelated modernization work, or warning suppression without recorded rationale.
  - Trace:
    - "MongoDB major-version upgrades or broader dependency modernization." (Out of Scope)
    - "Silent warning suppression without recorded rationale and validation evidence." (Out of Scope)
    - "If a proposed fix requires one of the above to succeed, Track C should stop, document the blocker, and hand it forward rather than silently expanding scope." (Track C Scope Guard)

- [x] T08 `[validation]` Loop-control validation: confirm each attempted remediation candidate completed one full implement → measure → validate → decide cycle, that iteration continued when eligible current-stack candidates remained, and that loop exit occurred only on clean remediation or documented residual disposition.
  - Trace:
    - "Stop once the backend warning path is either: cleanly remediated with acceptable risk, or explicitly dispositioned as a documented residual warning with owner and re-check trigger." (How We Will Execute Track C)
    - "Loop rule: do not batch multiple remediation approaches before completing one full implement → measure → validate → decide cycle." (How We Will Execute Track C)

## Behavior Slices

### Slice S1
- Goal: Establish the Track C baseline and document the guidance sources that will govern remediation decisions.
- Items: C01, C02, T01, T02.
- Type: mechanical.

### Slice S2
- Goal: Rank current-stack remediation options and execute one low-risk backend-first slice under the required loop controls.
- Items: C03, C04, C05, C06, T03, T04, T05, T08.
- Type: behavior.

### Slice S3
- Goal: Finalize disposition documentation and residual-warning handoff without scope expansion.
- Items: C07, C08, T06, T07.
- Type: mechanical.

## Conformance QC

- Missing from plan:
  - None.
- Extra beyond plan:
  - None.
- Atomicity fixes needed:
  - None identified; each `Cxx` item is independently checkable and committable.
- Validation mapping gaps:
  - None identified; every `Cxx` item maps to one or more `Txx` validation items.
- Pass/Fail: checklist achieves plan goals:
  - Pass.
