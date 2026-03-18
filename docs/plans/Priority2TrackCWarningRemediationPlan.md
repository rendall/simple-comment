# Priority 2 Track C Plan — Warning Remediation (Backend First)

Status: active

Source backlog: `docs/RepoHealthImprovementBacklog.md` (`Priority 2: Build and Bundle Warning Reduction`)

Parent plan: `docs/plans/Priority2BuildAndBundleWarningReductionPlan.md`

Related artifacts:
- `docs/archive/priority2-pr-a/artifacts/warning-register.md`
- `docs/archive/priority2-track-b/build-backend-after.clean.log`
- `docs/archive/priority2-track-b/exit-decision.md`
- `docs/archive/priority2-track-b/watchlist.md`

## Goal

Reduce or intentionally disposition the remaining backend build warnings so contributors can trust Netlify function build output without mixing this phase with MongoDB modernization work.

## Intent

Track B already reduced backend function size enough to exit active size optimization.

Track C should now focus on the two remaining backend webpack warnings that come from MongoDB's optional dependency path.

For this phase, success means:

- we evaluate the latest upstream-supported handling for the current stack,
- we prefer low-risk bundler-side remediation over dependency churn,
- we do not introduce a MongoDB major-version upgrade just to reduce warning count,
- and any warning that remains is explicitly documented with rationale, owner, and re-check trigger.

This phase should improve build-output trust, not expand into a backend dependency modernization project.

## In Scope

- Re-confirm the current backend warning signatures and call path from the canonical backend build.
- Evaluate current upstream-supported handling for MongoDB optional dependency warnings on the existing stack.
- Record the sources of any upstream or external guidance used for Track C decisions so the resulting checklist can require citation-backed remediation notes.
- Compare available backend-first remediation options for the MongoDB warning path, including:
  - webpack config adjustments for optional dependencies,
  - dependency/configuration alignment that avoids non-actionable optional encryption resolution noise without changing runtime behavior,
  - targeted ignore/plugin handling only with explicit justification.
- Implement the lowest-risk remediation option that aligns with current upstream guidance and current phase constraints.
- Re-run backend build validation after each remediation slice and compare warning count/signature against baseline.
- Update warning documentation and Track C evidence artifacts to reflect the selected disposition.
- Record any residual backend warning as intentionally accepted only if elimination would require out-of-scope modernization or unacceptable runtime risk.

## Out of Scope

- MongoDB major-version upgrades or broader dependency modernization.
- Installing `mongodb-client-encryption` unless runtime requirements in this repository explicitly require it.
- Frontend build-warning cleanup.
- Broad webpack/toolchain migrations unrelated to the MongoDB backend warning path.
- Custom/prebuilt function packaging pipelines.
- Silent warning suppression without recorded rationale and validation evidence.

## Constraints

- Preserve current runtime behavior and API contracts.
- Keep changes incremental, reversible, and backend-scoped.
- Prefer official MongoDB and webpack guidance that applies to the current dependency major versions over speculative future-state design.
- Do not convert Track C into a modernization phase in order to chase warning-count reduction.
- If the lowest-risk current-stack approach cannot eliminate a warning cleanly, document and tolerate it explicitly rather than forcing higher-risk dependency churn.

## Current Baseline

Track C starts from the post-Track B state:

- backend bundle size optimization has reached its good-enough stop condition and handed off to Track C/E/F,
- backend build still emits exactly two MongoDB-related warnings,
- both warning signatures originate from `node_modules/mongodb/lib/utils.js`,
- both warning register entries are currently classified as `MITIGATE`.

The warning signatures currently in scope are:

1. `Critical dependency: the request of a dependency is an expression`
2. `Module not found: Error: Can't resolve 'mongodb-client-encryption'`

## How We Will Execute Track C

1. Re-capture the canonical backend warning evidence and confirm the exact warning signatures still match the current register.
2. Review current upstream guidance relevant to the current stack for MongoDB optional encryption handling and webpack optional dependency treatment.
3. Record the guidance sources consulted for Track C decisions, including enough detail for later reviewers to verify what guidance was followed.
4. Rank remediation candidates by:
   - alignment with upstream guidance,
   - runtime-behavior safety,
   - reversibility,
   - warning-reduction impact,
   - and modernization spillover risk.
5. Implement one low-risk backend-first remediation slice.
6. Measure the backend build result after that slice:
   - build success/failure,
   - warning count/signature delta,
   - any artifact-shape regressions that matter for Track C.
7. Run required parity/smoke validation for accepted remediation slices.
8. Decide `ACCEPT`, `REVISE`, `REVERT`, or `DEFER` for the candidate.
9. Update the warning register, Track C evidence notes, and residual-warning rationale based on the measured result.
10. Stop once the backend warning path is either:
   - cleanly remediated with acceptable risk, or
   - explicitly dispositioned as a documented residual warning with owner and re-check trigger.

