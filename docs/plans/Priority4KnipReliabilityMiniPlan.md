# Priority 4 Mini-Plan — Knip Reliability Calibration

Status: proposed

Parent phase: `docs/plans/Priority4DependencyModernizationPlan.md`

Classification: formal mini-plan artifact under `docs/norms/plan.md`

## Goal

Improve the trustworthiness of `knip` output for this repository so it can be used as a useful Priority 4 dependency-modernization signal instead of a noisy source of false positives.

## Intent

This mini-plan should make `knip` better at understanding how this repository is actually wired.

For this mini-plan, success means:

- `knip` understands the repo's non-default config files and custom entry points better than it does today,
- known config-driven and preset-driven false positives are reduced through configuration first, not broad ignore lists,
- future `knip` output is easier to use as triage input for dependency cleanup and low-risk modernization work,
- and the repo keeps a written record of why particular Knip configuration choices were made.

This mini-plan should improve analysis quality, not use Knip as automatic authority for deleting dependencies, files, exports, or types.

## Background

Current local state:

- `knip.json` currently contains only:
  - `"$schema": "https://unpkg.com/knip@5/schema.json"`
  - `"tags": ["-lintignore"]`
- the installed local Knip version is `6.0.3` from `node_modules/knip/package.json`
- the repository uses several non-default or custom-wired surfaces that are likely to confuse static analysis:
  - ESLint config lives at `src/.eslintrc.json`
  - webpack config lives at `webpack.netlify.functions.cjs`
  - Jest configs live at `jest.backend.config.ts` and `jest.frontend.config.ts`
  - Vite uses custom Rollup inputs in `vite.config.ts`
  - scripts invoke `http-server`, `netlify`, and Cypress via CLI and `npx`
  - backend tests rely on `jest-mongodb-config.js`, which is loaded indirectly by the Jest Mongo preset

Observed command evidence on 2026-03-23:

- `yarn knip` reported:
  - unused files including `cypress.config.ts`, `jest-mongodb-config.js`, `src/simple-comment-icebreakers.ts`, and `src/scss/simple-comment-style.scss`
  - unused dependencies including `@typescript-eslint/*`, `eslint-plugin-svelte`, `eslint-config-prettier`, `http-server`, `jest-environment-jsdom`, and `mongodb-memory-server`
  - unlisted dependency `jsdom`
  - unlisted binaries `netlify` and `cypress`
- several of those findings conflict with known repo usage:
  - `@typescript-eslint/*`, `eslint-plugin-svelte`, and `eslint-config-prettier` are referenced by `src/.eslintrc.json`
  - `http-server` is used in `scripts/start-frontend-dist.sh` and `scripts/smoke-frontend-embed.sh`
  - `jest-environment-jsdom` is relevant to frontend Jest environment handling
  - `mongodb-memory-server` is part of the active backend test stack through `@shelf/jest-mongodb`

Official Knip guidance that appears relevant:

- Knip says `entry` and `project` patterns are the most important configuration options and should be tuned before broad suppression.
  - Source: `https://knip.dev/guides/configuring-project-files`
- Knip recommends using plugin `config` and `entry` overrides when repos use non-default config locations.
  - Source: `https://knip.dev/features/integrated-monorepos`
- Knip warns against using `ignore` too broadly and recommends `ignoreFiles`, `ignoreIssues`, `ignoreBinaries`, and `ignoreDependencies` only as targeted follow-ups.
  - Source: `https://knip.dev/reference/configuration`
- Knip provides a separate `--production` mode to focus on shipping code and reduce test/dev-only noise, but this does not replace the default comprehensive run.
  - Source: `https://knip.dev/features/production-mode`

Planning interpretation:

- current Knip output is useful as a hint generator, but not yet trustworthy enough for direct cleanup decisions in this repo
- the most likely reason is configuration mismatch rather than proof that the flagged dependencies/files are truly unused
- improving Knip reliability should happen through repo-aware configuration first, with ignore-based suppression only where configuration cannot model actual usage cleanly

## In Scope

- Review and tune `knip.json` so it better matches the installed Knip major version and the repository's actual structure.
- Configure Knip for the repo's non-default config surfaces where official plugin configuration supports that.
- Define targeted `entry` and `project` adjustments where custom entry points are causing false unused-file or unused-export reports.
- Evaluate whether the repo should run both:
  - the default comprehensive Knip mode
  - and a separate `--production` mode for shipped-code analysis
- Identify which current Knip findings are likely:
  - true positives,
  - config-mismatch false positives,
  - or candidates that still need manual verification
- Document the recommended Knip configuration strategy so future Priority 4 work can use Knip output consistently.

## Out of Scope

- Removing dependencies, files, exports, or types as part of this mini-plan.
- Treating raw Knip output as checklist-ready deletion instructions.
- Major dependency upgrades motivated only by Knip output.
- Refactoring runtime or test architecture to satisfy Knip.
- Replacing Knip with a different tool in this mini-plan.

## Proposed Configuration Direction

Recommended first-pass configuration work:

1. Align the schema to the installed major version.
   - Update the schema URL to Knip 6 so the config file matches the local tool.

2. Correct or remove the current tag configuration.
   - The current `"-lintignore"` tag entry appears suspicious and should be validated against Knip's tag expectations before being kept.

3. Add plugin/config overrides for non-default file locations.
   - ESLint:
     - point Knip at `src/.eslintrc.json`
   - Jest:
     - point Knip at `jest.backend.config.ts` and `jest.frontend.config.ts`
   - webpack:
     - point Knip at `webpack.netlify.functions.cjs`
   - Cypress:
     - explicitly include `cypress.config.ts` and relevant Cypress entry files if the default plugin behavior does not discover them correctly

