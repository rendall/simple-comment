# Plan Conventions

Use this guide to turn a brainstormed implementation design into a formal, checklist-ready plan.

Goal: produce a plan that is clear, collaborative, traceable, and faithful to user intent.

## Source of Truth

The approved plan is the source of truth for checklist authoring and implementation intent.

If implementation fails the approved plan intent, implementation has failed even if code compiles/tests pass.

## Collaboration Requirement
Plan refinement is collaborative by default.

Do not treat a brainstorm draft as finalized plan scope without stepping through details together.

Before checklist authoring, collaborators must explicitly confirm:

- intended outcomes
- scope boundaries
- acceptance criteria
- unresolved ambiguities/deferments

## Plan Sections

Include whatever sections are necessary to surface goal and intent clearly. More than that is noise that can hinder clarity.

### Required

A formal plan must include:

- `Goal` (plain-language objective)
- `Intent` (Plain-language, human-readable statement of what success means, without jargon)
- `In Scope`
- `Out of Scope`
- `Acceptance Criteria`

### Possible

A formal plan may include:

- `Constraints` (technical/process constraints)
- `Risks and Mitigations`
- `Open Questions / Assumptions`
- `Validation Strategy` *required* when the plan changes behavior, contracts, or build outputs

## Plain-Language Intent Standard

The `Plain-Language Intent` section must be understandable by a contributor who did not write the plan.

Clarity rules:

- prefer everyday language over specialized shorthand
- define unavoidable technical terms in-line
- avoid overloaded terms without context
- avoid stacked clauses that hide multiple decisions

If neither collaborator can rewrite intent in plain language, pause planning and simplify before proceeding.

## Ambiguity and Risk Surfacing

During plan refinement, explicitly surface:

- ambiguous wording
- hidden assumptions
- cross-surface coupling risks
- potential contract/behavior conflicts

Any unresolved ambiguity must be either:

- resolved in the plan text, or
- captured as an explicit deferment with owner/follow-up phase.

## Validation Strategy (When Required)

When a plan changes behavior, contracts, or build outputs, include a `Validation Strategy` section that states required evidence.

The strategy should specify applicable evidence levels:

- unit
- integration/smoke
- contract/parity
- non-functional checks (performance/size/timing), only when in scope

For each required evidence type, define what is considered pass/fail in plain language.

## Plan QC Modes

Two QC modes are supported:

- `Conformance QC` (default): fidelity to user intent, scope, and required plan structure.
- `Advisory QC` (optional): optional improvements beyond current plan.

Conformance QC output format:

- `Intent clarity issues`
- `Missing required sections`
- `Ambiguities/assumptions to resolve`
- `Validation strategy gaps`
- `Traceability readiness`
- `Pass/Fail: ready for checklist authoring`

Advisory suggestions must be separated under a distinct `Advisory` section.

## Exit Criteria for Checklist Authoring

Checklist authoring under `docs/norms/checklist.md` may begin only when:

- required plan sections are present
- plan text contains clear, quoteable statements under stable section headings so checklist items can cite source intent directly
- acceptance criteria are explicit and testable/checkable
- if required, `Validation Strategy` defines checkable evidence expectations
- plain-language intent is approved by collaborators
- conformance QC result is `Pass`
