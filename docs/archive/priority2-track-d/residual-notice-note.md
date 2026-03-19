# Priority 2 Track D Residual Notice Note

## Residual Notices Accepted After Track D

### D001 — Vite CJS Node API deprecation notice

- Message:
  - `The CJS build of Vite's Node API is deprecated.`
- Final Track D disposition:
  - `tolerated residual notice`
- Why it remains:
  - Track D removed the repo-local stylesheet-path warning first, as required by the plan.
  - No additional clearly low-risk repo-local candidate was identified that would reduce this notice without pushing Track D into broader Vite/module-format modernization work.
- Owner:
  - `frontend-build-system`
- Re-check trigger:
  - revisit when a later approved Vite/toolchain modernization phase is opened, or if a clearly low-risk config-loading alignment becomes available on the current stack.
- Future handoff:
  - carry this notice forward as modernization-phase input rather than re-opening Track D for speculative toolchain churn.

### D002 — `carbon-icons-svelte` export-condition warning

- Message:
  - `[vite-plugin-svelte] WARNING: ... no exports condition for svelte`
- Final Track D disposition:
  - `tolerated residual notice`
- Why it remains:
  - The warning is driven by third-party package metadata rather than a repo-owned contract issue.
  - Removing it during Track D would likely require dependency replacement or broader dependency churn with low direct value after the repo-local warning was already eliminated.
- Owner:
  - `frontend-build-system`
- Re-check trigger:
  - revisit if `carbon-icons-svelte` updates its metadata, if the dependency is replaced for another approved reason, or if a low-risk repo-local import/config alignment emerges.
- Future handoff:
  - treat as dependency/watchlist input rather than active Track D remediation work.

## Track D Exit Statement

- Current frontend build noisy-signature state:
  - `2` tolerated residual notices
  - `0` actionable frontend warnings
- Exit basis:
  - the only clearly repo-local frontend build warning/noise signature was removed,
  - the remaining messages are intentionally documented with owner and re-check triggers,
  - and additional remediation would exceed the approved low-risk Track D scope.
