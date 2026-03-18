# Priority 2 Plan: Build and Bundle Warning Reduction

Status: active

Source: `docs/RepoHealthImprovementBacklog.md` → `Priority 2: Build and Bundle Warning Reduction`

Supplemental research input: `docs/plans/Priority2-Netlify-Bundle-Research-Guide.md` (external Netlify guidance summary for Track B execution choices)

Classification: plan artifact (not an implementation checklist)

## Goal

Reduce avoidable build warnings and improve Netlify function bundle ergonomics so build output is easier to trust and operationally maintain.

## Intent

Contributors should be able to run the production build and quickly tell whether output is healthy.

Warnings that remain should be intentionally accepted and documented, not accidental noise.

Netlify function artifacts should be smaller where practical, or explicitly justified when large size is expected.

## Current Evaluation Baseline

Observed from local `yarn run build` output:

- Netlify function bundles (`topic.js`, `auth.js`, `comment.js`, `gauth.js`, `user.js`, `verify.js`) are each reported as ~2.94 MiB and flagged `[big]`.
- Webpack reports a MongoDB critical dependency warning in `mongodb/lib/utils.js` (`the request of a dependency is an expression`).
- Webpack reports `Can't resolve 'mongodb-client-encryption'` from `mongodb/lib/utils.js`.
- Frontend build emits non-fatal warnings/noise (Vite CJS API deprecation notice, package `svelte` export-condition warning, and runtime CSS path notice).

This plan treats the above as initial inventory requiring classification before any warning is suppressed, tolerated, or fixed.

Baseline note: these observations are time-bound and should be re-captured if execution begins significantly later.

## In Scope

- Create a complete warning inventory for production build steps used by `yarn run build`.
- Classify each warning as: eliminate, mitigate, tolerate with justification, or external/upstream.
- Reduce backend function bundle size where low-risk opportunities are available.
- Add lightweight artifact-size observability so regressions are visible in CI/local validation.
- Document remaining known warnings with rationale and owner/follow-up trigger.
- Add/adjust build validation checks for warning and size expectations defined by this plan.

## Out of Scope

- Broad runtime/platform migrations (major Node, framework, or bundler upgrades).
- Frontend architecture refactors unrelated to warning/bundle outcomes.
- Feature work unrelated to build output quality.
- Suppressing warnings without explicit rationale and recorded decision.

## Constraints

- Preserve current runtime behavior and API contracts.
- Keep changes incremental and reversible.
- Prefer configuration and dependency-shaping changes over sweeping architectural rewrites.
- Any intentional warning tolerance must be documented with concrete reason and re-evaluation trigger.

## Work Plan (Everything Needed to Fulfill Priority 2)

Execution order for checklist derivation: Track A → Track B/C (iterative) → Track D → Track E → Track F → Track G.

### Track A — Baseline and Classification

1. Capture canonical build logs for backend and frontend production builds.
2. Produce a warning register with one row per unique warning:
   - emitting tool/stage
   - exact warning text/signature
   - source module/path
   - frequency (once/per bundle/per entry)
   - risk category (correctness, deploy risk, noise, ecosystem/deprecation)
3. Define disposition for each warning:
   - `ELIMINATE` (must be fixed now)
   - `MITIGATE` (reduce impact or frequency now)
   - `TOLERATE` (accepted for now with justification)
   - `DEFER-UPSTREAM` (blocked on dependency/tooling maintainer)
4. Record disposition rationale and acceptance owner.

### Track B — Backend Bundle Size Reduction

5. Measure per-function artifact composition (largest modules, shared duplication).
6. Identify low-risk size levers, such as:
   - dependency import narrowing/tree-shaking opportunities
   - externalizing optional modules where platform-compatible
   - factoring common backend logic for better bundling characteristics
7. Implement selected size optimizations in small slices.
8. Re-measure artifacts and compare against baseline.
9. Accept or revert each optimization based on measurable size reduction and no behavior drift.

#### Track B Execution Strategy (Netlify-Informed)

Track B implementation should prioritize options that are explicitly documented by Netlify and avoid high-complexity custom packaging work unless lower-risk options fail.

