# Priority 2 Track D Warning Register

Source log:
- `docs/archive/priority2-track-d/build-frontend-baseline.log`

## Current Frontend Build Messages

| ID | Tool / Stage | Message Signature | Source Surface | Frequency Pattern | Track D Disposition | Rationale | Owner | Re-check Trigger |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D001 | Vite / frontend build setup | `The CJS build of Vite's Node API is deprecated.` | Vite Node API bootstrap via `vite.config.ts` on the current stack | Once per frontend build | `tolerated residual notice` | The message is ecosystem/tooling-facing and the current plan treats it as residual unless a clearly low-risk repo-local alignment fix exists without expanding modernization scope. | frontend-build-system | Re-check if Track D finds a low-risk repo-local fix, or when a later Vite/toolchain modernization phase is approved. |
| D002 | vite-plugin-svelte / frontend transform | `[vite-plugin-svelte] WARNING: ... no exports condition for svelte` | Third-party package metadata for `carbon-icons-svelte` imports used in `src/components/CommentDisplay.svelte` and `src/components/low-level/PasswordInput.svelte` | Once per frontend build | `tolerated residual notice` | The message is driven by third-party package metadata and Track D defaults to tolerance unless the dependency path is already changing for another approved reason. | frontend-build-system | Re-check if `carbon-icons-svelte` metadata changes upstream, if the dependency is replaced for another approved reason, or if a low-risk repo-local import/config alignment becomes available. |

Current post-Track D count: `2` residual notices, `0` actionable warnings.

## Resolved During Track D

| ID | Former Message Signature | Resolution | Evidence |
| --- | --- | --- | --- |
| D003 | `/css/simple-comment-style.css doesn't exist at build time, it will remain unchanged to be resolved at runtime` | Removed by replacing the literal stylesheet href in the entry HTML with a placeholder token and letting the Vite HTML transform inject the dev/build-specific stylesheet path while preserving the emitted `/css/simple-comment-style.css` contract. | `docs/archive/priority2-track-d/build-frontend-after.log`, `docs/archive/priority2-track-d/warning-before-after.md` |
