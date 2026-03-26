# Priority 4 Plan — Dependency Modernization

Status: archived

Source backlog: `docs/RepoHealthImprovementBacklog.md` (`Priority 4: Dependency Modernization`)

Classification: formal plan artifact under `docs/norms/plan.md`

## Goal

Reduce dependency-related confidence drag in the repository by upgrading low-risk packages first, partitioning higher-risk upgrade work into separate follow-on slices, and using repo-aware tooling signals instead of broad "upgrade everything" reasoning.

## Intent

This Priority 4 phase should fix real dependency problems now without turning one repo-health effort into a destabilizing ecosystem rewrite.

For this phase, success means:

- contributors can point to a current, reviewable inventory of outdated and suspicious dependencies,
- the first implementation checklist performs real dependency modernization work rather than another generic stabilization pass,
- low-risk refreshes are separated from high-risk ecosystem migrations,
- major Svelte and MongoDB upgrades are explicitly deferred into later dedicated phases,
- the implementation loop upgrades dependencies in a logical sequence and runs validation after each accepted upgrade step,
- tool output such as `yarn outdated` and `yarn knip` is used as evidence, but not treated as self-justifying truth,
- and follow-on major-version work is named and deferred explicitly instead of being smuggled into the first slice.

This phase should improve dependency trust, not collapse test-stack, lint/tooling, frontend-build, runtime, and optional-tool upgrades into one bundle.

## Current Baseline

The planning baseline for Priority 4 is the current dependency surface in `package.json` plus fresh command evidence gathered on 2026-03-23.

Observed evidence:

- `yarn outdated` completed successfully and showed a mix of:
  - patch/minor refresh candidates (`@babel/preset-env`, `@tsconfig/svelte`, `@types/aws-lambda`, `dotenv`, `sass`, `ts-jest`, `ts-loader`, `webpack`, `webpack-license-plugin`, `netlify-cli`, `yarn`),
  - major-version candidates in the test stack (`@shelf/jest-mongodb`, `jest`, `jest-environment-*`, `mongodb-memory-server`),
  - major-version candidates in lint/tooling (`@typescript-eslint/*`, `eslint`, `prettier`, `eslint-config-prettier`, `eslint-plugin-svelte`, `prettier-plugin-svelte`),
  - major-version candidates in frontend/build (`@sveltejs/vite-plugin-svelte`, `svelte`, `vite`, `svelte-preprocess`, `xstate`, `@xstate/*`),
  - and major-version candidates in runtime/platform packages (`@netlify/functions`, `mongodb`, `normalize-url`, `rimraf`, `webpack-cli`).

- `yarn knip` completed with non-zero status and surfaced:
  - unused-file and unused-export candidates that may indicate real cleanup opportunities,
  - dependency hits that are likely tool blind spots because this repo uses config- and preset-driven loading (`@typescript-eslint/*`, `eslint-plugin-svelte`, `eslint-config-prettier`, `http-server`, `jest-environment-jsdom`, `mongodb-memory-server`),
  - an unlisted dependency signal for `jsdom`,
  - and unlisted binary signals for `netlify` and `cypress`.

- `npx @e18e/cli analyze` did not produce actionable dependency results in a reasonable time even after package metadata was added to support `yarn pack`, so it should not be treated as a gating signal for this phase.

Planning interpretation of those signals:

- `yarn outdated` is the strongest current signal for risk-partitioned upgrade planning.
- `yarn knip` is useful for identifying review candidates, but its output must be triaged manually before any removal or replacement because this repo relies on configuration-driven and preset-driven tooling usage.
- The external "three pillars of JavaScript bloat" guidance should be used as a classification lens during triage:
  - older-runtime compatibility baggage,
  - overly atomic dependency chains,
  - and stale ponyfills/polyfills that may no longer justify their presence.

The current dependency-confidence hotspots are:

- large major-version lag in the Jest/Mongo test stack,
- large major-version lag in lint/format/tooling packages,
- large major-version lag in the Svelte/Vite/XState frontend stack,
- and a smaller but meaningful set of low-risk patch/minor refresh opportunities that can deliver immediate improvement.

For Priority 4 execution ordering, the current planning stance is:

- major Svelte upgrades are deferred to a later focused phase,
- major MongoDB upgrades are deferred to a later focused phase,
- and the first implementation loop should sequence low-risk upgrades by coupling and blast radius while validating after every upgrade step.

## In Scope