**B1. Diagnostic-first artifact analysis**

- Use canonical build logs as first-class input for identifying largest packaged modules/files per function.
- Ensure artifact composition tables include both bundle totals and top contributors to avoid optimizing low-impact modules.
- Record per-function duplication patterns to identify shared heavy dependencies repeated across handlers.

**B2. Optimization ladder (highest impact / lowest risk first)**

1. Verify bundler mode and align backend function bundling toward Netlify-recommended smaller-artifact paths where compatible.
2. Reduce oversized dependency footprint first (replace, narrow imports, or isolate heavy optional code paths).
3. Tighten function packaging inputs to include only runtime-required files.
4. Apply explicit exclusions for known dead-weight paths if logs show accidental inclusion.
5. Split oversized multi-purpose handler responsibilities only if prior steps cannot provide sufficient reduction.
6. Use compatibility-oriented externals only for modules that cannot be safely inlined.
7. Escalate to custom/prebuilt bundling pipeline only when lower-risk levers are exhausted and evidence shows remaining size risk.

**B3. Decision policy per candidate optimization**

For every Track B change candidate, record:

- hypothesis (what is expected to shrink and why),
- risk class (`LOW`, `MEDIUM`, `HIGH`),
- expected net size impact (per-function and aggregate),
- runtime parity validation mapping,
- revert trigger.

Only merge candidates that satisfy both:

- measurable size benefit (or explicit prevention of near-term regression risk), and
- zero observed behavior/API drift under required parity checks.

**B4. Function-level targeting policy**

- Prioritize optimizations that reduce size across multiple handlers simultaneously (shared dependency wins).
- If only one or two functions dominate growth, optimize those entries first and defer global refactors.
- Treat function splitting as a targeted mitigation, not a default architecture rewrite.

**B5. Evidence requirements for Track B completion**

Track B is not complete until all of the following are present:

- before/after per-function size table,
- before/after top-contributor table (largest modules/files),
- optimization ledger (accepted/reverted candidates + rationale),
- parity validation outputs for each accepted candidate,
- explicit rationale for any unchanged `[big]`-flagged artifacts.

**B6. Iteration feedback loop (required in checklist conversion)**

Each implementation slice must run a closed-loop cycle:

1. **Select** one optimization candidate from the ladder.
2. **Implement** only that candidate in an isolated, reversible change.
3. **Measure** size deltas and warning-signature deltas against baseline.
4. **Validate** runtime/API parity using required checks.
5. **Decide** `ACCEPT`, `REVISE`, or `REVERT`.
6. **Record** outcome in optimization ledger and update next-candidate priority.
7. **Sync docs** by updating warning/register evidence if warning signatures or artifact composition assumptions changed.

Loop rule: do not batch multiple high-risk candidates before one full measure/validate/decide cycle is complete.

**B7. Good-enough exit condition for Track B**

Track B optimization work may stop (and move to Track C/E/F) when all of the following hold:

- No remaining `LOW`/`MEDIUM` risk candidate is forecast to produce material size improvement.
- Last two accepted iterations produce only marginal net improvement (diminishing-return signal) using pre-declared checklist thresholds.
- Remaining opportunities are `HIGH` risk or architecture-expanding relative to plan constraints.
- Current artifact state is either improved from baseline or explicitly justified with evidence.
- A follow-up watchlist exists so future regressions can re-open Track B work.

### Track C — Warning Remediation (Backend First)

10. Address MongoDB warning path by evaluating available options:
    - webpack config adjustments for optional dependencies
    - dependency configuration to avoid optional encryption resolution warning
    - targeted ignore/plugin approach only with documented justification
11. Validate warning count/signature after each backend remediation.
12. Document unresolved backend warnings with explicit rationale and re-check trigger.

### Track D — Frontend Build Noise Hygiene

13. Classify frontend warnings/notices as true warnings vs informational output.
14. For actionable frontend warnings, apply low-risk fixes or config alignment.
15. For non-actionable upstream/tool notices, document tolerance criteria.
16. Ensure frontend build output has clear separation between expected notices and actionable warnings.

