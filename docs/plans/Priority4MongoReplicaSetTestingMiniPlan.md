# Priority 4 Mini-Plan — Mongo Test Stack Modernization

Status: proposed

Source plan: `docs/plans/Priority4DependencyModernizationPlan.md`

Classification: formal mini-plan artifact under `docs/norms/plan.md`

## Goal

Modernize the current MongoDB-backed backend test stack so it no longer depends on the repo's pinned `6.0.14` workaround path, while updating active repository documentation to reflect the current supported testing model and recording the open question of whether the repo should later move to an actual local replica set.

## Intent

This follow-on should make the existing Mongo-backed backend tests less fragile now, without quietly folding in a broader MongoDB driver/runtime migration or a full test-infrastructure replacement.

In plain language, success means:

- backend tests still run through a Mongo-backed local test harness, but not through the old pinned `mongodb-memory-server` workaround path,
- the repo has one clear local and CI story for Mongo-backed backend tests,
- contributors can understand how the backend Mongo tests are bootstrapped without reverse-engineering stale Jest setup details,
- active documentation no longer teaches the old `MONGOMS_DOWNLOAD_URL` / MongoDB `6.0.14` compatibility workaround as the current recommended path,
- and the repo separately records that MongoDB's own guidance points toward real replica-set-backed testing so that shift can be investigated deliberately later.

## Current Baseline

Current repo behavior shows that backend tests still depend on the `@shelf/jest-mongodb` + `mongodb-memory-server` stack, but the old `6.0.14` workaround path has already been retired:

- `jest.backend.config.ts` composes the `@shelf/jest-mongodb` preset into the backend Jest config.
- `jest-mongodb-config.js` now pins the Mongo binary to `8.2.1`.
- `.github/workflows/netlify-api-test.yml` and `scripts/ci-local.sh` no longer export `MONGOMS_DOWNLOAD_URL`.
- `src/tests/backend/mongoDb.test.ts` and `src/tests/backend/MongodbService.test.ts` consume the preset-provided `__MONGO_URI__` / `__MONGO_DB_NAME__` globals.
- `package.json` keeps `@shelf/jest-mongodb` as the active test preset dependency, while the direct `mongodb-memory-server` dependency has been removed because the preset provides the runtime transitively.

Historical baseline that motivated this mini-plan:

- the repo previously pinned `jest-mongodb-config.js` to MongoDB `6.0.14`
- parity surfaces previously exported `MONGOMS_DOWNLOAD_URL`
- those controls existed to stabilize an older `mongodb-memory-server` setup against platform/archive mismatch behavior

Observed repo-health signal:

- The current test path is functionally workable but still somewhat fragile because it remains Jest-preset-driven and backend validation behaves differently across environments.
- Priority 4 Slice 2 explicitly deferred `mongodb-memory-server` removal because it was not a low-risk cleanup item; this mini-plan became the dedicated place to re-evaluate that decision.

Relevant current docs mention MongoDB testing/setup in active surfaces such as:

- `README.md`
- `docs/MONGODB_ATLAS.md`
- `docs/norms/ci-parity.md`
- `docs/plans/Priority4DependencyModernizationPlan.md`
- active Priority 4 checklist/validation documents that describe current Mongo test constraints

## External Guidance Snapshot

As of 2026-03-25, the current upstream guidance is more nuanced than "memory-server bad, replica set good":

- `mongodb-memory-server` current docs say the default MongoDB binary is `8.2.1`: <https://typegoose.github.io/mongodb-memory-server/docs/api/config-options/>
- `mongodb-memory-server` v10 requires Node `16.20.1+` and documents that with MongoDB `7.0.0+`, removed `ephemeralForTest` settings are translated to `wiredTiger`: <https://typegoose.github.io/mongodb-memory-server/docs/guides/migration/migrate10/>
- `mongodb-memory-server` documents support for both single instances and replica sets: <https://typegoose.github.io/mongodb-memory-server/>
- MongoDB documents deploying a replica set "for testing and development": <https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set-for-testing/>
- MongoDB documents that transactions require a replica set or sharded cluster: <https://www.mongodb.com/docs/manual/data-modeling/enforce-consistency/transactions/>
- MongoDB's driver compatibility tables show Node driver `5.7` to `6.8` can connect to MongoDB `8.0`, but full `8.0` feature support starts at driver `6.9+`: <https://www.mongodb.com/docs/drivers/compatibility/?driver-language=javascript&javascript-driver-framework=nodejs>

