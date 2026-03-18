# Priority 2 Track B Good-Enough Exit Decision

## Thresholds

- material improvement: >= 0.25 MiB reduction per function OR >= 10% reduction versus latest accepted baseline
- marginal improvement: < 0.05 MiB net reduction per function across two consecutive accepted iterations
- major regression: >= 0.10 MiB growth per function OR >= 5% growth versus latest accepted baseline

## Decision

- Result: **Exit Track B active optimization** and proceed to Track C/E/F handoff.

## Evidence basis

- C03 delivered material reduction from ~2.94 MiB to ~1010 KiB per function.
- Subsequent accepted iterations (C04/C05 class) produced marginal size movement.
- Remaining candidate (structural split) is high risk relative to demonstrated incremental gain.

## Re-open triggers

- Any major regression threshold breach.
- New dependency additions causing >= material threshold growth.
