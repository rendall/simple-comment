# Validation Gate and CI/Local Parity Checklist

Status: proposed

Source plan: `docs/plans/ValidationGateAndCiLocalParityPlan.md`

## Checklist

- [ ] C01 `[ci]` Update `.github/workflows/netlify-api-test.yml` so the required PR gate includes `yarn run typecheck` and full `yarn run build`.
  - Depends on: none.
  - Validation: T01.
  - Trace:
    - "Set `yarn run typecheck` as required PR-gate validation." (In Scope)
    - "Set full `yarn run build` as required PR-gate validation." (In Scope)

- [ ] C02 `[ci]` Confirm required PR-gate workflow does not include browser smoke tests for this phase.
  - Depends on: C01.
  - Validation: T01.
  - Trace:
    - "Keep browser smoke coverage out of the required PR gate for this phase." (In Scope)
    - "Browser smoke tests are not part of the required PR gate for this phase." (Acceptance Criteria)

- [ ] C03 `[scripts]` Update `scripts/ci-local.sh` so `yarn run ci:local` mirrors the required PR-gate validation sequence.
  - Depends on: C01, C02.
  - Validation: T01, T02.
  - Trace:
    - "Define `yarn run ci:local` as the local mirror of required PR-gate validation behavior." (In Scope)
    - "`yarn run ci:local` mirrors the required PR-gate validation sequence." (Acceptance Criteria)

- [ ] C04 `[scripts]` Mirror required determinism/runtime-affecting CI env values in `scripts/ci-local.sh` where parity norms require it.
  - Depends on: C03.
  - Validation: T01, T02.
  - Trace:
    - "Require mirrored determinism/runtime-affecting environment values between PR gate and `ci:local` where parity norms require it." (In Scope)
    - "Determinism/runtime-affecting CI env values that parity norms require are mirrored in `ci:local`." (Acceptance Criteria)

- [ ] C05 `[governance]` Add parity-coupling language in `.github/workflows/netlify-api-test.yml` and/or `scripts/ci-local.sh` stating that required PR-gate step/env changes must include same-change `ci:local` updates.
  - Depends on: C03, C04.
  - Validation: T01.
  - Trace:
    - "Require parity coupling so PR-gate validation step/env changes include same-change updates to `ci:local`." (In Scope)
    - "Any change to required PR-gate validation steps/env is defined to require same-change `ci:local` updates." (Acceptance Criteria)

- [ ] C06 `[docs]` Add one canonical explanation in a single contributor-facing location describing what `yarn run ci:local` mirrors and what it intentionally does not mirror.
  - Depends on: C03, C04, C05.
  - Validation: T03.
  - Trace:
    - "Add one short canonical explanation of what `ci:local` mirrors and what it deliberately does not mirror." (In Scope)
    - "The parity story explicitly states what `ci:local` mirrors and what it intentionally does not mirror." (Acceptance Criteria)

- [ ] T01 `[validation]` Contract/parity validation: verify PR workflow and `scripts/ci-local.sh` define the same required validation sequence, required mirrored env values, and parity-coupling rule.
  - Depends on: C01, C02, C03, C04, C05.
  - Trace:
    - "Pass when the PR workflow and `scripts/ci-local.sh` define the same required validation sequence and required mirrored env behavior." (Validation Strategy)
    - "Fail when required PR-gate steps/env are missing from `ci:local` or differ without explicit parity justification." (Validation Strategy)

- [ ] T02 `[validation]` Smoke/process validation: run `yarn run ci:local` and confirm the required gate path executes successfully.
  - Depends on: C03, C04.
  - Trace:
    - "Pass when `yarn run ci:local` executes successfully using the required gate path." (Validation Strategy)
    - "Fail when `yarn run ci:local` fails on the required path or omits required steps." (Validation Strategy)

- [ ] T03 `[validation]` Documentation/process clarity validation: confirm exactly one canonical parity explanation exists and that its mirrored/non-mirrored scope is explicit and non-contradictory.
  - Depends on: C06.
  - Trace:
    - "Pass when one canonical explanation exists for mirrored vs intentionally non-mirrored parity scope." (Validation Strategy)
    - "Fail when parity scope remains implicit, fragmented, or contradictory." (Validation Strategy)

## Behavior Slices

- Goal: Strengthen minimum PR-gate checks while explicitly excluding browser smoke from required gating in this phase.
  Items: C01, C02
  Type: behavior

- Goal: Align local parity implementation to required PR-gate checks and deterministic env assumptions.
  Items: C03, C04
  Type: behavior

- Goal: Preserve long-term parity clarity through drift-prevention governance and one canonical contributor explanation.
  Items: C05, C06
  Type: mechanical

- Goal: Provide explicit evidence that contract/parity, smoke/process, and clarity requirements are satisfied.
  Items: T01, T02, T03
  Type: mechanical