Planning interpretation:

- The repo's underlying problem is not that `mongodb-memory-server` is inherently obsolete; it was that this repo had been pinned to an old `@shelf/jest-mongodb` / MongoDB `6.0.14` setup with download-workaround baggage.
- The lower-risk Priority 4 move is to modernize the current Mongo test stack in place first.
- MongoDB's own replica-set guidance is still relevant, but it should be treated as a documented follow-up investigation rather than automatically replacing the current test harness in the first implementation pass.

## In Scope

- Design a repo-native modernization path for the current `mongodb-memory-server` backend test bootstrap.
- Re-evaluate the current `@shelf/jest-mongodb` / `mongodb-memory-server` version pairing and compatibility assumptions.
- Define the intended modern Mongo-backed backend test model for this repo:
  - current-memory-server stack, but updated and revalidated, and
  - optionally replica-set mode within that stack if justified by the tests.
- Define the CI/runtime parity approach for the modernized Mongo-backed backend tests.
- Identify the exact code/config surfaces that must change for the updated backend test path.
- Include a documentation pass that inventories active MongoDB mentions and updates any active testing guidance that would become stale.
- Record the open architectural question of whether the repo should later shift from the modernized memory-server path to an actual local replica set.

## Out of Scope

- Broad MongoDB application-runtime modernization.
- Upgrading the production Atlas cluster configuration as part of this mini-plan.
- A major MongoDB Node driver upgrade in the same checklist unless separately approved.
- Replacing the test harness with an externally managed local MongoDB deployment in the first implementation pass.
- Unscoped backend data-model, service-layer, or API-contract changes.
- Rewriting historical archive documents to pretend the old `mongodb-memory-server` path never existed.
- Treating Atlas itself as the backend test environment.

## Constraints

- Keep this work in the dedicated Mongo/test-stack follow-on lane from `docs/plans/Priority4DependencyModernizationPlan.md`; do not smuggle it back into the low-risk Slice 2 loop.
- Prefer a local/CI test environment that is deterministic and practical for contributors to run without introducing cloud credentials, network flake, or shared-data risk.
- Preserve the existing test intent and coverage contract unless a later checklist explicitly approves behavior-level test changes.
- Update active documentation when the testing model changes so contributors are not left with mixed instructions.
- Preserve archive/history integrity: active docs may be updated, but `docs/archive/*` should remain historical unless a narrowly scoped archival note is separately needed.
- Treat "modernize the current memory-server path" and "shift to an actual replica set" as separate decisions unless a later approved checklist intentionally combines them.

## Risks and Mitigations

- Risk: this phase accidentally grows into a full MongoDB modernization effort.
  - Mitigation: keep Node driver major upgrades, Atlas/runtime changes, and application behavior changes explicitly out of scope.

- Risk: replacing the current test harness too aggressively creates more churn than benefit.
  - Mitigation: prefer in-place modernization of the current Mongo test stack first, and treat the actual-replica-set question as a separately documented follow-up.

- Risk: CI/local parity drifts because the new Mongo test flow is documented in one place but implemented differently in scripts/workflows.
  - Mitigation: require parity surfaces and docs to be updated together.

- Risk: documentation drift persists because only code/config is changed.
  - Mitigation: make the documentation pass a first-class part of the plan, not a nice-to-have.

- Risk: archive/history gets rewritten in a way that makes old stabilization work harder to understand.
  - Mitigation: limit the docs pass to active docs and active planning/checklist surfaces that describe the current testing model.

## Documentation Pass

The implementation checklist derived from this mini-plan should begin with a repo-wide inventory of active MongoDB mentions, then update active testing guidance that is made stale by the modernized Mongo-backed test path.

Expected active documentation/config review surfaces include:

- contributor-facing docs
  - `README.md`
  - `docs/MONGODB_ATLAS.md`
  - `docs/norms/ci-parity.md`
- active Priority 4 planning/checklist docs
  - `docs/plans/Priority4DependencyModernizationPlan.md`
  - active MongoDB-related checklists/validation notes under `docs/checklists/`
