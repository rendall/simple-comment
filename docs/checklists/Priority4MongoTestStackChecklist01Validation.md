# Priority 4 Mongo Test Stack Checklist 01 Validation

Status: complete

Checklist: `docs/checklists/Priority4MongoTestStackChecklist01.md`

## Baseline Package / Config State

Baseline captured on 2026-03-25 before Checklist 01 item execution:

- `package.json`
  - `@shelf/jest-mongodb`: `^6.0.2`
  - direct `mongodb-memory-server`: `^11.0.1`
  - `ts-node`: `^10.9.2`
- installed preset/runtime pairing:
  - `@shelf/jest-mongodb@6.0.2` is the current npm-published line
  - the installed preset bundles `mongodb-memory-server@10.3.0` transitively
  - the direct top-level `mongodb-memory-server@11.0.1` dependency is therefore not the preset runtime actually resolved from inside `@shelf/jest-mongodb`
- `jest-mongodb-config.js`
  - uses `mongodbMemoryServerOptions.binary.version: "8.2.1"`
  - does not set `storageEngine`
  - no longer carries a `6.0.14` pin
- parity surfaces
  - `scripts/ci-local.sh` no longer exports `MONGOMS_DOWNLOAD_URL`
  - `.github/workflows/netlify-api-test.yml` no longer exports `MONGOMS_DOWNLOAD_URL`
- prerequisite note
  - backend Jest config loading currently requires `ts-node` because `jest.backend.config.ts` remains a TypeScript config file
  - rationale documented previously in `docs/checklists/Priority4Slice2Phase03Validation.md`

## Active-Doc Inventory

Inventory captured on 2026-03-25 across the checklist-scoped active surfaces:

| Surface | Classification | Notes |
| --- | --- | --- |
| `README.md` | `update now` | Contributor-facing test guidance should explain the modernized Mongo-backed backend test path and record issue `#167` as the open replica-set follow-up. |
| `docs/MONGODB_ATLAS.md` | `reviewed no change` | Atlas setup guide is about application runtime/cloud setup rather than backend test bootstrap. |
| `docs/norms/ci-parity.md` | `update now` | Generic parity norm stayed correct, but the example env list no longer needed to name the retired Mongo download override. |
| `docs/plans/Priority4DependencyModernizationPlan.md` | `reviewed no change` | Still correctly describes the dedicated Mongo/test-stack follow-on lane within Priority 4. |
| `docs/plans/Priority4MongoReplicaSetTestingMiniPlan.md` | `update now` | Active mini-plan needed current-state wording so it no longer described the retired `6.0.14` / `MONGOMS_DOWNLOAD_URL` path as if it were still present. |
| `jest.backend.config.ts` | `reviewed no change` | Preset composition remains the active backend Jest contract; no checklist change needed in this file. |
| `jest-mongodb-config.js` | `update now` | Active Mongo test bootstrap config must reflect the post-`6.0.14` modernized path. |
| `.github/workflows/netlify-api-test.yml` | `update now` | CI parity surface must no longer carry the old download URL workaround. |
| `scripts/ci-local.sh` | `update now` | Local parity surface must stay aligned with the workflow and current Mongo-backed test path. |
| `package.json` | `update now` | Active dependency surface still needs the direct `mongodb-memory-server` keep/remove decision documented by this checklist. |
| `docs/checklists/Priority4MongoTestStackChecklist01.md` | `update now` | The checklist's execution note needed to reflect that the `ts-node` prerequisite has already been satisfied. |
| `docs/checklists/Priority4MongoTestStackChecklist01Validation.md` | `update now` | This validation ledger is the active evidence surface for the Mongo test-stack slice. |
| `docs/checklists/Priority4Slice2Phase03Validation.md` | `reviewed no change` | Remains the correct historical rationale for why `ts-node` had to be restored before backend Jest work resumed. |

Replica-set follow-up:

- issue `#167` remains the active follow-up for the larger architectural question of whether this repo should later shift from the modernized `mongodb-memory-server` path to an actual local replica-set-backed test model.

## Per-Item Command Evidence

- C03:
  - `npm view @shelf/jest-mongodb version`
    - returned `6.0.2`
  - `npm view mongodb-memory-server version`
    - returned `11.0.1`
  - `node -e "const p=require('./node_modules/@shelf/jest-mongodb/package.json'); console.log(JSON.stringify({version:p.version,deps:p.dependencies},null,2))"`
    - confirmed the installed preset is `@shelf/jest-mongodb@6.0.2`
    - confirmed the preset bundles `mongodb-memory-server@10.3.0` transitively
  - `node -e "console.log(require.resolve('@shelf/jest-mongodb/node_modules/mongodb-memory-server/package.json'))"`
    - confirmed the preset resolves its own bundled `mongodb-memory-server` runtime from inside `node_modules/@shelf/jest-mongodb/...`
  - `yarn remove mongodb-memory-server`
    - removed the direct dependency entry from `package.json`
    - local Yarn remove/install tail stalled after lockfile regeneration began in this session
  - local install-tail note:
    - repeated `yarn install` attempts in this Codex session stalled after dependency linking, so the orphaned `11.0.1` lockfile entries were pruned manually to match the already-updated dependency graph
    - this does not change the intended runtime pairing: the preset-bundled `mongodb-memory-server@10.3.0` remains present and is the version actually resolved from inside `@shelf/jest-mongodb`
