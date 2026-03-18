# Priority 2 Track C Backend Warning Baseline

Status: active

Sources:
- `docs/plans/artifacts/priority2-track-c/build-backend-baseline.log`
- `docs/plans/artifacts/priority2-track-c/build-backend-baseline.clean.log`
- `docs/archive/priority2-pr-a/artifacts/warning-register.md`

## Baseline Summary

- Command surface: `yarn run build:netlify`
- Build result: success with warnings
- Warning count: `2`
- In-scope warning IDs: `W001`, `W002`

## Warning Signatures Observed

1. `Critical dependency: the request of a dependency is an expression`
2. `Module not found: Error: Can't resolve 'mongodb-client-encryption'`

## Call Path Observed In This Run

- `./node_modules/mongodb/lib/utils.js`
- `./node_modules/mongodb/lib/change_stream.js`
- `./node_modules/mongodb/lib/index.js`
- `./src/lib/MongodbService.ts`
- `./src/functions/auth.ts`

## Register Comparison

- Signature match: yes; both backend warning signatures still match `W001` and `W002` in the warning register.
- Source-module match: yes; both warnings still originate from `node_modules/mongodb/lib/utils.js`.
- Call-path note: the current build routes through `mongodb/lib/change_stream.js` in this run, whereas archived Track B evidence showed a `mongodb/lib/db.js` path in one earlier post-Track B capture.

## Notes

- Track C starts from a warning baseline that still contains exactly the two MongoDB-related backend warnings targeted by the plan.