4. Add targeted repo entry/project patterns only where needed.
   - likely candidates:
     - custom Vite/Rollup inputs from `vite.config.ts`
     - SCSS and frontend entry files involved in emitted build artifacts
   - use configuration to model these files before suppressing them

5. Prefer targeted suppressions over broad ignore rules.
   - use `ignoreFiles` only for files that should remain analyzable but should not count as unused files
   - use `ignoreBinaries` for CLI binaries if they remain noisy after entry/config tuning
   - use `ignoreIssues` when specific files intentionally expose exports/types that Knip should not treat as actionable
   - avoid `ignoreDependencies` as a first move unless a dependency is truly unmodelable in the repo's current structure

6. Consider adding a second Knip run for production-only analysis.
   - for this mini-plan, keep the default comprehensive run as the only required mode
   - defer `knip --production` evaluation unless later evidence shows the default run is still not giving a useful enough signal

## Recommendations

- Preferred recommendation:
  - tune Knip configuration so it models this repo's custom config files and custom entry points better before trusting any current "unused dependency" result

- Secondary recommendation:
  - once configuration is improved, treat Knip output as triage evidence for Priority 4 rather than direct action authority

- Recommendation against:
  - broad `ignore` patterns used to silence current findings without first trying plugin/config and entry/project tuning

- Recommendation against:
  - dependency removals based only on current raw Knip output

## Constraints

- Follow Knip's own guidance: prefer `entry`/`project` and plugin configuration over broad `ignore` usage.
- Preserve the repo's current behavior and architecture; Knip should adapt to the repo, not the other way around, unless a later approved plan says otherwise.
- Keep the resulting configuration explicit and reviewable.
- Do not use this mini-plan to justify dependency removals without separate manual verification.

## Risks and Mitigations

- Risk: configuration changes hide legitimate issues by over-broad suppression.
  - Mitigation: prefer plugin/config and entry/project modeling first; keep suppressions targeted and issue-specific.

- Risk: the repo still gets false positives because some dynamic or preset-driven behavior remains hard for Knip to model.
  - Mitigation: document known residual blind spots explicitly and treat them as verification-required findings rather than as truth.

- Risk: time spent tuning Knip yields little practical benefit for Priority 4.
  - Mitigation: define concrete trustworthiness signals and stop once the output is materially more usable for dependency triage.

## Acceptance Criteria

1. The mini-plan identifies why current Knip output is not yet trustworthy enough for direct cleanup decisions in this repo.
2. The mini-plan proposes a repo-specific Knip configuration strategy grounded in official Knip documentation.
3. The proposed changes prioritize plugin/config overrides and `entry`/`project` tuning before broad ignore-based suppression.
4. The mini-plan defines which Knip options are recommended for this repo and which should be used only as a last resort.
5. The resulting strategy would make future Knip output more useful for Priority 4 dependency triage, even if some residual manual verification remains necessary.

## Validation Strategy

This mini-plan changes analysis configuration rather than runtime behavior, so validation is about trustworthiness of analysis output.

Required evidence types:

- **Configuration evidence**
  - Pass: the configured Knip options match the installed major version and explicitly model the repo's non-default config surfaces.
  - Fail: the config remains version-misaligned or continues to omit known custom repo surfaces.

- **Before/after analysis evidence**
  - Pass: a follow-up `yarn knip` run shows fewer obviously false-positive findings in the known problem areas.
  - Fail: the same known false positives remain unchanged, or broad suppressions hide too much signal.

- **Process evidence**
  - Pass: future contributors can understand why Knip is configured the way it is and how to interpret its output.
  - Fail: configuration choices are opaque, over-broad, or undocumented.

## Planned Slices

1. Knip configuration alignment
   - align schema/version assumptions and validate the current tag usage

2. Plugin and config-surface modeling
   - teach Knip about repo-specific ESLint, Jest, webpack, and Cypress config locations

3. Entry/project tuning
   - model custom frontend/build entry points and other repo-owned analysis boundaries

4. Targeted suppression only if still needed
   - use `ignoreFiles`, `ignoreIssues`, or `ignoreBinaries` sparingly and only with written rationale

5. Optional production-mode evaluation
   - decide whether a second `knip --production` signal should be part of ongoing Priority 4 dependency analysis

## Open Questions / Assumptions

- Assumption: most of the current suspicious Knip findings come from configuration mismatch rather than from truly unused dependencies.
- Assumption: improving Knip reliability is worthwhile because Knip is one of the few tools currently surfacing dependency-noise candidates in this repo.
- Decision: this mini-plan will tune the default comprehensive `knip` run only; `knip --production` is deferred unless later evidence shows it is needed.
- Decision: this mini-plan assumes no intentional ignores up front; targeted suppressions are allowed only after configuration and entry/project tuning still leave clearly explainable residual noise.

## Conformance QC (Plan)

- Intent clarity issues:
  - None identified; the mini-plan clearly aims to improve analysis trust rather than to remove code directly.

- Missing required sections:
  - None (`Goal`, `Intent`, `In Scope`, `Out of Scope`, and `Acceptance Criteria` are present).

- Ambiguities/assumptions to resolve:
  - None after collaborator confirmation of the default-run-only decision and the no-upfront-ignores decision.

- Validation strategy gaps:
  - None for the current mini-plan scope; later implementation/checklist work will need concrete before/after Knip evidence.

- Traceability readiness:
  - Ready; the plan contains quoteable direction for later checklist authoring.

- Pass/Fail: ready for checklist authoring
  - Pass.
