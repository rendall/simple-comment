# Priority 2 Track D Remediation Candidate Note

Source artifacts:
- `docs/archive/priority2-track-d/build-frontend-baseline.log`
- `docs/archive/priority2-track-d/warning-register-current.md`

## Candidate Ranking

### 1. Stylesheet-path mitigation

- Scope surfaces:
  - `vite.config.ts`
  - `src/entry/index.html`
  - `src/entry/icebreakers/index.html`
- Warning target:
  - `/css/simple-comment-style.css doesn't exist at build time, it will remain unchanged to be resolved at runtime`
- Risk class:
  - `MEDIUM`
- Why it ranks first:
  - This is the primary repo-local mitigation candidate in the Track D plan.
  - The warning comes from repo-owned HTML/Vite entry handling rather than third-party package metadata.
  - The built output currently still emits the expected `/css/simple-comment-style.css` link in `dist/index.html` and `dist/icebreakers/index.html`, so the problem is build-output noise/clarity rather than an obvious broken artifact contract.
- Candidate directions:
  - Prefer a narrow build-aware HTML/config alignment that preserves the existing `dist/css/simple-comment-style.css` contract.
  - Avoid any change that requires broad frontend entry refactoring or changes embed/runtime behavior.
- Expected benefit:
  - Possible removal of the only clearly repo-owned frontend build warning/noise signature.
- Main risk:
  - A misguided fix could change built HTML asset references or stylesheet loading behavior without meaningfully improving user-facing behavior.

### 2. Low-risk Vite-config alignment

- Scope surfaces:
  - `vite.config.ts`
  - `package.json` scripts only if absolutely required by a low-risk repo-local config-loading adjustment
- Warning target:
  - `The CJS build of Vite's Node API is deprecated.`
- Risk class:
  - `MEDIUM-HIGH`
- Why it ranks second:
  - The plan allows this notice to remain documented unless a genuinely low-risk repo-local fix exists.
  - Likely remediation paths are closer to toolchain/config-loading alignment than to output-contract repair.
  - This has more modernization spillover risk than the stylesheet-path notice.
- Candidate directions:
  - Only consider repo-local config-loading alignment that does not force a broader Vite/Svelte/module-format migration.
  - Defer if the path requires package-format or toolchain modernization.
- Expected benefit:
  - Reduced ecosystem/tooling notice noise.
- Main risk:
  - Expanding Track D into module-format/toolchain modernization work.

### 3. `carbon-icons-svelte` metadata warning removal

- Scope surfaces:
  - `src/components/CommentDisplay.svelte`
  - `src/components/low-level/PasswordInput.svelte`
  - `package.json` only if another approved change already touches the dependency path
- Warning target:
  - `[vite-plugin-svelte] WARNING: ... no exports condition for svelte`
- Risk class:
  - `HIGH`
- Why it ranks third:
  - The warning is driven by third-party package metadata rather than a repo-owned contract issue.
  - The plan defaults this message to tolerated-residual scope unless the dependency is already changing for another approved reason.
  - Attempting to remove it now likely means package churn or component import-path redesign with little direct build-output trust gain.
- Candidate directions:
  - Keep as tolerance-first unless another approved change already touches icon dependencies.
- Expected benefit:
  - Minor reduction in third-party warning noise.
- Main risk:
  - Spending Track D scope on dependency churn with limited user-facing value.

## Selection Recommendation

Recommended first loop candidate: `stylesheet-path mitigation`.

Why:

- It is the only current frontend noise signature that is clearly repo-local and directly tied to build-output clarity.
- It offers the best chance of improving contributor trust without entering dependency/toolchain modernization work.
- If a safe mitigation does not emerge quickly, the fallback path is still in-plan: document the warning as an intentional residual notice and keep the output contract unchanged.

## Locked Loop Candidate

- Selected candidate:
  - `stylesheet-path mitigation`
- Working hypothesis:
  - Replace the hard-coded built stylesheet href in `src/entry/index.html` and `src/entry/icebreakers/index.html` with the source stylesheet entry so Vite can manage the build/dev asset rewrite directly, then simplify `vite.config.ts` only if the custom dev-only stylesheet HTML transform becomes unnecessary.
- Expected validation path:
  - `yarn run build:frontend`
  - `bash ./scripts/validate-frontend-artifacts.sh dist`
  - `bash ./scripts/smoke-frontend-embed.sh dist`
- Revert trigger:
  - Revert immediately if the change alters the emitted `dist/css/simple-comment-style.css` contract, breaks built HTML asset references, or leaves the warning unchanged while increasing config complexity.

## Loop 1 Outcome

- Result:
  - `ACCEPT`
- Summary:
  - The placeholder-based HTML transform removed the repo-local stylesheet-path warning while preserving the emitted `/css/simple-comment-style.css` contract in built HTML.
- Validation:
  - `yarn run build:frontend`: passed
  - `bash ./scripts/validate-frontend-artifacts.sh dist`: passed
  - `bash ./scripts/smoke-frontend-embed.sh dist`: passed
