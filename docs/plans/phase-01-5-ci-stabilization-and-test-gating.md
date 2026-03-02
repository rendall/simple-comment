# Phase 01.5 - CI Stabilization and Test Gating

Status: Planned

## Goal

Stabilize CI gating immediately after Phase 01 so merges are reliably blocked only by regressions, not known cross-runtime test brittleness.

## Scope

- Lock backend CI test runtime for `mongodb-memory-server` on GitHub runners.
- Keep Netlify/backend workflow scoped to backend checks only.
- Define temporary test-gating policy while frontend locale determinism is still pending.
- Record handoff boundaries to Phase 02 and Phase 03.

## Out of scope

- Full frontend locale test refactor.
- Broad CI matrix redesign.
- Backend runtime bug fixes targeted in Phase 02.

## Inputs and evidence

- Phase 01 CI failure on missing OpenSSL compatibility (`libcrypto.so.1.1`) for in-memory Mongo startup.
- Follow-up CI failure due unsupported version-platform archive (`ubuntu2404` + Mongo `6.0.14` 404/403).
- Confirmed working backend CI path with:
  - `MONGOMS_DOWNLOAD_URL=https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-6.0.14.tgz`
  - backend-only CI test execution.
- Known pre-existing frontend locale assertion instability in:
  - `src/tests/frontend/frontend-utilities.test.ts`

## Implementation steps

1. Ensure Jest Mongo config is loadable by `@shelf/jest-mongodb`:
   - keep `jest-mongodb-config.js` (CommonJS) as the canonical config file.
2. Keep CI backend Mongo download pinned:
   - enforce `MONGOMS_DOWNLOAD_URL` in `.github/workflows/netlify-api-test.yml`.
3. Keep Netlify workflow backend-scoped:
   - run `yarn test:backend` (not `yarn test`) in `netlify-api-test.yml`.
4. Document temporary gating contract:
   - backend workflow is required gate for this phase.
   - frontend locale test failures are tracked and deferred to deterministic test phase.
5. Add handoff note to Phase 03:
   - Phase 03 owns refactoring locale assertions to deterministic expectations and restoring frontend test gating in CI.

## Temporary test-gating policy (Phase 01.5)

- Required merge gate for this phase:
  - backend CI workflow (`.github/workflows/netlify-api-test.yml`) with lint, build, generated test env, and `yarn test:backend`.
- Explicitly deferred merge gate for this phase:
  - frontend locale-string assertions in `src/tests/frontend/frontend-utilities.test.ts`.
- Exit criteria for this temporary policy:
  - Phase 03 completes deterministic locale assertion refactor and restores frontend CI gating (`yarn test:frontend` required).

## Checklist QC Decisions (2026-03-02)

1. Issue: Documentation-oriented checklist items were partially ambiguous (what exact text/section should exist), which reduced checkability.
   Decision: Require explicit section names and handoff statement text targets in Phase 01.5 and Phase 03 docs.

2. Issue: Jest Mongo config item could pass even if a conflicting `jest-mongodb-config.ts` file reappears later.
   Decision: Define `jest-mongodb-config.js` as canonical and explicitly require no root-level `jest-mongodb-config.ts` in this phase.

3. Issue: Mongo download pinning had no explicit fallback/rotation note if the upstream URL changes.
   Decision: Require PR phase notes to include pin rationale, verification method, and update procedure for URL rotation.

## Checklist integration pass (2026-03-02)

- Verified checklist items reflect QC decisions:
  - explicit section targets and text targets for docs handoff items
  - canonical Jest Mongo config expectation with no competing TS config
  - explicit CI download pin and note requirements
- Verified dependency chain consistency:
  - C03 depends on C02
  - C05 depends on C03/C04
  - C06 depends on C05
  - C08 depends on C03/C04/C05/C06/C07
- Integration finding:
  - `docs/plans/README.md` Phase 01 link still pointed to `docs/plans/phase-01-dependency-and-platform-upgrade.md` after archive move.
  - Decision: repoint Phase 01 link to `docs/archive/phase-01-dependency-and-platform-upgrade.md`.

## Checklist sanity pass (2026-03-02)

- No remaining blockers for Phase 01.5 implementation.
- CI/backend stabilization controls are present (`MONGOMS_DOWNLOAD_URL`, backend-scoped test command).
- Documentation handoff path to Phase 03 is now explicit.

## Phase notes for PR narrative

Capture these Phase 01.5 notes in the PR body:

- CI failure cause (OpenSSL/runtime and archive-resolution mismatch summary).
- Why `MONGOMS_DOWNLOAD_URL` pinning was chosen for current `@shelf/jest-mongodb` version.
- Verification evidence used for the pinned URL (for example, successful backend CI run and archive reachability check).
- Temporary gating policy rationale (backend required, frontend locale determinism deferred).
- Clear retirement condition for temporary policy (Phase 03 restores deterministic frontend assertions and required frontend gate).
- Fallback update procedure if pinned URL becomes unavailable (select new supported archive URL, verify reachability, re-run backend CI).

## Risk and mitigation

- Risk: frontend regressions could go undetected if frontend tests are not gated.
- Mitigation:
  - keep frontend tests runnable locally and in PR notes.
  - prioritize Phase 03 immediately after Phase 02, or sooner if frontend churn increases.

- Risk: pinned MongoDB download URL becomes unavailable upstream.
- Mitigation:
  - document fallback URL/version update procedure in PR notes.
  - keep pin isolated to workflow env for fast updates.

## Acceptance criteria

- Netlify CI workflow passes on `ubuntu-latest` without manual apt installs.
- Backend tests are reliably green in CI with generated `.env`.
- Gating policy and defer rationale are documented in plans/PR narrative.
- No changes in this phase alter API/runtime behavior.

## Rollback

- Revert workflow changes to return to previous CI behavior.
- If rollback is needed urgently, disable only Mongo pinning step and re-open this phase with updated binary strategy.
