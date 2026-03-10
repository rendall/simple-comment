# Checklist Conventions

Use this guide when writing implementation checklists.

Goal: make checklists clear enough that another engineer can execute them without hidden assumptions.

## Plan Prerequisite

Checklist authoring starts only after plan refinement is complete under `docs/norms/plan.md`.

Before drafting checklist items, extract and lock from the approved plan:

- in-scope statements
- out-of-scope statements
- acceptance criteria
- validation strategy and required evidence expectations (if present)

If the plan changes behavior, contracts, or build outputs and does not include the required `Validation Strategy` section, stop and fail conformance QC before checklist drafting.

## Traceability (Required)

Every checklist must include:

- a `Source plan:` reference near the top
- checklist items traceable to approved plan text via direct quote + section citation

Each checklist item must include a traceability sublist with:

- a short direct quote from the plan
- the source section heading
- optional plan line number(s) when useful for review (line numbers are advisory and may drift)

Recommended checklist item shape:

```md
- [ ] C01 `[tag]` Imperative implementation statement.
  - Depends on: C00.
  - Trace:
    - "plan quote 1" (Section)
    - "plan quote 2" (Section)
```

Scope-control rules:

- Do not silently add scope not present in the approved plan.
- Treat an item as out-of-plan if it is not directly supported by the plan's `In Scope`, `Acceptance Criteria`, or other quoted approved plan text.
- If an out-of-plan item is proposed, label it `Proposed Add-on (Not in Plan)` and include a one-line rationale.
- `Proposed Add-on (Not in Plan)` items are advisory only until explicit approval is recorded in writing (issue, PR, or thread comment).
- Do not convert a `Proposed Add-on (Not in Plan)` item into a normal checklist item until that approval exists.

## Validation Mapping (Required When Plan Requires Evidence)

When the source plan includes a `Validation Strategy` or acceptance criteria that require explicit evidence:

- include dedicated validation items (for example `Txx`) or cite existing test commands/files that satisfy that evidence
- ensure each implementation item (`Cxx`) has an explicit validation path:
  - inline validation in the item text, or
  - dependency on one or more `Txx` items
- keep validation scope tied to approved plan intent; out-of-plan validation work must use `Proposed Add-on (Not in Plan)`
- for build/tooling migrations, prefer contract/parity and smoke validation over bundler-internal assertions

## Item Quality

Each checklist item should be:

- Atomic (one behavior change per item).
- Imperative (clear action verb).
- Checkable (easy to tell when done).
- Scoped (prefix with a tag like `[backend]`, `[docs]`, `[frontend]`).
- Committable (can be completed and committed in one atomic commit).

If code changes are involved, name exact files/functions.

If an item depends on another, state that dependency explicitly.

If an item contains multiple independent actions (for example several `and` clauses), split it unless those actions are inseparable fallout in the same surface.

## Atomicity Gate (Required Before Approval)

A checklist item passes approval only if:

- It can be marked complete (`[ ]` -> `[x]`) without also completing another checklist item.
- It can be committed as one atomic commit without mixing unrelated checklist work.

If an item fails this gate, split it before implementation. Do not defer splitting to implementation.

## Checklist QC Modes

Two QC modes are supported:

- `Conformance QC` (default): verify checklist fidelity to plan and checklist norms only.
- `Advisory QC` (optional): propose improvements beyond current plan/checklist.

Conformance QC must not silently rewrite scope. It reports deviations.

QC output format:

- `Missing from plan`
- `Extra beyond plan`
- `Atomicity fixes needed`
- `Validation mapping gaps`
- `Pass/Fail: checklist achieves plan goals`

If advisory suggestions are included, place them in a separate `Advisory` section after conformance results.

## Exclusions

Do not add speculative testing work.

Include test/validation items only when:

- the approved plan/acceptance criteria require evidence, or
- the user explicitly requests testing work.

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
- Slices define execution order/grouping only; they do not permit multi-item commits.
