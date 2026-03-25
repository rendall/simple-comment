# Priority 4 — Mongo Test Stack Checklist 01

Status: proposed

Source plan: `docs/plans/Priority4MongoReplicaSetTestingMiniPlan.md`

QC mode: Conformance QC

## Scope Lock (from source plan)

- In scope anchor: "Design a repo-native modernization path for the current `mongodb-memory-server` backend test bootstrap." (In Scope)
- In scope anchor: "Re-evaluate the current `@shelf/jest-mongodb` / `mongodb-memory-server` version pairing and compatibility assumptions." (In Scope)
- In scope anchor: "Define the CI/runtime parity approach for the modernized Mongo-backed backend tests." (In Scope)
- In scope anchor: "Include a documentation pass that inventories active MongoDB mentions and updates any active testing guidance that would become stale." (In Scope)
- In scope anchor: "Record the open architectural question of whether the repo should later shift from the modernized memory-server path to an actual local replica set." (In Scope)
- Constraint anchor: "Keep this work in the dedicated Mongo/test-stack follow-on lane from `docs/plans/Priority4DependencyModernizationPlan.md`; do not smuggle it back into the low-risk Slice 2 loop." (Constraints)
- Constraint anchor: "Update active documentation when the testing model changes so contributors are not left with mixed instructions." (Constraints)
- Constraint anchor: "Treat \"modernize the current memory-server path\" and \"shift to an actual replica set\" as separate decisions unless a later approved checklist intentionally combines them." (Constraints)
- Acceptance anchor: "The mini-plan defines a dedicated Mongo test-stack phase that modernizes the current `mongodb-memory-server`-based backend test approach." (Acceptance Criteria)
- Acceptance anchor: "The plan includes an explicit documentation pass covering active MongoDB/testing references." (Acceptance Criteria)
- Acceptance anchor: "The plan explicitly records the open follow-up question of whether the repo should later shift from the modernized memory-server path to an actual local replica set." (Acceptance Criteria)

## Additional Scope Control

- This checklist modernizes the current `@shelf/jest-mongodb` + `mongodb-memory-server` backend test path in place.
- This checklist includes the active-doc inventory/update pass for MongoDB testing guidance.
- This checklist does not implement a shift to an externally managed local replica set.
- This checklist does not change application runtime MongoDB behavior, Atlas configuration, or backend data/service contracts.
- Current execution note: backend Jest config loading still depends on `ts-node`; that prerequisite is now satisfied, and the rationale for keeping/restoring `ts-node` remains documented in `docs/checklists/Priority4Slice2Phase03Validation.md`.

## Atomic Checklist Items

- [x] C01 `[docs]` Create `docs/checklists/Priority4MongoTestStackChecklist01Validation.md` with sections for baseline package/config state, active-doc inventory, per-item command evidence, before/after backend test results, and the open replica-set follow-up reference.
  - Depends on: none.
  - Validation: T03.
  - Trace:
    - "Include a documentation pass that inventories active MongoDB mentions and updates any active testing guidance that would become stale." (In Scope)
    - "The plan explicitly records the open follow-up question of whether the repo should later shift from the modernized memory-server path to an actual local replica set." (Acceptance Criteria)

- [x] C02 `[inventory]` Inventory active MongoDB testing mentions across `README.md`, `docs/MONGODB_ATLAS.md`, `docs/norms/ci-parity.md`, `docs/plans/Priority4DependencyModernizationPlan.md`, `jest.backend.config.ts`, `jest-mongodb-config.js`, `.github/workflows/netlify-api-test.yml`, `scripts/ci-local.sh`, `package.json`, and active `docs/checklists/*` Mongo artifacts; classify each as `update now`, `reviewed no change`, or `historical leave as-is` in the validation notes, and record issue `#167` as the open replica-set follow-up.
  - Depends on: C01.
  - Validation: T03.
  - Trace:
    - "Include a documentation pass that inventories active MongoDB mentions and updates any active testing guidance that would become stale." (In Scope)
    - "Explicitly document the repo's current practice versus MongoDB's more production-like replica-set recommendation, and record that the shift decision remains under investigation." (Documentation Pass)

- [ ] C03 `[deps]` Update `package.json` and `yarn.lock` to modernize the backend Mongo test stack by upgrading `@shelf/jest-mongodb` to the current supported line and removing the direct `mongodb-memory-server` dependency if the updated preset provides the modern memory-server runtime transitively.
  - Depends on: C01.
  - Validation: T01.
  - Trace:
    - "Re-evaluate the current `@shelf/jest-mongodb` / `mongodb-memory-server` version pairing and compatibility assumptions." (In Scope)
    - "The repo's current problem is not that `mongodb-memory-server` is inherently obsolete; it is that this repo is pinned to an old `@shelf/jest-mongodb` / MongoDB `6.0.14` setup with download-workaround baggage." (External Guidance Snapshot)