- C04:
  - `sed -n '1,40p' jest-mongodb-config.js`
    - confirmed the active config now uses `mongodbMemoryServerOptions.binary.version: "8.2.1"`
    - confirmed the file no longer pins `6.0.14`
    - confirmed the file no longer encodes `MONGOMS_DOWNLOAD_URL`-style workaround assumptions
  - config decision:
    - accepted the existing `8.2.1` pin as the modern supported configuration for this checklist
    - left `storageEngine` unset because the current modernized path does not require an explicit override to exit the old `6.0.14` workaround model
- C05:
  - `sed -n '1,220p' scripts/ci-local.sh`
    - confirmed local parity now exports only `TZ=UTC`
    - confirmed the old `MONGOMS_DOWNLOAD_URL` override is gone
  - `sed -n '1,220p' .github/workflows/netlify-api-test.yml`
    - confirmed test-gate parity now exports only `TZ: UTC`
    - confirmed the old `MONGOMS_DOWNLOAD_URL` override is gone
  - parity decision:
    - accepted the already-landed parity alignment as satisfying this checklist item
    - no further workflow/script change was needed beyond documenting the modernized state
- C06:
  - `README.md`
    - clarified that installing/running local MongoDB Community Edition is for local application runtime workflows, not for backend Jest bootstrap
    - added backend-test guidance that the repo-managed `@shelf/jest-mongodb` + `jest-mongodb-config.js` path is the current supported test model
    - added the open follow-up reference to issue `#167` for the later replica-set architecture decision

## Before / After Backend Test Results

Before checklist execution:

- local targeted backend validation attempt:
  - `timeout 180s yarn test:backend --runTestsByPath src/tests/backend/mongoDb.test.ts src/tests/backend/MongodbService.test.ts`
  - outcome in this Codex session: backend Jest started and then stalled in `D` state without producing test results
  - interpretation: same environment-specific blocker previously observed in this session family; not enough evidence on its own to treat the modernized Mongo path as broken
- maintainer-provided environment evidence already on record in-thread:
  - `yarn run ci:local` passes in the maintainer environment after the Mongo test-stack upgrade and parity-script changes

After checklist execution:

- final package/config state after C03-C06:
  - `package.json` keeps `@shelf/jest-mongodb@^6.0.2`
  - direct `mongodb-memory-server` dependency removed
  - `jest-mongodb-config.js` keeps the modern `8.2.1` binary pin without the old `6.0.14` workaround assumptions
  - local/CI parity surfaces no longer export `MONGOMS_DOWNLOAD_URL`
- T01 targeted backend validation:
  - command: `timeout 180s yarn test:backend --runTestsByPath src/tests/backend/mongoDb.test.ts src/tests/backend/MongodbService.test.ts`
  - initial local outcome in this Codex session: Jest started, then stalled in `D` state without producing test results
  - retry command: `timeout 300s yarn test:backend --runTestsByPath src/tests/backend/mongoDb.test.ts src/tests/backend/MongodbService.test.ts`
  - retry outcome: passed
    - 2 suites passed
    - 69 tests passed
    - completed in `170.82s` wall time / `68.427s` Jest time
  - status: pass on retry
- T02 backend smoke/parity validation:
  - initial local outcome in this Codex session: same backend Jest stall pattern as the first T01 attempt
  - retry command: `timeout 300s yarn test:backend`
  - retry outcome: passed
    - 11 suites passed
    - 180 tests passed
    - completed in `194.69s` wall time / `86.588s` Jest time
  - status: pass on retry
  - command: `yarn build`
  - outcome: passed
  - retained warning signals:
    - `mongodb/lib/deps.js`: cannot resolve `@aws-sdk/credential-providers`
    - `mongodb/lib/utils.js`: critical dependency expression warning
  - interpretation: build remains runnable, and the backend Jest path completed successfully on retry in this Codex environment
- maintainer-provided environment evidence still on record:
  - `yarn run ci:local` passes in the maintainer environment after the Mongo test-stack modernization and parity updates

## Documentation / Parity Validation

- T03:
  - `rg -n "MONGOMS_DOWNLOAD_URL|6\\.0\\.14" README.md docs/MONGODB_ATLAS.md docs/norms/ci-parity.md docs/plans/Priority4DependencyModernizationPlan.md docs/plans/Priority4MongoReplicaSetTestingMiniPlan.md jest.backend.config.ts jest-mongodb-config.js .github/workflows/netlify-api-test.yml scripts/ci-local.sh docs/checklists/Priority4MongoTestStackChecklist01.md docs/checklists/Priority4MongoTestStackChecklist01Validation.md docs/checklists/Priority4Slice2Phase03Validation.md`
    - confirmed there are no remaining active config/runtime surfaces that still set or require `MONGOMS_DOWNLOAD_URL`
    - confirmed `README.md` no longer teaches the old `6.0.14` / `MONGOMS_*` workaround as the current contributor workflow
    - confirmed `docs/plans/Priority4MongoReplicaSetTestingMiniPlan.md` now describes the old workaround path as retired historical baseline, not current practice
    - confirmed remaining matches are limited to:
      - checklist language and validation notes that explicitly describe the retired workaround while auditing its removal
      - historical reasoning in active plan/checklist artifacts
      - older phase evidence in `docs/checklists/Priority4Slice2Phase03Validation.md`
  - result:
    - pass
    - active docs/config no longer describe the old workaround path as the current recommended workflow

## Open Replica-Set Follow-Up

- Open follow-up issue: `#167`
- Topic: document and later evaluate whether the repo should stay on the modernized `mongodb-memory-server` path or move to an actual local replica-set-backed backend test model

## Current Checklist Outcome

- C01-C07 and T01-T03 are complete.
- The repo state is materially modernized compared with the old `6.0.14` / `MONGOMS_DOWNLOAD_URL` path.
- The only notable residual signal from local validation is the retained backend build warning pair already recorded above.
