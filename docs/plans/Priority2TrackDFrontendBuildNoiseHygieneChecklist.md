# Priority 2 Track D Checklist — Frontend Build Noise Hygiene

Status: active

Source plan: `docs/plans/Priority2TrackDFrontendBuildNoiseHygienePlan.md`

QC mode: Conformance QC

## Scope Lock (from source plan)

- In scope anchor: "Re-confirm the current frontend build-output messages emitted by the canonical frontend production build path." (In Scope)
- In scope anchor: "Evaluate low-risk fixes or configuration alignment for the currently known frontend messages..." (In Scope)
- In scope anchor: "Document explicit tolerance criteria for any frontend message that remains because it is upstream-owned, non-actionable on the current stack, or not worth higher-risk churn in this phase." (In Scope)
- Constraints anchor: "Preserve current frontend runtime behavior and public embed/client expectations." (Constraints)
- Constraints anchor: "Prefer configuration alignment, path clarity, and documentation over dependency churn." (Constraints)
- Decision-policy anchor: "prioritize repo-local evaluation of the stylesheet-path notice before investing in third-party warning churn" (Preferred Decision Policy)
- Acceptance anchor: "Every in-scope frontend build message has an explicit Track D disposition: actionable warning, informational notice, or tolerated residual notice." (Acceptance Criteria)
- Acceptance anchor: "Contributors can tell from the resulting documentation which frontend build messages are expected notices versus actionable warnings." (Acceptance Criteria)

## Atomic Checklist Items

- [x] C01 `[baseline]` Re-run `yarn run build:frontend`, capture the raw Track D baseline in `docs/archive/priority2-track-d/build-frontend-baseline.log`, and confirm that the current frontend build still emits exactly the three in-scope noisy message signatures with no additional unique frontend warning/noise signatures.
  - Depends on: none.
  - Validation: T01.
  - Trace:
    - "Re-confirm the current frontend build-output messages emitted by the canonical frontend production build path." (In Scope)
    - "A fresh local `yarn run build:frontend` re-check on March 18, 2026 confirmed that the current frontend build still emits the same three unique noisy message signatures already captured in the baseline and did not surface any additional frontend warning/noise signatures." (Current Baseline)

- [x] C02 `[analysis]` Create or update `docs/archive/priority2-track-d/warning-register-current.md` so each in-scope frontend message is classified as `actionable warning`, `informational notice`, or `tolerated residual notice`, with rationale, owner, and re-evaluation trigger.
  - Depends on: C01.
  - Validation: T02, T07.
  - Trace:
    - "Re-classify each in-scope frontend message using the Track D categories..." (In Scope)
    - "Every in-scope frontend build message has an explicit Track D disposition: actionable warning, informational notice, or tolerated residual notice." (Acceptance Criteria)
    - "Any frontend message that remains is intentionally documented with rationale, owner, and re-evaluation trigger." (Acceptance Criteria)

- [x] C03 `[analysis]` Create `docs/archive/priority2-track-d/remediation-candidate-note.md` that ranks repo-local candidates across `vite.config.ts`, `src/entry/index.html`, `src/entry/icebreakers/index.html`, `src/components/CommentDisplay.svelte`, and `src/components/low-level/PasswordInput.svelte` using the plan's decision factors and default disposition policy.
  - Depends on: C01, C02.
  - Validation: T03, T08.
  - Trace:
    - "The current warning/noise signatures map to these repo-local surfaces and should anchor Track D implementation/checklist authoring..." (Known Repo-Local Surfaces)
    - "Rank low-risk remediation candidates using these factors..." (How We Will Execute Track D)
    - "Use these current default dispositions during checklist authoring unless new evidence from implementation invalidates them..." (How We Will Execute Track D)

- [x] C04 `[control]` Record the next loop candidate in `docs/archive/priority2-track-d/remediation-candidate-note.md` as exactly one of: `stylesheet-path mitigation`, `low-risk Vite-config alignment`, or `explicit defer because only tolerance paths remain`.
  - Depends on: C03.
  - Validation: T03, T09.
  - Trace:
    - "treat the runtime CSS path notice as the primary repo-local mitigation candidate" (How We Will Execute Track D)
    - "treat the Vite CJS Node API deprecation message as a residual ecosystem/tooling notice unless a clearly low-risk repo-local alignment fix is identified without triggering broader modernization scope." (How We Will Execute Track D)
    - "prioritize repo-local evaluation of the stylesheet-path notice before investing in third-party warning churn" (Preferred Decision Policy)

