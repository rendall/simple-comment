# Priority 2 Track D Plan Draft — Frontend Build Noise Hygiene

Status: draft

Source backlog: `docs/RepoHealthImprovementBacklog.md` (`Priority 2: Build and Bundle Warning Reduction`)

Parent plan: `docs/plans/Priority2BuildAndBundleWarningReductionPlan.md`

Related artifacts:
- `docs/archive/priority2-pr-a/artifacts/warning-register.md`
- `docs/archive/priority2-pr-a/artifacts/build-frontend.log`
- `docs/plans/Priority2TrackCWarningRemediationPlan.md`

Classification: discussion draft under `docs/norms/plan.md` for Track D refinement; not yet a checklist source of truth.

## Goal

Reduce or intentionally disposition the remaining frontend build warnings and notices so contributors can trust the frontend production build output without turning this phase into a frontend modernization project.

## Intent

Track D is the frontend counterpart to the backend warning work already defined in Priority 2.

This track should make it easier for a contributor to run the frontend production build and quickly answer two questions:

- what in the output needs action now, and
- what in the output is expected and already understood.

For this phase, success means:

- we classify each current frontend build message as actionable warning, informational notice, or accepted residual noise,
- we fix only the low-risk issues that improve signal quality without changing user-facing behavior,
- we document any residual upstream or tool-generated notices with concrete tolerance criteria,
- and we leave the frontend build output easier to read and easier to trust than the baseline.

This phase should improve build-output clarity, not expand into dependency modernization, frontend architecture work, or broad tooling migration.

## In Scope

- Re-confirm the current frontend build-output messages emitted by the canonical frontend production build path.
- Re-classify each in-scope frontend message using the Track D categories:
  - actionable warning,
  - informational notice,
  - tolerated residual notice.
- Evaluate low-risk fixes or configuration alignment for the currently known frontend messages:
  - Vite CJS Node API deprecation notice,
  - `vite-plugin-svelte` export-condition warning for `carbon-icons-svelte`,
  - runtime CSS path notice for `/css/simple-comment-style.css`.
- Prefer fixes that improve output clarity without changing frontend runtime behavior, public embed/client behavior, or asset-contract expectations.
- Document explicit tolerance criteria for any frontend message that remains because it is upstream-owned, non-actionable on the current stack, or not worth higher-risk churn in this phase.
- Define how Track D artifacts should distinguish expected notices from actionable warnings in future validation/documentation work.

## Out of Scope

- Frontend feature work or visual/UI changes.
- Frontend architecture refactors unrelated to build-output noise.
- Major Vite, Svelte, or related dependency upgrades performed only to silence warnings.
- Package replacement or broad dependency churn unless later approved through a separate plan update.
- Backend warning remediation or Netlify bundle-size optimization work.
- Silent suppression of frontend warnings/notices without recorded rationale.

## Constraints

- Preserve current frontend runtime behavior and public embed/client expectations.
- Keep changes incremental, reversible, and narrowly scoped to build-output hygiene.
- Prefer configuration alignment, path clarity, and documentation over dependency churn.
- Treat upstream-owned or ecosystem-generated notices as tolerable only when their current impact is understood and re-check conditions are recorded.
- If a candidate fix would require contract changes, broad dependency modernization, or frontend architecture reshaping, stop and return to plan refinement instead of expanding Track D implicitly.

## Current Baseline

Track D starts from the frontend warning inventory already captured in the Priority 2 baseline artifacts.

The currently known frontend build messages in scope are:

1. `The CJS build of Vite's Node API is deprecated.`
2. `[vite-plugin-svelte] WARNING: ... no exports condition for svelte`
3. `/css/simple-comment-style.css doesn't exist at build time, it will remain unchanged to be resolved at runtime`

Their current register dispositions are:

- Vite CJS deprecation notice: `DEFER-UPSTREAM`
- `carbon-icons-svelte` export-condition warning: `TOLERATE`
- runtime CSS path notice: `MITIGATE`

Track D should verify that this baseline still matches the current frontend build before any checklist is authored.

## How We Will Execute Track D

1. Re-run the canonical frontend production build and confirm the exact current message signatures and frequency.
2. Compare the refreshed output against the existing warning register so Track D starts from the real current state rather than stale assumptions.
3. For each frontend message, decide whether it is best treated as:
   - an actionable warning to fix now,
   - an informational notice that should remain visible but be documented,
   - or a tolerated residual notice with explicit rationale and re-check trigger.
4. Rank low-risk remediation candidates using these factors:
   - runtime-behavior safety,
   - clarity gain for contributors,
   - reversibility,
   - alignment with current tool guidance,
   - and risk of scope expansion into modernization work.
5. Implement at most one low-risk frontend build-hygiene change at a time.
6. Re-run the frontend build after each accepted change and record:
   - build success/failure,
   - message count/signature delta,
   - whether the output is more legible,
   - and whether any runtime-facing artifact expectations changed.
7. Update the frontend warning documentation and any residual-notice rationale after each measured decision.
8. Stop once the in-scope frontend output is either:
   - improved through accepted low-risk fixes, or
   - cleanly dispositioned with documented residual notices and no justified next low-risk fix remaining.

Loop rule: do not batch multiple speculative frontend warning fixes before completing one full implement → measure → validate → decide cycle.

## Preferred Decision Policy

When multiple options are available, prefer them in this order:

1. Repo-local configuration or path-alignment changes that reduce noise without changing runtime behavior.
2. Narrow dependency/configuration shaping within the current toolchain major versions.
3. Explicit documented tolerance when the message is upstream-owned, informational, or not worth higher-risk churn in this phase.

