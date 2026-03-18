# Priority 2 Track D Warning Register

Source log:
- `docs/archive/priority2-track-d/build-frontend-baseline.log`

## Current Frontend Build Messages

| ID | Tool / Stage | Message Signature | Source Surface | Frequency Pattern | Track D Disposition | Rationale | Owner | Re-check Trigger |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D001 | Vite / frontend build setup | `The CJS build of Vite's Node API is deprecated.` | Vite Node API bootstrap via `vite.config.ts` on the current stack | Once per frontend build | `tolerated residual notice` | The message is ecosystem/tooling-facing and the current plan treats it as residual unless a clearly low-risk repo-local alignment fix exists without expanding modernization scope. | frontend-build-system | Re-check if Track D finds a low-risk repo-local fix, or when a later Vite/toolchain modernization phase is approved. |
| D002 | vite-plugin-svelte / frontend transform | `[vite-plugin-svelte] WARNING: ... no exports condition for svelte` | Third-party package metadata for `carbon-icons-svelte` imports used in `src/components/CommentDisplay.svelte` and `src/components/low-level/PasswordInput.svelte` | Once per frontend build | `tolerated residual notice` | The message is driven by third-party package metadata and Track D defaults to tolerance unless the dependency path is already changing for another approved reason. | frontend-build-system | Re-check if `carbon-icons-svelte` metadata changes upstream, if the dependency is replaced for another approved reason, or if a low-risk repo-local import/config alignment becomes available. |
| D003 | Vite / frontend asset resolution | `/css/simple-comment-style.css doesn't exist at build time, it will remain unchanged to be resolved at runtime` | Runtime stylesheet link in `src/entry/index.html` and `src/entry/icebreakers/index.html`, plus Vite config behavior in `vite.config.ts` | Once per frontend build | `actionable warning` | This message is repo-local, affects build-output clarity directly, and the Track D decision policy makes it the primary mitigation candidate before spending effort on upstream/tooling notices. | frontend-build-system | Re-check immediately during the first Track D remediation loop and again after any change to frontend HTML entrypoints or stylesheet output handling. |
