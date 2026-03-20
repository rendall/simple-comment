# Priority 3 Checklist 01 Validation Notes

Status: active

Source checklist: `docs/checklists/Priority3TestSuiteSignalQualityChecklist01.md`

## Removed Rows

- `C01` / `src/tests/frontend/hello-world.test.ts` / `adds 1 + 2 to equal 3`
  - Rationale: pure placeholder coverage; the test defines `sum` inline and does not assert any repo behavior.
  - Surviving coverage: no replacement required because this row did not protect product, helper, or infrastructure behavior.
- `C02` / `src/tests/backend/utilities.test.ts` / duplicated `validateUserId` rows plus indirect `normalizeUrl` rows
  - Rationale: duplicate coverage; canonical `validateUserId` assertions already live in `src/tests/frontend/shared-utilities.test.ts`, and `normalizeUrl` has its own dedicated backend suite.
  - Surviving coverage: `src/tests/frontend/shared-utilities.test.ts` remains the validation source of truth for `validateUserId`, and `src/tests/backend/normalizeUrl.test.ts` remains the focused normalization suite.
- `C03` / `src/tests/backend/api.test.ts` / `non existent method on AbstractDbService should fail`
  - Rationale: low-signal negative check; proving a random missing property is undefined does not protect the OpenAPI-to-service contract.
  - Surviving coverage: the remaining parity rows still cover the intended positive contract surface until the later route-mapping replacement work lands.

## Replaced Rows

- None yet.

## Deterministic Performance Substitutions

- None yet.

## Regression Command Results

- `C01` / `yarn test:frontend`
  - Result: pass
  - Notes: 6 frontend suites passed, 158 tests passed after removing `src/tests/frontend/hello-world.test.ts`.
- `C02` / `yarn test:backend --runTestsByPath src/tests/backend/utilities.test.ts`
  - Result: pass
  - Notes: `utilities.test.ts` passed with 48 tests after removing the duplicate `validateUserId` rows and indirect normalization rows.
- `C03` / `yarn test:backend --runTestsByPath src/tests/backend/api.test.ts`
  - Result: pass
  - Notes: `api.test.ts` passed with 19 tests after removing the low-signal negative-property row.

## Blockers

- None.
