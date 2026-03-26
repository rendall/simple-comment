# Priority 4 — Frontend / Build Checklist 01

Status: archived

Source plan: `docs/archive/Priority4FrontendBuildModernizationPlan.md`

QC mode: Conformance QC

## Scope Lock

- Complete the deferred frontend/build modernization lane from Priority 4.
- Keep the work inside frontend/build compatibility and validation.
- Restore local embed/runtime behavior after the Svelte 5 shift.
- Do not absorb unrelated backend/runtime or MongoDB work into this slice.

## Atomic Checklist Items

- [x] C01 `[inventory]` Confirm the current frontend/build target stack and record the intended Svelte 5-compatible dependency surface in `package.json` / `yarn.lock`.
- [x] C02 `[config]` Align the frontend TypeScript, Vite, and Svelte preprocess path so the Svelte 5 toolchain uses the correct frontend tsconfig and no longer emits the stale `verbatimModuleSyntax` warning.
- [x] C03 `[test]` Align the frontend Jest path with the post-upgrade ESM dependency graph so frontend tests remain runnable under the updated stack.
- [x] C04 `[source]` Fix the source-level compatibility fallout surfaced by the upgrade, including `noImplicitAny` regressions, type-only imports, and invalid non-void self-closing tags.
- [x] C05 `[runtime]` Update the embed entrypoint from the legacy Svelte component-constructor API to the Svelte 5 mount API so local runtime mounting succeeds again.
- [x] C06 `[docs]` Finalize the validation notes with the final dependency/config state, command evidence, and any residual environment caveats that are outside the frontend/build lane itself.

## Validation Items

- [x] T01 `[validation]` Command validation: `yarn lint`, `yarn run prettier --list-different .`, `yarn typecheck`, `yarn test:frontend`, `yarn run build:frontend`
- [x] T02 `[validation]` Runtime validation: confirm the `simple-comment` embed mounts again in local development once the backend/runtime prerequisites are available.
- [x] T03 `[validation]` Process validation: record any residual issue that is environmental/generated-artifact noise rather than a frontend/build regression.

## Outcome

- Frontend/build modernization completed successfully.
- Priority 4 no longer has an active frontend/build lane.
