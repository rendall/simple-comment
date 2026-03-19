# Priority 3 Plan: Test Suite Signal Quality

Status: active

Source: `docs/RepoHealthImprovementBacklog.md` → `Priority 3: Test Suite Signal Quality`

Classification: plan artifact (not an implementation checklist)

## Goal

Improve the test suite so contributors can trust a green result as meaningful protection rather than a mix of strong coverage, placeholder checks, and environment-sensitive noise.

## Intent

Contributors should be able to explain what the test suite is protecting, which failures matter, and which command path is authoritative.

The suite should keep behavior- and contract-level protection that matters to the product, while removing or replacing tests that only pad counts, overfit internal structure, or fail due to incidental timing or host-environment variation.

Where tests remain expensive or environment-sensitive, that cost should be justified and the execution path should be explicit.

## Current Evaluation Baseline

Observed from the current repository test inventory and local validation attempts on 2026-03-19:

- `yarn test` did not provide a clean end-to-end signal in this environment because backend Jest execution stopped before assertions ran when `mongodb-memory-server` attempted to fetch a MongoDB binary for this host/platform combination. This observation should be treated as environment-specific until it is revalidated against maintainer and GitHub-runner behavior.
- `scripts/ci-local.sh` already establishes a more specific backend MongoDB binary download path than an unadorned `yarn test` invocation, which means the practical test authority may differ by command path today even if the underlying URL works correctly in maintainer and GitHub environments.
- `yarn test:frontend` mostly passes, but currently fails on fixed wall-clock thresholds in `src/tests/frontend/frontend-utilities.test.ts` for `threadComments`, indicating brittle non-functional expectations in the ordinary unit-test path.
- The suite contains at least one obvious placeholder test (`src/tests/frontend/hello-world.test.ts`) that protects no repository behavior.
- Several suites appear to provide meaningful product or contract value already, especially backend contract/configuration coverage (`api.test.ts`, `setup-env.contract.test.ts`, `env-utils.test.ts`, `secrets.test.ts`) and backend service/integration coverage (`MongodbService.test.ts`) once backend execution is stable.
- Some frontend state-machine tests provide regression value but are relatively coupled to internal machine shape (allowed-event lists and exact state structure) rather than higher-level user workflows.

This baseline is time-bound and should be revalidated if execution begins significantly later.

## In Scope

- Audit the current backend and frontend test files for signal quality, runtime cost, brittleness, and duplication.
- Classify each test file or test cluster as one of:
  - keep as-is
  - refine/refactor
  - replace with behavior-oriented coverage
  - remove as placeholder/low-value
- Remove or replace clearly placeholder coverage that does not exercise repository behavior.
- Rework brittle non-functional assertions in the ordinary unit/integration test path when they do not represent a documented product requirement.
- Clarify the authoritative local/CI command path for backend and frontend tests so contributors can interpret failures consistently.
- Preserve and strengthen existing contract-, config-, and behavior-oriented tests that already protect meaningful runtime expectations.
- Decide whether coverage reporting and/or thresholds should be introduced, deferred, or rejected for this phase, with rationale tied to current suite signal quality.
- Partition future implementation into reviewable slices so backend test-path stabilization, placeholder cleanup, and frontend test-value improvements can be executed without accidental scope expansion.

## Out of Scope

- Broad feature development unrelated to test quality.
- Runtime behavior changes made only to satisfy weak tests.
- Major framework/platform migrations framed as test cleanup.
- Rewriting the entire test suite in one phase.
- Performance benchmarking infrastructure beyond what is needed to decide whether existing timing assertions belong in normal test execution.
- Coverage-threshold ratcheting without first evaluating and pruning low-signal tests.

## Constraints

- Preserve current runtime behavior and public/API contracts unless a later approved phase explicitly changes them.
- Prefer behavior- and contract-oriented coverage over implementation-shape assertions when both provide equivalent protection.
- Do not remove low-signal tests without either:
  - explicit rationale that the test protects nothing meaningful, or
  - replacement coverage that better protects the intended behavior.
- Keep backend test-path clarification scoped to making the intended execution path authoritative and reproducible; do not smuggle in unrelated MongoDB/platform modernization or assume a repo-wide defect from one environment-specific failure.
- Keep plan slices reviewable and reversible.

## Risks and Mitigations

- Risk: removing weak tests could accidentally reduce protection.
  - Mitigation: require each removal to state whether coverage is unnecessary or what replacement test covers the intended behavior.

- Risk: timing-test cleanup could become an unbounded performance-optimization effort.
  - Mitigation: separate “remove brittle timing assertions from ordinary Jest” from any future performance work unless a documented performance contract exists.

- Risk: backend test-path clarification could overreact to an environment-specific failure and drive unnecessary repository changes.
  - Mitigation: require revalidation against maintainer and CI behavior before treating local Mongo binary-resolution issues as repo-wide defects, and limit scope to clarifying the intended execution path already implied by repo validation scripts.

- Risk: coverage thresholds could create false confidence if added before low-value tests are addressed.
  - Mitigation: make coverage-policy work a decision slice that follows the initial test-value audit.

## Open Questions / Assumptions

- Does backend test-path clarification belong inside this priority, or should it be limited to documenting the authoritative command path unless maintainer/CI evidence shows a broader repository issue?
- Are any existing timing assertions intended to represent a user-visible non-functional requirement, or are they only heuristic regression guards?
- Should state-machine suites remain at machine-shape granularity, or should some protections move to scenario-level workflow tests?
- Is the desired output of this priority a cleaner suite only, or also a documented test taxonomy/contributor guide?