- active test/config/runtime surfaces that encode testing guidance
  - `jest.backend.config.ts`
  - `jest-mongodb-config.js`
  - `.github/workflows/netlify-api-test.yml`
  - `scripts/ci-local.sh`
  - `package.json`

Documentation pass rule:

- Update active surfaces that describe the backend Mongo test path.
- Do **not** rewrite `docs/archive/*` as if historical `mongodb-memory-server` work never happened.
- Explicitly document the repo's current practice versus MongoDB's more production-like replica-set recommendation, and record that the shift decision remains under investigation.

## Acceptance Criteria

1. The mini-plan defines a dedicated Mongo test-stack phase that modernizes the current `mongodb-memory-server`-based backend test approach.
2. The plan keeps MongoDB driver/runtime modernization separate unless explicitly added in a later approved phase.
3. The plan identifies the active code/config surfaces that currently implement the old in-memory Mongo test path.
4. The plan includes an explicit documentation pass covering active MongoDB/testing references.
5. The documentation pass distinguishes active docs to update from archive docs to preserve.
6. The plan explicitly records the open follow-up question of whether the repo should later shift from the modernized memory-server path to an actual local replica set.
7. The resulting checklist can validate backend tests, build/parity surfaces, and updated contributor guidance without relying on "tribal knowledge."

## Validation Strategy

Because this phase changes test infrastructure, contributor workflow, and active documentation, the implementation checklist should require all of the following evidence:

- **Backend test evidence**
  - Pass: the backend test suite runs successfully against the updated Mongo-backed test path.
  - Fail: the modernization leaves backend tests broken or still dependent on the old pinned workaround assumptions.

- **Parity/config evidence**
  - Pass: local parity surfaces and CI surfaces describe and use the same Mongo test model.
  - Fail: scripts, workflows, and docs disagree about how Mongo-backed tests are started or configured.

- **Documentation evidence**
  - Pass: active docs that mention MongoDB testing no longer describe the old pinned `MONGOMS_*` / MongoDB `6.0.14` workaround path as the current recommended workflow, and they record the open replica-set investigation clearly.
  - Fail: active docs still instruct contributors to rely on stale compatibility-workaround assumptions after the updated test model lands.

- **Scope-control evidence**
  - Pass: the work modernizes the test bootstrap path without silently introducing a broader MongoDB runtime migration or an externally managed test-environment replacement.
  - Fail: the checklist starts changing driver major versions, production runtime assumptions, or backend behavior without separate approval.

## Recommended Implementation Shape

The follow-on checklist derived from this mini-plan should likely proceed in this order:

1. Inventory active MongoDB/testing mentions and classify them as active-doc update, active-config change, or historical/archive reference.
2. Define the updated Mongo-backed backend test bootstrap model using the current supported `mongodb-memory-server` stack.
3. Update backend Jest/config/bootstrap surfaces to use that model.
4. Update CI/local parity scripts and workflow surfaces.
5. Update active documentation that teaches the backend Mongo test path, including the documented difference between current repo practice and MongoDB's more production-like replica-set recommendation.
6. Run backend test and parity validation against the updated model.
7. Leave a clearly named follow-up issue/decision note for whether to later shift from the modernized memory-server path to an actual local replica set.

## Open Questions / Assumptions

- Assumption: modernizing the current `mongodb-memory-server` path is the preferred first step for Priority 4.
- Assumption: Atlas should remain out of scope as a test target for this phase.
- Assumption: active docs should be updated, while archive docs should stay historical.
- Open question: after the current stack is modernized, should the repo continue with a modernized memory-server path, or should it later shift to an actual local replica set?

## Conformance QC (Plan)

- Intent clarity issues:
  - None identified; the mini-plan clearly separates test-stack modernization from broader MongoDB modernization and from the later replica-set architecture question.

- Missing required sections:
  - None (`Goal`, `Intent`, `In Scope`, `Out of Scope`, and `Acceptance Criteria` are present).

- Ambiguities/assumptions to resolve:
  - Whether the later architectural investigation should ultimately prefer a continued modernized memory-server path or an actual local replica set.

- Validation strategy gaps:
  - None at mini-plan level; the implementation checklist will need to bind the exact validation commands.

- Traceability readiness:
  - Ready; section language is stable and quoteable for checklist authoring.

- Pass/Fail: ready for checklist authoring
  - Pass after collaborator confirmation of the updated "modernize first, investigate shift separately" direction.
