# Priority 2 Track C Residual Warning Note

Status: archived

Residual warning ID: `W001`

Owner: `backend-data-access-system`

## Residual Warning

`Critical dependency: the request of a dependency is an expression`

## Why It Remains

- The accepted low-risk current-stack remediation removed the optional-module resolution warning (`W002`) without affecting runtime behavior.
- The remaining warning is the webpack dynamic-require warning emitted from the MongoDB driver's optional dependency path.
- No other candidate still ranked as eligible and low-risk in Track C offered a better next step than explicit residual disposition.

## Current Disposition

`TOLERATE`

## Rationale

- Webpack documents this warning class as a static-analysis limitation around dynamic `require()` handling.
- The repo does not show current use of CSFLE / Queryable Encryption features that would justify installing `mongodb-client-encryption`.
- The accepted Track C slice plus backend/frontend test evidence did not show observed runtime or contract drift.
- Escalating from this point would require medium-risk context surgery, deliberate runtime externalization policy, or out-of-scope modernization.

## Re-evaluation Triggers

- MongoDB driver major or minor upgrade
- webpack major or minor upgrade affecting context-module behavior
- warning signature change or warning-count regression in backend builds
- new repository use of MongoDB in-use encryption features
- new deployment/runtime evidence that the remaining warning corresponds to actual behavior risk
