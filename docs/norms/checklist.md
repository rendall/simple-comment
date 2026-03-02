# Checklist Conventions

Use this guide when writing implementation checklists.

Goal: make checklists clear enough that another engineer can execute them without hidden assumptions.

## Item Quality

Each checklist item should be:

- Atomic (one behavior change per item).
- Imperative (clear action verb).
- Checkable (easy to tell when done).
- Scoped (prefix with a tag like `[backend]`, `[docs]`, `[frontend]`).

If code changes are involved, name exact files/functions.

If an item depends on another, state that dependency explicitly.

## Exclusions

Unless a task explicitly requests testing steps, do not include test-writing/execution steps in the checklist itself.

## Behavior Slices

After atomic items, add a `## Behavior Slices` section to group execution bundles.

For each slice include:

- `Goal`: one coherent behavior outcome.
- `Items`: exact checklist items covered by that slice.
- `Type`: `behavior` or `mechanical`.

Rules:

- Every checklist item belongs to exactly one slice.
- Slices must remain within approved scope.
- Slices do not replace atomic items; they organize them.