- [ ] C05 `[frontend]` Execute the single candidate selected in C04 in one isolated slice: either implement the locked repo-local mitigation in the named files, or record an explicit `DEFER` outcome in `docs/archive/priority2-track-d/remediation-candidate-note.md` if C04 concluded that no eligible low-risk repo-local change remains.
  - Depends on: C04.
  - Validation: T04, T05, T06, T08, T09.
  - Trace:
    - "Implement at most one low-risk frontend build-hygiene change at a time." (How We Will Execute Track D)
    - "Preserve current frontend runtime behavior and public embed/client expectations." (Constraints)
    - "If a candidate fix would require contract changes, broad dependency modernization, or frontend architecture reshaping, stop and return to plan refinement instead of expanding Track D implicitly." (Constraints)

- [ ] C06 `[loop]` Re-run `yarn run build:frontend` after the C05 slice, capture the measured result in `docs/archive/priority2-track-d/build-frontend-after.log` and `docs/archive/priority2-track-d/warning-before-after.md`, and record the loop decision as `ACCEPT`, `REVISE`, `REVERT`, or `DEFER` with exact message-signature delta.
  - Depends on: C05.
  - Validation: T04, T05, T06, T09.
  - Trace:
    - "Re-run the frontend build after each accepted change and record..." (How We Will Execute Track D)
    - "Loop rule: do not batch multiple speculative frontend warning fixes before completing one full implement → measure → validate → decide cycle." (How We Will Execute Track D)
    - "At least one low-risk remediation candidate is either implemented and measured or explicitly deferred with recorded rationale." (Acceptance Criteria)

- [ ] C07 `[control]` Apply the Track D continuation rule after each recorded candidate outcome: if an eligible low-risk repo-local candidate still remains, return to C03 for another full C04-C06 loop; otherwise lock the final Track D disposition and proceed to documentation finalization.
  - Depends on: C06.
  - Validation: T09.
  - Trace:
    - "Stop once the in-scope frontend output is either: improved through accepted low-risk fixes, or cleanly dispositioned with documented residual notices and no justified next low-risk fix remaining." (How We Will Execute Track D)
    - "Loop rule: do not batch multiple speculative frontend warning fixes before completing one full implement → measure → validate → decide cycle." (How We Will Execute Track D)

- [ ] C08 `[docs]` Update `docs/archive/priority2-track-d/warning-register-current.md` and `docs/archive/priority2-track-d/validation-report.md` so they reflect the measured Track D outcome and clearly separate expected notices from actionable warnings.
  - Depends on: C07.
  - Validation: T07.
  - Trace:
    - "Update the frontend warning documentation and any residual-notice rationale after each measured decision." (How We Will Execute Track D)
    - "The frontend warning/noise documentation reflects the measured post-Track D message state rather than only the original Priority 2 baseline." (Acceptance Criteria)
    - "Contributors can tell from the resulting documentation which frontend build messages are expected notices versus actionable warnings." (Acceptance Criteria)

- [ ] C09 `[handoff]` If any frontend message remains after the Track D loop exits, record the residual rationale, owner, re-check trigger, and any required future modernization handoff in `docs/archive/priority2-track-d/residual-notice-note.md` without expanding Track D scope.
  - Depends on: C08.
  - Validation: T07, T08, T09.
  - Trace:
    - "Document explicit tolerance criteria for any frontend message that remains because it is upstream-owned, non-actionable on the current stack, or not worth higher-risk churn in this phase." (In Scope)
    - "Any frontend message that remains is intentionally documented with rationale, owner, and re-evaluation trigger." (Acceptance Criteria)
    - "The following work is explicitly deferred and must not be folded into Track D without a separate approved plan/checklist update..." (Track D Scope Guard)

## Validation Items

- [x] T01 `[validation]` Baseline validation: confirm `docs/archive/priority2-track-d/build-frontend-baseline.log` comes from `yarn run build:frontend` and captures exactly the three in-scope noisy message signatures with no extra unique frontend warning/noise signatures.
  - Trace:
    - "Re-confirm the current frontend build-output messages emitted by the canonical frontend production build path." (In Scope)
    - "The current frontend build-output messages are re-confirmed from the canonical frontend production build path." (Acceptance Criteria)

- [x] T02 `[validation]` Classification validation: confirm `docs/archive/priority2-track-d/warning-register-current.md` covers every current frontend message and assigns one explicit Track D disposition plus rationale, owner, and re-evaluation trigger.
  - Trace:
    - "Re-classify each in-scope frontend message using the Track D categories..." (In Scope)
    - "Every in-scope frontend build message has an explicit Track D disposition: actionable warning, informational notice, or tolerated residual notice." (Acceptance Criteria)