### Track E — Guardrails and Documentation

17. Add a build-health section to project docs describing:
    - expected warning baseline
    - how to evaluate new warnings
    - when bundle growth requires action
18. Add a validation command/script (or CI step) that captures:
    - warning count/signature diff against baseline
    - per-function size summary
19. Define pass/fail rules for build-health checks.
20. Ensure PR workflow references these checks so new debt does not silently enter.

### Track F — Finalization

21. Produce final before/after comparison (warning inventory + bundle size table).
22. Confirm all accepted residual warnings are documented and intentionally owned.
23. Mark plan acceptance criteria complete with evidence links/command outputs.

### Track G — Plan-to-Checklist Readiness

24. Convert this plan into an atomic checklist under `docs/norms/checklist.md` with traceability quotes from this plan.
25. Ensure each checklist item has explicit validation mapping (or dependency on validation items).
26. Encode the Track B closed-loop iteration model (`select → implement → measure → validate → decide → record`) as mandatory checklist flow control.
27. Define checklist-level "good enough" exit criteria for Track B so execution can stop intentionally instead of drifting into open-ended optimization.
28. Define checklist-level quantitative thresholds for "material" and "marginal" bundle-size change before the first optimization slice is executed.
29. Mark any proposed add-ons as out-of-plan until explicitly approved.

## Acceptance Criteria

1. A warning register exists and covers all unique warnings from production build output.
2. Every warning has an explicit disposition (`ELIMINATE`, `MITIGATE`, `TOLERATE`, or `DEFER-UPSTREAM`) with rationale.
3. Backend function artifact sizes are either reduced from baseline or explicitly justified if unchanged.
4. Build-health validation checks are documented and runnable by contributors.
5. New warnings and major bundle-size regressions are detectable through defined validation workflow.
6. Remaining accepted warnings are intentionally documented with owner and re-evaluation trigger.
7. A checklist-ready decomposition exists that preserves this plan's scope boundaries and validation expectations.
8. Track B evidence includes accepted/reverted optimization decisions with measurable impact and parity proof.
9. Checklist artifacts include an explicit Track B feedback-loop record and a satisfied good-enough exit condition.
10. Track B checklist defines and applies quantitative "material"/"marginal" size-change thresholds consistently across all iterations.

## Validation Strategy

Required evidence for plan completion:

- **Contract/parity evidence**
  - Production build completes successfully before/after changes.
  - No API-contract or runtime-behavior drift introduced by warning/size work.
- **Non-functional evidence**
  - Warning inventory diff shows reductions or explicit dispositioning of unchanged warnings.
  - Backend bundle size table shows per-function before/after values and net change.
- **Integration/smoke evidence**
  - Existing backend/frontend smoke-level validation still passes after build hygiene changes.
- **Documentation evidence**
  - Contributor-facing build-health guidance exists and matches actual validation commands.

Pass condition: all evidence categories above are present and acceptance criteria are satisfied.

Fail condition: missing warning disposition coverage, undocumented residual warnings, or unmeasured bundle-size impact.

## Risks and Mitigations

- Risk: warning suppression hides real defects.
  - Mitigation: forbid suppression without warning-register entry and rationale.
- Risk: size optimizations alter runtime behavior.
  - Mitigation: ship in small slices with parity validation after each slice.
- Risk: upstream dependency warnings cannot be eliminated quickly.
  - Mitigation: document owner + trigger for re-evaluation, and prevent warning baseline drift.

## Open Questions / Assumptions

- Assumption: backend bundle size and warning quality can be improved without major platform migration.
- Open question: what bundle-size threshold should count as regression for PR gating (absolute MiB delta, percentage delta, or both)?
- Open question: should warning gate be exact-signature based or category/count based?
- Open question: which warnings are acceptable as ecosystem-deprecation notices vs must-fix debt?
- Open question: at what point should custom/prebuilt bundling be allowed versus remaining on default Netlify packaging flow?
- Open question: what quantitative threshold defines "marginal" size improvement for the Track B good-enough stop rule?
