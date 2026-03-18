# Priority 2 Track C Loop Attempt — C-CFG-01

Status: archived

Candidate: `C-CFG-01`

Decision: `ACCEPT`

## Attempt Summary

- Change surface: `webpack.netlify.functions.js`
- Change made: added targeted `IgnorePlugin` handling for `mongodb-client-encryption` under the MongoDB driver path
- Why this attempt was selected first:
  - highest current-stack upstream-guidance alignment
  - matches existing repo pattern for other optional MongoDB peer dependencies
  - lowest modernization spillover risk

## Measured Outcome

- Baseline backend warning count: `2`
- Post-change backend warning count: `1`
- Removed warning:
  - `Module not found: Error: Can't resolve 'mongodb-client-encryption'`
- Remaining warning:
  - `Critical dependency: the request of a dependency is an expression`

## Build Evidence

- Baseline source: `docs/archive/priority2-track-c/build-backend-baseline.clean.log`
- Post-change source: `docs/archive/priority2-track-c/build-backend-after-cfg-01.clean.log`
- Post-change build result: success with `1` warning

## Parity / Smoke Evidence

- `yarn run test:frontend`: passed
- `yarn run test:backend`: backend test log shows all backend suites in this run passed, including `MongodbService.test.ts` and `mongoDb.test.ts`

## Decision Rationale

`ACCEPT` because the attempt achieved the expected low-risk outcome:

- it removed the optional encryption resolution warning,
- it did not broaden the warning surface,
- it preserved successful backend bundling,
- and parity evidence did not show observed runtime or contract drift.

## Follow-up Implication

- This attempt does not fully remediate the backend warning path because the dynamic-require warning remains.
- The continuation rule should now decide whether another eligible low-risk current-stack candidate exists or whether Track C should move to documented residual disposition.