- Use `package.json`, `yarn outdated`, and `yarn knip` as the current planning baseline for dependency modernization.
- Create a risk-partitioned dependency inventory grouped by ecosystem and change class.
- Classify each candidate using both upgrade risk and dependency-noise rationale.
- Identify which packages belong in the first real implementation slice versus later follow-on plans.
- Use repo-aware triage rules so config-loaded, preset-loaded, and optional-tool packages are not removed solely because a tool flagged them.
- Define the first implementation slice as actual low-risk dependency modernization work, not a generic research-only pass.
- Define the first implementation loop as a sequence of atomic upgrade steps that each run validation before the next step begins.
- Sequence candidates by coupling and blast radius rather than by package age alone.
- Name the follow-on major-version slices explicitly:
  - test-stack modernization,
  - lint/format/tooling modernization,
  - frontend/build ecosystem modernization,
  - runtime/platform major-upgrade modernization.

## Out of Scope

- One umbrella PR that upgrades every outdated dependency at once.
- Major Svelte upgrades in the first implementation checklist.
- Major MongoDB upgrades in the first implementation checklist.
- Major Jest/Mongo stack changes in the first implementation checklist.
- Major ESLint/Prettier/TypeScript ecosystem changes in the first implementation checklist.
- Major Svelte/Vite/XState ecosystem changes in the first implementation checklist.
- Major runtime/platform upgrades in the first implementation checklist.
- Removing files, exports, or dependencies based only on raw `knip` output without manual repo-aware verification.
- Adding package metadata or packaging behavior solely to satisfy one analysis tool unless separately approved.
- Architecture or runtime behavior refactors whose main purpose is not dependency modernization.

## Constraints

- Follow the backlog rule that Priority 4 is "a sequence of planning efforts, not one umbrella upgrade."
- Separate low-risk maintenance from major-version migrations.
- Prefer actual codebase improvement in the first implementation slice over another vague stabilization pass.
- Treat the first implementation checklist as a low-risk refresh slice unless collaborators explicitly approve a different scope.
- Treat each upgrade step as the smallest logical reviewable unit; some steps may be paired package updates when versions are obviously coupled.
- Run agreed validation after each upgrade step, not only after the entire sequence.
- Use a smart upgrade sequence: isolated low-risk steps first, tightly coupled low-risk pairs second, higher-blast-radius low-risk steps later.
- Treat tool output as evidence, not authority.
- If a candidate upgrade would require changing runtime behavior, public contracts, test semantics, or repository process rules, stop and move that candidate into a separate follow-on plan/checklist.
- Do not use the current Mongo/Jest compatibility pain as a reason to force an unscoped test-stack migration.
- Do not allow the first implementation loop to cross the approved deferment boundary for major Svelte or MongoDB work.

## Risks and Mitigations

- Risk: the first Priority 4 phase turns into another research-only pass and fails to reduce confidence drag.
  - Mitigation: require the first implementation checklist to contain real low-risk refresh work, not only inventory chores.

- Risk: raw `knip` output causes removal of repo-needed tooling packages or files.
  - Mitigation: require manual verification for every `knip`-flagged dependency, file, export, or type before it becomes a removal candidate.

- Risk: major-version upgrades get smuggled into the first checklist under the label of "routine maintenance."
  - Mitigation: explicitly defer test-stack, lint/tooling, frontend/build, and runtime/platform major-version work into named later slices unless a checklist update is approved.

- Risk: the phase is prioritized only by package age rather than by real confidence drag.
  - Mitigation: require candidate ranking to consider runtime/build/test exposure, confidence drag, blast radius, and bloat rationale instead of raw version lag alone.

- Risk: sequence drift causes a later step to mask the fallout from an earlier upgrade.
  - Mitigation: require validation after every upgrade step and stop the loop when failures are broader than the just-applied step.

- Risk: major Svelte or MongoDB work is accidentally pulled into the first loop because a smaller upgrade exposes nearby friction.
  - Mitigation: treat that as a stop condition and hand the blocker forward into a dedicated later phase instead of compensating with broader migration work.

- Risk: tool choice drives the phase more than repo needs.
  - Mitigation: treat `yarn outdated` as inventory evidence, `knip` as a review signal, and `@e18e/cli` as optional/non-blocking until it proves reliable for this repo.

## Acceptance Criteria

1. The plan defines a current dependency inventory method based on `package.json`, `yarn outdated`, and `yarn knip`.
2. Every candidate dependency or dependency ecosystem can be placed into one of these buckets:
   - low-risk refresh now,
   - test-stack follow-on,
   - lint/format/tooling follow-on,
   - frontend/build follow-on,
   - runtime/platform follow-on,
   - or intentional deferment.
3. The first implementation checklist is explicitly limited to low-risk refresh work and does not include unrelated major-version migrations.
4. Major Svelte and MongoDB upgrades are explicitly deferred into later dedicated phases and are not allowed into the first implementation loop.
5. The implementation model requires validation after each upgrade step and includes a stop rule when failures are broader than the just-applied step.
6. `knip` findings are treated as triage inputs and require manual verification before any removal or replacement decision.
7. The plan includes a clear ranking method that uses confidence drag, exposure, upgrade risk, actionability, and coupling rather than package age alone.
8. The plan names the higher-risk follow-on modernization slices explicitly so they cannot disappear into backlog ambiguity.
9. The resulting plan is checklist-ready under `docs/norms/plan.md` without relying on "trust us" reasoning.

