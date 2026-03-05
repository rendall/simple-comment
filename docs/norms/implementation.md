# Implementation Conventions

Use this as a practical execution guide when implementing an approved checklist.

Implementation is step 2 of a lightweight 2-step process:

1. Create/approve a checklist using `docs/norms/checklist.md`.
2. Execute that checklist using this document.

If there is no approved checklist created under `docs/norms/checklist.md` conventions, stop and ask.

## Start State

- Run relevant tests to understand baseline behavior.
- Check `git status`.
- If unrelated files are dirty and scope is unclear, pause and confirm before proceeding.
- Checkout a new branch named as `<verb>-<optionalAdj>-<noun>` to describe intent.
  - This pattern is mandatory for new work branches.
  - Use lowercase kebab-case tokens.
  - Examples: `fix-auth-cookie`, `upgrade-core-dependencies`, `refactor-comment-pipeline`.

## Working Loop

1. Take the first incomplete checklist item (or its required prerequisite).
2. Group dependent items into one behavior slice when they form one coherent change.
3. Implement the slice.
4. Run targeted tests for touched scope.
5. Run broader/full tests at natural checkpoints.
6. Mark completed checklist items.
7. Commit with a short, imperative message.
8. Before opening a PR, run the repository local CI parity command (currently `yarn run ci:local`).
9. If lint/format checks fail, run `yarn run fix` (or targeted fixes), then re-run `yarn run ci:local`.

## PR Readiness

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
