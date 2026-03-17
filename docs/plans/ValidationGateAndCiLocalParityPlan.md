# Validation Gate and CI/Local Parity Plan

Status: proposed for checklist authoring

Classification: formal plan candidate under `docs/norms/plan.md`

## Goal

Increase trust in the repository's green PR signal by defining a stronger minimum PR validation gate and a clear, durable CI/local parity contract.

## Intent

When this plan is complete, contributors should be able to run one local command and know it checks the same required validation path as the main PR gate.

A green PR should communicate a clear minimum quality bar without requiring contributors to guess what was and was not validated.

## In Scope

- Define the minimum PR validation gate for this phase.
- Set `yarn run typecheck` as required PR-gate validation.
- Set full `yarn run build` as required PR-gate validation.
- Keep browser smoke coverage out of the required PR gate for this phase.
- Define `yarn run ci:local` as the local mirror of required PR-gate validation behavior.
- Require mirrored determinism/runtime-affecting environment values between PR gate and `ci:local` where parity norms require it.
- Require explicit non-goals for local parity (runner/bootstrap and separate analysis workflows are not mirrored by default).
- Require parity coupling so PR-gate validation step/env changes include same-change updates to `ci:local`.
- Add one short canonical explanation of what `ci:local` mirrors and what it deliberately does not mirror.

## Out of Scope

- README and command-parity cleanup work (deferred to next PR/plan slice).
- Renaming or broad rationalization of developer command names.
- Dependency modernization.
- Build-warning cleanup.
- Frontend/backend architecture refactors.
- Expanding browser smoke coverage beyond optional/deeper validation paths.

## Constraints

- Keep parity behavior aligned with `docs/norms/ci-parity.md`.
- Keep required PR-gate checks strong enough to be meaningful but narrow enough to avoid avoidable throughput regressions.
- Preserve separation between required PR-gate validation and deeper optional validation.
- Keep changes reviewable and reversible in one phase slice.

## Risks and Mitigations

- Risk: Full build in the PR gate increases CI runtime.
  - Mitigation: keep browser smoke out of required gate in this phase; reevaluate gate runtime after baseline adoption.

- Risk: Contributors assume local parity covers all CI workflows.
  - Mitigation: document explicit parity non-goals in a canonical, easy-to-find location.

- Risk: CI/local drift reappears after this phase.
  - Mitigation: require same-change parity updates whenever PR-gate steps/env change.

## Open Questions / Deferments

- Deferment: README and command-parity cleanup is intentionally moved to the next PR/plan slice.
  - Owner: follow-on Priority 1 documentation slice author.
  - Follow-up phase: next Priority 1 docs/command-parity plan and checklist.
- Deferment: Browser smoke gating remains optional/deeper validation pending a future, explicitly scoped decision.
  - Owner: follow-on Priority 1 validation-gate refinement slice author.
  - Follow-up phase: future browser-smoke gating decision plan.

## Acceptance Criteria

1. The main PR gate includes `yarn run typecheck` as required validation.
2. The main PR gate includes full `yarn run build` as required validation.
3. Browser smoke tests are not part of the required PR gate for this phase.
4. `yarn run ci:local` mirrors the required PR-gate validation sequence.
5. Determinism/runtime-affecting CI env values that parity norms require are mirrored in `ci:local`.
6. The parity story explicitly states what `ci:local` mirrors and what it intentionally does not mirror.
7. Any change to required PR-gate validation steps/env is defined to require same-change `ci:local` updates.

## Validation Strategy

Required evidence for checklist completion:

- Contract/parity evidence
  - Pass when the PR workflow and `scripts/ci-local.sh` define the same required validation sequence and required mirrored env behavior.
  - Fail when required PR-gate steps/env are missing from `ci:local` or differ without explicit parity justification.

- Smoke/process evidence
  - Pass when `yarn run ci:local` executes successfully using the required gate path.
  - Fail when `yarn run ci:local` fails on the required path or omits required steps.

- Documentation/process clarity evidence
  - Pass when one canonical explanation exists for mirrored vs intentionally non-mirrored parity scope.
  - Fail when parity scope remains implicit, fragmented, or contradictory.