Do not prefer:

- broad frontend dependency modernization as a warning-cleanup shortcut,
- UI or architecture refactors that do not directly improve build-output trust,
- or hiding messages without a documented explanation of why they are acceptable.

## Risks and Mitigations

- Risk: a noise-reduction change alters runtime asset behavior or embed/client expectations.
  - Mitigation: require frontend build validation and targeted smoke/parity review before accepting any behavior-adjacent change.

- Risk: Track D turns into a frontend modernization effort because some warnings are tied to ecosystem migration paths.
  - Mitigation: make major dependency upgrades and architecture refactors explicitly out of scope for this phase.

- Risk: informational notices are misclassified as harmless when they actually signal future breakage risk.
  - Mitigation: require each tolerated message to include a concrete rationale and re-check trigger rather than a vague acceptance note.

- Risk: build output remains noisy even after low-risk fixes are exhausted.
  - Mitigation: document the remaining expected notices clearly so contributors can distinguish them from new actionable warnings.

## Acceptance Criteria

1. The current frontend build-output messages are re-confirmed from the canonical frontend production build path.
2. Every in-scope frontend build message has an explicit Track D disposition: actionable warning, informational notice, or tolerated residual notice.
3. At least one low-risk remediation candidate is either implemented and measured or explicitly deferred with recorded rationale.
4. Any accepted Track D change preserves current frontend runtime behavior and public embed/client expectations.
5. The frontend warning/noise documentation reflects the measured post-Track D message state rather than only the original Priority 2 baseline.
6. Any frontend message that remains is intentionally documented with rationale, owner, and re-evaluation trigger.
7. Track D does not introduce major dependency modernization, frontend architecture refactoring, or silent message suppression.
8. Contributors can tell from the resulting documentation which frontend build messages are expected notices versus actionable warnings.

## Validation Strategy

Required evidence types for Track D:

- **Contract/parity evidence**
  - Track D changes must not alter public embed/client behavior or intended runtime asset behavior.
  - Pass: accepted changes show no observed behavior drift in the frontend build output and any required smoke/parity checks remain aligned with current expectations.
  - Fail: a change removes a warning by changing runtime behavior, output contracts, or asset expectations without explicit plan approval.

- **Non-functional evidence**
  - Frontend build message count/signature before and after each accepted Track D slice is captured.
  - Pass: message changes are measurable, attributable to a specific candidate change, and compared against the refreshed baseline.
  - Fail: warning/noise reductions are claimed without before/after evidence or without signature-level comparison.

- **Documentation/process evidence**
  - Frontend warning documentation is updated to distinguish expected notices from actionable warnings and to record residual tolerance criteria.
  - Pass: docs and evidence artifacts match the measured current build state and identify rationale plus re-check triggers for residual notices.
  - Fail: docs describe an outdated message state, fail to separate notices from warnings, or leave residual messages undocumented.

## Planned Artifacts

Track D will likely need to produce or update artifacts such as:

- a refreshed frontend build log for the Track D baseline,
- a frontend warning/noise register or Track D-specific warning note,
- one or more remediation candidate/decision notes,
- a before/after frontend message comparison,
- and a residual-notice note if any upstream/tool messages remain.

Artifact paths should be finalized during refinement before checklist authoring.

## Open Questions / Assumptions

- Assumption: the current frontend warning set can be improved or cleanly dispositioned without changing user-facing behavior.
- Assumption: at least one current frontend message is either fixable through low-risk config alignment or documentable as intentional residual noise.
- Open question: should Track D retain the parent plan's distinction between warnings and notices verbatim, or define a stricter repo-local message taxonomy for future validation checks?
- Open question: does the Vite CJS deprecation message require repo-local config migration now, or should it stay tolerated until a later toolchain-modernization phase?
- Open question: is the runtime CSS path notice best addressed through asset-path clarity, or is it an intentional runtime-resolution pattern that should simply be documented more clearly?
- Open question: should the `carbon-icons-svelte` package warning remain tolerated unless the dependency is already changing for another approved reason?

## Track D Scope Guard

The following work is explicitly deferred and must not be folded into Track D without a separate approved plan/checklist update:

- major Vite or Svelte upgrade work,
- frontend dependency replacement done mainly for warning reduction,
- embed/client contract changes,
- frontend feature or UI work,
- CI gating expansion beyond what is necessary to validate the Track D outcome.

If a proposed fix requires one of the above to succeed, Track D should stop, document the blocker, and return to plan refinement rather than silently expanding scope.

## Conformance QC (Discussion Draft)

- Intent clarity issues:
  - none observed in the current draft; the user-facing outcome is stated in plain language.
- Missing required sections:
  - none (`Goal`, `Intent`, `In Scope`, `Out of Scope`, and `Acceptance Criteria` are present).
- Ambiguities/assumptions to resolve:
  - whether the Vite CJS deprecation notice is in-scope for repo-local remediation now or should be treated as an accepted residual notice,
  - whether the runtime CSS path message reflects a correct intentional asset pattern or a fixable clarity problem,
  - and whether Track D needs a stricter message taxonomy before checklist authoring.
- Validation strategy gaps:
  - no structural gap, but the exact smoke/parity evidence for behavior-adjacent asset-path changes should be confirmed during refinement.
- Traceability readiness:
  - mostly ready; the draft contains quoteable statements for checklist conversion once the open questions above are settled.
- Pass/Fail: ready for checklist authoring:
  - **Fail for now** pending collaborator confirmation of intended outcomes, scope boundaries, acceptance criteria interpretation, and the unresolved Track D ambiguities listed above.