## Validation Strategy

This phase changes dependency state, build inputs, and possibly test/build behavior in later checklists, so validation requirements must be defined now.

Required evidence types for Priority 4:

- **Inventory evidence**
  - Pass: the dependency inventory cites current package state plus fresh `yarn outdated` and `yarn knip` results.
  - Fail: the plan relies on stale assumptions, unsupported memory, or one-off package anecdotes.

- **Triage evidence**
  - Pass: every candidate in the first checklist has recorded ecosystem grouping, risk class, and rationale for `refresh`, `replace`, `remove`, `defer`, or `plan separately`.
  - Fail: checklist candidates appear without written justification or without distinction between low-risk and major-version work.

- **Step-level smoke/process evidence**
  - Pass: every accepted upgrade step records the validation commands run immediately after that step, and the loop stops when a failure exceeds the step's approved local scope.
  - Fail: multiple upgrades are batched before validation, or the sequence continues despite unresolved failures whose scope is broader than the just-applied step.

- **Contract/parity evidence**
  - Pass: upgrades that touch build, test, or runtime infrastructure do not silently change current contracts or parity expectations.
  - Fail: a dependency change alters repo behavior, validation meaning, or public build/runtime assumptions without being called out and approved.

- **Non-functional evidence**
  - Pass: when a slice affects build/test tooling, any meaningful warning, size, or runtime-signal delta is recorded clearly.
  - Fail: build/test/tooling changes are merged without recording whether they changed warning, speed, or other confidence-relevant signals.

## Planned Slices

1. Dependency inventory and partitioning
   - turn current package state plus command evidence into a ranked, ecosystem-aware candidate list.

2. Low-risk refresh implementation loop
   - patch/minor updates and similarly low-blast-radius changes that provide immediate maintenance value.
   - run validation after each upgrade step.
   - stop when the fallout exceeds the approved local step scope.

3. Test-stack modernization plan/checklist
   - `@shelf/jest-mongodb`, `mongodb-memory-server`, Jest environment/preset alignment, and related backend test tooling.

4. Lint/format/tooling modernization plan/checklist
   - ESLint, `@typescript-eslint/*`, Prettier, and related plugin/config packages.

5. Frontend/build modernization plan/checklist
   - future major Svelte ecosystem work, Vite/plugin/preprocess tooling, and XState ecosystem changes.

6. Runtime/platform modernization plan/checklist
   - future major MongoDB ecosystem work plus other backend/runtime-adjacent high-blast-radius upgrades such as `@netlify/functions`.

## Open Questions / Assumptions

- Assumption: the first Priority 4 implementation slice should produce real dependency improvements rather than another generic stabilization-only phase.
- Assumption: `yarn outdated` is the primary current inventory signal for this repo.
- Assumption: `knip` is useful for surfacing review targets but is not trustworthy enough to drive removals without manual verification.
- Assumption: `@e18e/cli` should remain optional/non-blocking unless later investigation proves it can finish reliably and produce actionable output for this repo.
- Assumption: major Svelte upgrades are deferred into a later dedicated phase.
- Assumption: major MongoDB upgrades are deferred into a later dedicated phase.
- Assumption: the implementation loop should run validation after each upgrade step.
- Open question: should the first checklist allow low-risk dependency replacements/removals in addition to refreshes, or should it stay refresh-only?
- Open question: should optional tooling such as Cypress and Netlify CLI remain deferred unless their lag causes active friction, or should they be allowed into the first low-risk slice when only patch/minor updates are involved?
- Open question: should the test-stack modernization slice come immediately after the low-risk refresh loop, or only after the broader low-risk checklist is complete?

## Conformance QC (Plan)

- Intent clarity issues:
  - None identified; the plan is explicit that Priority 4 must deliver real dependency improvement while still separating low-risk work from major migrations.

- Missing required sections:
  - None (`Goal`, `Intent`, `In Scope`, `Out of Scope`, and `Acceptance Criteria` are present).

- Ambiguities/assumptions to resolve:
  - Whether the first implementation checklist may include low-risk replacements/removals in addition to refreshes.
  - Whether optional-tool patch/minor updates belong in the first slice or should be deferred unless they solve active friction.
  - Whether the test-stack follow-on should immediately follow the low-risk refresh slice.

- Validation strategy gaps:
  - None for the current planning scope; later checklists will need to map the exact per-step validation commands and stop-rule evidence to touched ecosystems.

- Traceability readiness:
  - Ready; section language is quoteable for checklist authoring and for later dependency candidate triage.

- Pass/Fail: ready for checklist authoring
  - Pass after collaborator confirmation of the open questions above.