- [x] T03 `[validation]` Candidate-selection validation: confirm `docs/archive/priority2-track-d/remediation-candidate-note.md` ranks options using runtime-behavior safety, clarity gain, reversibility, tool-guidance alignment, and modernization-spillover risk, and that it follows the stylesheet-path-first default policy.
  - Trace:
    - "Rank low-risk remediation candidates using these factors..." (How We Will Execute Track D)
    - "prioritize repo-local evaluation of the stylesheet-path notice before investing in third-party warning churn" (Preferred Decision Policy)

- [ ] T04 `[validation]` Warning-outcome validation: compare `docs/archive/priority2-track-d/build-frontend-baseline.log` and `docs/archive/priority2-track-d/build-frontend-after.log` and record the exact frontend message count/signature delta attributable to the selected Track D candidate.
  - Trace:
    - "Frontend build message count/signature before and after each accepted Track D slice is captured." (Validation Strategy)
    - "Pass: message changes are measurable, attributable to a specific candidate change, and compared against the refreshed baseline." (Validation Strategy)

- [ ] T05 `[validation]` Artifact-contract validation: run `bash ./scripts/validate-frontend-artifacts.sh dist` after each accepted frontend build-hygiene slice and confirm the required built artifact contract still holds.
  - Trace:
    - "Track D changes must not alter public embed/client behavior or intended runtime asset behavior." (Validation Strategy)
    - "Pass: accepted changes show no observed behavior drift in the frontend build output and any required smoke/parity checks remain aligned with current expectations." (Validation Strategy)

- [ ] T06 `[validation]` Frontend embed-smoke validation: run `bash ./scripts/smoke-frontend-embed.sh dist` after each accepted frontend build-hygiene slice and confirm the built frontend still preserves baseline embed/runtime wiring expectations.
  - Trace:
    - "Preserve current frontend runtime behavior and public embed/client expectations." (Constraints)
    - "Pass: accepted changes show no observed behavior drift in the frontend build output and any required smoke/parity checks remain aligned with current expectations." (Validation Strategy)

- [ ] T07 `[validation]` Documentation/disposition validation: confirm the Track D docs artifacts distinguish expected notices from actionable warnings and that every residual frontend message has current rationale, owner, and re-check trigger.
  - Trace:
    - "Frontend warning documentation is updated to distinguish expected notices from actionable warnings and to record residual tolerance criteria." (Validation Strategy)
    - "Contributors can tell from the resulting documentation which frontend build messages are expected notices versus actionable warnings." (Acceptance Criteria)

- [ ] T08 `[validation]` Scope-conformance validation: confirm Track D does not introduce frontend feature work, visual/UI changes, major Vite or Svelte upgrades, dependency replacement for warning reduction, or silent warning suppression without rationale.
  - Trace:
    - "Frontend feature work or visual/UI changes." (Out of Scope)
    - "Major Vite, Svelte, or related dependency upgrades performed only to silence warnings." (Out of Scope)
    - "Silent suppression of frontend warnings/notices without recorded rationale." (Out of Scope)

- [ ] T09 `[validation]` Loop-control validation: confirm each attempted Track D candidate completed one full single-candidate C04-C06 cycle, that continuation occurred only when another eligible low-risk repo-local candidate remained, and that loop exit occurred only on improved output or documented residual disposition.
  - Trace:
    - "Loop rule: do not batch multiple speculative frontend warning fixes before completing one full implement → measure → validate → decide cycle." (How We Will Execute Track D)
    - "Stop once the in-scope frontend output is either: improved through accepted low-risk fixes, or cleanly dispositioned with documented residual notices and no justified next low-risk fix remaining." (How We Will Execute Track D)

## Behavior Slices

### Slice S1
- Goal: Refresh the frontend build baseline and classify every current noisy message before any remediation work.
- Items: C01, C02, T01, T02.
- Type: mechanical.

### Slice S2
- Goal: Rank repo-local candidates and execute one controlled remediation loop without expanding Track D scope.
- Items: C03, C04, C05, C06, C07, T03, T04, T05, T06, T08, T09.
- Type: behavior.

### Slice S3
- Goal: Finalize the measured Track D warning/noise story and record any residual notices for future re-evaluation.
- Items: C08, C09, T07.
- Type: mechanical.

## Conformance QC

- Missing from plan:
  - None.
- Extra beyond plan:
  - None.
- Atomicity fixes needed:
  - None identified after separating final warning/validation docs (`C08`) from residual-handoff documentation (`C09`).
- Validation mapping gaps:
  - None identified; every implementation/control item maps to one or more concrete validation items, and the validation items use existing repo commands where the plan requires evidence.
- Pass/Fail: checklist achieves plan goals:
  - Pass.
