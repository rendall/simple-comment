# Priority 4 Mini-Plan — Frontend / Build Modernization

Status: archived

Source backlog: `docs/RepoHealthImprovementBacklog.md` via `docs/archive/Priority4DependencyModernizationPlan.md`

Classification: historical plan artifact

## Goal

Modernize the frontend/build lane enough to support the Svelte 5 ecosystem shift while keeping contributor commands and the local runtime working.

## Intent

This slice completed the previously deferred frontend/build modernization lane from Priority 4.

Success for this lane meant:

- the frontend stack runs on the current Svelte 5-compatible toolchain,
- `yarn run build:frontend`, `yarn test:frontend`, and `yarn typecheck` remain green,
- local `simple-comment` runtime mounting works again after the Svelte 5 upgrade,
- the resulting warning/error cleanup is narrow and reviewable rather than a broad rewrite,
- and remaining runtime concerns are separated from frontend/build work.

## In Scope

- Svelte 5 ecosystem alignment in the existing frontend/build stack
- Vite/Svelte preprocess alignment with the repo's frontend tsconfig
- frontend Jest compatibility work required by the Svelte 5 dependency graph
- source-level compatibility fixes required to restore clean frontend build/test/typecheck behavior
- embed/runtime entrypoint compatibility fixes required by Svelte 5's mount model

## Out of Scope

- backend/runtime MongoDB configuration changes
- runtime/platform dependency work outside frontend/build coupling
- broad component rewrites unrelated to upgrade compatibility
- architecture changes to the comment application itself

## Result

This lane is complete and archived.

Implemented outcomes:

- `svelte` upgraded to `^5.55.0`
- `@sveltejs/vite-plugin-svelte` upgraded to `^4.0.0`
- `svelte-preprocess` upgraded to `^6.0.3`
- frontend Jest path aligned to the current ESM dependency edge (`esm-env`)
- frontend tsconfig/build path aligned to `verbatimModuleSyntax`
- Svelte 5 invalid non-void self-closing tags fixed
- type-only XState imports applied to remove build noise
- `src/simple-comment.ts` migrated from `new Component(...)` to `mount(...)`

## Validation Summary

- `yarn lint` passes
- `yarn run prettier --list-different .` passes
- `yarn typecheck` passes
- `yarn test:frontend` passes
- `yarn run build:frontend` passes
- local runtime works once the backend and MongoDB are available

## Follow-on Note

During post-upgrade validation, rerunning `yarn run ci:local` after local Netlify dev/runtime activity caused ESLint to walk generated `.netlify/functions-serve/*` artifacts. That is an environment/generated-artifact issue, not a frontend/build regression, and should be handled separately from this archived frontend lane.
