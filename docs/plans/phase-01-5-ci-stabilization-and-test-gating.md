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