## Work Plan

Execution order for checklist derivation: Track A → Track B → Track C → decision gate → optional Track D.

### Track A — Test Inventory and Classification

1. Capture the current test inventory across backend and frontend suites.
2. Classify each file or cohesive test cluster by:
   - protection target (behavior, contract, config, smoke, placeholder, non-functional)
   - signal quality
   - brittleness
   - runtime cost
   - recommended disposition (`KEEP`, `REFINE`, `REPLACE`, `REMOVE`)
3. Record the rationale for each `REFINE`, `REPLACE`, and `REMOVE` decision.
4. Identify overlaps or duplicate assertion surfaces worth consolidating later.

### Track B — Authoritative Test Path and Environment Clarification

1. Document and validate the intended backend/frontend local command path that contributors should treat as authoritative.
2. Revalidate whether any gap between ordinary local invocation and CI/local-parity invocation reflects a true repository problem or only an environment-specific constraint.
3. Only if that gap is confirmed as repository-relevant, ensure backend test failures reach behavior assertions rather than failing prematurely on incidental setup/binary-resolution issues.
4. Record any remaining environment-specific prerequisites or known limitations in a contributor-visible location if they cannot be removed in-scope.

### Track C — Low-Signal Cleanup and Replacement Coverage

1. Remove obvious placeholder tests that protect no repository behavior.
2. Replace brittle timing-based assertions in ordinary test execution with:
   - correctness assertions,
   - more stable structural/behavior checks, or
   - explicit deferment to a separately justified performance-validation path.
3. Refine over-coupled implementation-shape tests where higher-level workflow assertions provide clearer protection.
4. Preserve or expand high-value contract/config/integration coverage where the audit shows disproportionate value.

### Decision Gate — Coverage Policy

After Tracks A-C, decide whether this priority should also implement one of the following:

- no coverage reporting/threshold change in this phase,
- coverage reporting only,
- lightweight thresholding for a narrow agreed surface,
- deferred follow-on plan.

The decision must be justified in terms of current suite signal quality and contributor trust, not raw percentage targets alone.

### Optional Track D — Runtime and Structure Optimization

Only if audit evidence shows material contributor pain after Tracks A-C:

1. Reduce unnecessary test runtime in clearly identified suites.
2. Reorganize tests by boundary or domain where that improves maintainability without changing behavior.

This track is optional and should not be folded into checklist scope unless the approved plan explicitly carries it forward.

## Acceptance Criteria

- The repository has an approved audit of current test files/clusters with explicit disposition (`KEEP`, `REFINE`, `REPLACE`, `REMOVE`) and rationale for each non-keep case.
- Placeholder tests that do not exercise repository behavior are either removed or explicitly slated for replacement in approved checklist scope.
- Brittle ordinary-path timing assertions are either removed, replaced with behavior-relevant coverage, or explicitly justified as in-scope non-functional requirements.
- Contributors can identify the authoritative local/CI test command path and understand why that path is authoritative.
- The authoritative backend test path is revalidated against maintainer and/or CI behavior before any environment-specific local failure is treated as repository work; any remaining blocker is explicitly documented and accepted before implementation closeout.
- High-value contract/config/integration protections are preserved or improved.
- A clear decision is recorded on coverage reporting/thresholds for this priority (adopt now, adopt partially, defer, or reject).
- The resulting checklist can be partitioned into atomic, reviewable items without mixing backend path stabilization, low-signal cleanup, and coverage-policy decisions into one undifferentiated change.

## Validation Strategy

This plan changes validation trust and potentially test/build outputs, so checklist authoring must carry explicit evidence requirements.

Required evidence types:

### Contract / Parity

- Demonstrate the authoritative test command path used for the phase.
- Show whether backend and frontend suites reach their intended assertion surfaces under that path in the relevant execution environments.
- If command-path behavior differs before/after a change, capture the reason and the intended final source of truth.
- Do not treat a local-only Mongo binary-resolution failure as repository evidence unless it is corroborated in maintainer and/or CI-relevant environments.

Pass condition: contributors can run the documented command path and interpret failures as meaningful validation signals rather than setup ambiguity, and any environment-specific exceptions are explicitly called out.

### Unit / Integration

- For each replaced or removed low-signal test, show either:
  - the removal rationale proving it had no meaningful protection value, or
  - the replacement behavior/integration test that better covers the intended behavior.
- For state-machine or utility test refactors, show that important workflow/behavior coverage still exists after refactoring.

Pass condition: meaningful behavior/config/contract protections remain green and the suite has less placeholder/brittle coverage than before.

### Non-Functional (Only When Explicitly In Scope)

- If any timing- or runtime-based checks remain in normal test execution, document the requirement they protect, the chosen threshold, and why the environment is stable enough for that threshold.
- If runtime reduction work is included, compare before/after command durations only for the explicitly targeted suites.

Pass condition: non-functional assertions exist only where they represent a documented requirement or an explicitly approved optimization slice.

## Traceability Readiness Notes

This plan is intended to support later checklist authoring by keeping:

- stable section headings,
- explicit in-scope vs out-of-scope boundaries,
- concrete acceptance criteria,
- and a checklist-ready validation strategy.
