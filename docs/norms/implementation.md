# Implementation Conventions

Use this as a practical execution guide when implementing an approved checklist.

Implementation is step 3 of a lightweight 3-step process:

1. Refine/approve a plan using `docs/norms/plan.md`.
2. Create/approve a checklist using `docs/norms/checklist.md`.
3. Execute that checklist using this document.

If there is no approved checklist created under `docs/norms/checklist.md` conventions, stop and ask.

## Start State

- Run relevant tests to understand baseline behavior.
- If the current branch is `master`, then check out a new branch 
  - named as `<verb>-<optionalAdj>-<noun>` to describe intent
  - Use lowercase kebab-case tokens.
  - Examples: `fix-auth-cookie`, `upgrade-core-dependencies`, `refactor-comment-pipeline`.
- Check `git status`.
- If dirty files exist:
  - If they are directly related to the approved phase governance context
    (for example: phase checklist, phase plan, or norms updates required for execution), commit them first with a short setup commit message (for example `Init <phase>`).
  - If they are outside approved phase scope, stop and ask.


## Rules

- Each checklist item must be completed in its own atomic commit.
- Do not include multiple checklist items in one commit.
- Each item commit must include:
  - only that checked item in the list (i.e. `[ ]` => `[x]`)
  - that checklist item's atomic implementation (if any)
- If an item cannot be completed atomically during implementation, stop and request checklist revision; do not batch partial work across items.
- The commit message must be the checklist copy in imperative form, edited for length (less than 50 characters) and clarity.
- Do not include tags or checklist ids in the message.

e.g. The commit message for this item

```md
- [x] C01 `[governance]` Confirm scope is limited to adding a local CI-parity command path for the existing PR gate workflow (`.github/workflows/netlify-api-test.yml`) and is aligned to `docs/norms/ci-parity.md`: dependency-resolution + validation parity (install with lockfile/options, lint, prettier check, `build:netlify`, `test:backend`, `test:frontend`) without changing workflow behavior, adding CodeQL-local emulation, or mirroring CI runner/bootstrap steps (`actions/checkout`, `actions/setup-node`, global `npm install yarn@^1 -g`).
```

becomes something like:

`Confirm scope is limited to CI-parity command`

## Validation Selection

Select the primary validation approach for each checklist item from plan/checklist requirements:

- behavior/contract logic change: prefer fail-first unit/integration tests
- build/tooling migration: prefer contract/parity harness checks plus runtime smoke checks
- docs/governance-only change: validate references, commands, and cited evidence consistency

Do not rely on tool-internal assertions when behavior-level evidence is available.

## Working Loop

1. Take the first incomplete checklist item.
2. Prepare the item validation path:
   - run existing checklist-cited validation commands/tests first when they already satisfy required evidence
   - use fail-first tests for behavior/contract changes when appropriate
   - use harness/parity/smoke validation for build/tooling migration items
3. Implement the item.
4. Drive the implementation to green by changing production code first; only change tests to correct invalid assumptions, never to mask a failing implementation.
5. Run broad tests to detect regressions. If regressions appear, attempt to fix only the in-scope implementation code for the current item. If green cannot be restored without changing tests or out-of-scope code, stop coding and request direction.
6. Mark completed checklist item and commit the implementation with a short, imperative message per rules, above.
7. Continue with the loop until the checklist is complete.

## PR Readiness

- Before opening a PR, run the repository local CI parity command (currently `yarn run ci:local`).
- If lint/format checks fail, run `yarn run fix` (or targeted fixes), then re-run `yarn run ci:local`.
- Approved checklist items are completed or explicitly deferred with rationale.
- Local CI parity command (`yarn run ci:local`) passes, or a concrete blocker is documented in PR validation notes.
- Formatting/lint issues are resolved (`yarn run fix` only when needed).
- Branch is clean and commits are pushed.
- PR description includes scope summary and validation evidence.

## Commit Hygiene

- Keep commits scoped to the current slice.
- Avoid bundling unrelated file changes.
- Keep message lines concise and descriptive.

## Stop Conditions

Pause and confirm direction when:

- Proposed changes exceed checklist scope.
- Governance or contract references conflict.
- You find unexpected repo state that could risk unrelated work.
