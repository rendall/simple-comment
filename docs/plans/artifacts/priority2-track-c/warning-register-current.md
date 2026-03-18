# Priority 2 Track C Warning Register (Current State)

Status: active

Source inputs:
- `docs/archive/priority2-pr-a/artifacts/warning-register.md`
- `docs/plans/artifacts/priority2-track-c/backend-warning-baseline.md`
- `docs/plans/artifacts/priority2-track-c/loop-attempt-c-cfg-01.md`
- `docs/plans/artifacts/priority2-track-c/loop-control-decision.md`

## Backend Warning Outcomes

| ID | Warning Signature | Baseline Disposition | Track C Outcome | Current Disposition | Owner |
| --- | --- | --- | --- | --- | --- |
| W001 | `Critical dependency: the request of a dependency is an expression` | `MITIGATE` | still present after accepted low-risk remediation | `TOLERATE` | `backend-data-access-system` |
| W002 | `Module not found: Error: Can't resolve 'mongodb-client-encryption'` | `MITIGATE` | removed by accepted `C-CFG-01` remediation | `ELIMINATE` | `backend-data-access-system` |

## Notes

- This Track C register is the current-state companion to the archived PR A warning register.
- The archived PR A register remains the baseline inventory artifact and is not rewritten in place.
