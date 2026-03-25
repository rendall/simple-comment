# Priority 4 Mongo Test Stack Checklist 01 Validation

Status: in progress

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

To be completed in C02.

## Per-Item Command Evidence

To be completed item by item.

## Before / After Backend Test Results

Before checklist execution:

- local targeted backend validation attempt:
  - `timeout 180s yarn test:backend --runTestsByPath src/tests/backend/mongoDb.test.ts src/tests/backend/MongodbService.test.ts`
  - outcome in this Codex session: backend Jest started and then stalled in `D` state without producing test results
  - interpretation: same environment-specific blocker previously observed in this session family; not enough evidence on its own to treat the modernized Mongo path as broken
- maintainer-provided environment evidence already on record in-thread:
  - `yarn run ci:local` passes in the maintainer environment after the Mongo test-stack upgrade and parity-script changes

After checklist execution:

- To be completed in T01/T02.

## Open Replica-Set Follow-Up

- Open follow-up issue: `#167`
- Topic: document and later evaluate whether the repo should stay on the modernized `mongodb-memory-server` path or move to an actual local replica-set-backed backend test model