Loop rule: do not batch multiple remediation approaches before completing one full implement → measure → validate → decide cycle.

## Preferred Decision Policy

When multiple options are available, prefer them in this order:

1. Current-stack bundler/configuration handling that matches official upstream guidance and does not change runtime behavior.
2. Narrow dependency/configuration shaping within the current major-version stack.
3. Explicit warning tolerance with documentation when elimination would require out-of-scope modernization or higher-risk runtime change.

Do not prefer:

- MongoDB major upgrades as a warning-remediation shortcut,
- package installation for unused optional features,
- or custom packaging complexity when a simpler bundler-side option is available.

## Risks and Mitigations

- Risk: a warning-remediation change hides a real runtime dependency problem.
  - Mitigation: require backend build success plus parity/smoke validation before accepting any remediation.

- Risk: Track C quietly turns into a dependency modernization effort.
  - Mitigation: make MongoDB major-version upgrades and broad tooling migration explicitly out of scope.

- Risk: upstream guidance is ambiguous across driver versions.
  - Mitigation: anchor decisions to guidance that applies to the current dependency line and record when a future modernization phase should revisit the choice.

- Risk: warning count remains unchanged after low-risk options are exhausted.
  - Mitigation: document residual warning rationale, owner, and re-check trigger instead of forcing a brittle fix.

## Acceptance Criteria

1. The backend MongoDB warning path is re-evaluated against current upstream-supported practice for the existing stack.
2. At least one low-risk remediation candidate is assessed through an implement-or-explicit-defer decision with recorded rationale.
3. Any accepted Track C remediation preserves current runtime behavior and API contracts.
4. Backend warning count/signature outcome after Track C is captured and compared against the pre-Track C baseline.
5. The warning register and Track C evidence artifacts reflect the final disposition of the backend MongoDB warnings.
6. Any upstream or external guidance used to support a Track C decision is cited in the relevant planning/evidence artifacts.
7. No MongoDB major-version upgrade or unrelated modernization work is introduced in this phase.
8. Any warning that remains is intentionally documented with owner and re-evaluation trigger.

## Validation Strategy

Required evidence types for Track C:

- **Contract/parity evidence**
  - Backend build remediation must not introduce API-contract or runtime-behavior drift.
  - Pass: accepted remediation slices keep required backend build/parity checks green with no observed behavior regression.
  - Fail: any accepted slice changes runtime behavior, breaks build output, or introduces new contract drift.

- **Non-functional evidence**
  - Backend warning count/signature before and after each remediation slice is captured.
  - Pass: warning outcome is measurable and tied to the exact remediation candidate that produced it.
  - Fail: warning changes are undocumented, not attributable, or not compared to baseline.

- **Documentation/process evidence**
  - Warning disposition artifacts are updated to match the actual measured Track C result.
  - Pass: warning register entries, residual-warning rationale, re-check triggers, and guidance-source citations are current and internally consistent.
  - Fail: residual warnings remain undocumented, docs describe a superseded warning state, or cited guidance is missing from the decision record.

## Planned Artifacts

Track C should produce or update artifacts in `docs/plans/artifacts/` and related plan-owned documentation, including:

- canonical backend warning evidence for the Track C run,
- a guidance-sources note covering the upstream or external references used in Track C decision-making,
- a remediation candidate/decision note,
- a before/after warning comparison,
- and updated residual-warning/watchlist notes when needed.

Artifact paths may be finalized in the checklist so long as they remain within Track C scope.

## Open Questions / Assumptions

- Assumption: the repository does not currently require client-side field level encryption or queryable encryption at runtime.
- Assumption: the current MongoDB warning path can be meaningfully improved or cleanly dispositioned without a major driver upgrade.
- Open question: does the selected current-stack remediation remove both warning signatures, or only the optional-encryption resolution warning?
- Open question: should Track C treat the dynamic-require warning as eliminable on the current stack or as a tolerable upstream-pattern warning once the optional dependency path is handled?

## Track C Scope Guard

The following work is explicitly deferred and must not be folded into Track C without a separate approved plan/checklist update:

- MongoDB 6.x/7.x migration work
- broader backend dependency modernization
- frontend warning cleanup
- CI gating expansion beyond what is necessary to validate the Track C warning outcome

If a proposed fix requires one of the above to succeed, Track C should stop, document the blocker, and hand it forward rather than silently expanding scope.

## Conformance QC (Plan)

- Intent clarity issues: none observed; the plan is phase-specific and written in plain language.
- Missing required sections: none (`Goal`, `Intent`, `In Scope`, `Out of Scope`, `Acceptance Criteria`, and `Validation Strategy` are present).
- Ambiguities/assumptions to resolve: whether both MongoDB warning signatures are realistically removable on the current stack may remain an execution-time discovery.
- Validation strategy gaps: none for the current warning-remediation scope.
- Traceability readiness: ready; statements are quoteable for checklist authoring.
- Pass/Fail: ready for checklist authoring — **Pass**.