- [ ] C04 `[config]` Update `jest-mongodb-config.js` to remove the old MongoDB `6.0.14` workaround assumptions and use a modern supported `mongodb-memory-server` configuration for the updated preset without pre-committing this phase to an external replica-set migration.
  - Depends on: C03.
  - Validation: T01.
  - Trace:
    - "Modernize the current MongoDB-backed backend test stack so it no longer depends on the repo's pinned `6.0.14` workaround path" (Goal)
    - "The lower-risk Priority 4 move is to modernize the current Mongo test stack in place first." (External Guidance Snapshot)

- [ ] C05 `[parity]` Update `.github/workflows/netlify-api-test.yml` and `scripts/ci-local.sh` so the backend test path no longer carries the stale `MONGOMS_DOWNLOAD_URL` compatibility workaround and the local/CI parity story remains aligned with the modernized Mongo-backed test stack.
  - Depends on: C04.
  - Validation: T02, T03.
  - Trace:
    - "Define the CI/runtime parity approach for the modernized Mongo-backed backend tests." (In Scope)
    - "Pass: local parity surfaces and CI surfaces describe and use the same Mongo test model." (Validation Strategy)

- [ ] C06 `[docs]` Update contributor-facing MongoDB testing guidance in `README.md` so it describes the modernized backend Mongo test path, stops teaching the old `MONGOMS_*` / MongoDB `6.0.14` workaround as current practice, and notes that the actual-replica-set question remains open via issue `#167`.
  - Depends on: C02, C05.
  - Validation: T03.
  - Trace:
    - "Update active documentation when the testing model changes so contributors are not left with mixed instructions." (Constraints)
    - "Pass: active docs that mention MongoDB testing no longer describe the old pinned `MONGOMS_*` / MongoDB `6.0.14` workaround path as the current recommended workflow, and they record the open replica-set investigation clearly." (Validation Strategy)

- [ ] C07 `[docs]` Finalize `docs/checklists/Priority4MongoTestStackChecklist01Validation.md` with the completed doc inventory, package/config before/after summary, command evidence, validation outcomes, and the remaining follow-up question for issue `#167`.
  - Depends on: C02, C03, C04, C05, C06.
  - Validation: T03.
  - Trace:
    - "The plan explicitly records the open follow-up question of whether the repo should later shift from the modernized memory-server path to an actual local replica set." (Acceptance Criteria)
    - "The resulting checklist can validate backend tests, build/parity surfaces, and updated contributor guidance without relying on \"tribal knowledge.\"" (Acceptance Criteria)

## Validation Items

- [ ] T01 `[validation]` Backend targeted validation: run `yarn test:backend --runTestsByPath src/tests/backend/mongoDb.test.ts src/tests/backend/MongodbService.test.ts` after the dependency/config changes and confirm the modernized Mongo-backed test path is runnable without the old pinned workaround assumptions.
  - Trace:
    - "Pass: the backend test suite runs successfully against the updated Mongo-backed test path." (Validation Strategy)
    - "Fail: the modernization leaves backend tests broken or still dependent on the old pinned workaround assumptions." (Validation Strategy)

- [ ] T02 `[validation]` Backend smoke/parity validation: run `yarn test:backend` and `yarn build` after the parity/config updates and record pass/fail status plus any remaining non-new warning signals in the validation notes.
  - Trace:
    - "Pass: the backend test suite runs successfully against the updated Mongo-backed test path." (Validation Strategy)
    - "Pass: local parity surfaces and CI surfaces describe and use the same Mongo test model." (Validation Strategy)

- [ ] T03 `[validation]` Documentation/parity validation: use repo search plus the updated files to confirm active docs/config no longer describe the old `MONGOMS_DOWNLOAD_URL` / MongoDB `6.0.14` workaround as current practice, while historical/archive references remain classified rather than rewritten.
  - Trace:
    - "Pass: active docs that mention MongoDB testing no longer describe the old pinned `MONGOMS_*` / MongoDB `6.0.14` workaround path as the current recommended workflow, and they record the open replica-set investigation clearly." (Validation Strategy)
    - "Do **not** rewrite `docs/archive/*` as if historical `mongodb-memory-server` work never happened." (Documentation Pass)

## Behavior Slices

### Slice S1
- Goal: Establish the Mongo test-stack validation ledger and classify all active MongoDB testing references.
- Items: C01, C02.
- Type: mechanical.

### Slice S2
- Goal: Modernize the backend Mongo test dependency/config path in place.
- Items: C03, C04, T01.
- Type: behavior.

### Slice S3
- Goal: Align parity surfaces and contributor guidance with the updated Mongo-backed test path.
- Items: C05, C06, T02, T03, C07.
- Type: behavior.

## Conformance QC

- Missing from plan:
  - None.

- Extra beyond plan:
  - None; the checklist stays within in-place Mongo test-stack modernization plus the required documentation pass.

- Atomicity fixes needed:
  - None identified; each item is scoped to one reviewable surface or decision.

- Validation mapping gaps:
  - None identified; backend, parity, and documentation evidence are each covered by dedicated validation items.

- Pass/Fail: checklist achieves plan goals
  - Pass.
