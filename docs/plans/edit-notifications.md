# Comment edit notifications

Status: approved for execution by the maintainer's request to take #248 from planning through tests, implementation, and a PR. Review happens on the PR; merging is not authorized.

## Goal

Notify moderators when an authorized edit changes a saved comment's text.

## Intent

An edit can introduce content that needs attention. Moderators should receive the updated comment and its author's details, while a delivery problem must never turn a saved edit into a failed request.

## In Scope

- **Slice 1:** Add edit notices after successful persistence, with the full updated plain text and the comment author's details. Preserve authorization, unchanged-text rejection, and existing response conventions. An administrator is the editor, not necessarily the author. If the author record is unavailable, say so instead of attributing the comment to the administrator. Retire the blanket PUT-does-not-notify assertion.
- **Slice 2:** Isolate notification preparation and delivery failures from successful edits. Exercise the real endpoint with Resend, SendGrid, and notifications disabled, including provider timeouts and rejected edits. Update the notification guide.
- Use the existing notification abstraction and provider deadlines. Confirm an update matched a comment before notifying; an unmatched or unsuccessful database result must not send a notice.
- **Review slice 1:** Reuse the authenticated user for self-edit notices, including administrators editing their own comments. Administrator edits of someone else's comment still identify the original author.
- **Review slice 2:** Bound the remaining notification author lookup to one second, clear its timer on completion, and treat timeout as a preparation failure: log safely, return the saved edit's `204`, and send nothing. A late lookup result must not trigger an email. Keep the missing-author fallback and rejected-lookup behavior; update the guide.

## Out of Scope

Authorization changes, new edit length limits, revision history, before/after comparisons, comment links, a new notification framework, retries, provider changes, and deployment verification. Links remain in #240 and deployment verification remains in #249.

## Acceptance Criteria

- An authorized saved text change sends one edit notice containing the full updated text and the original comment author's name/email when available.
- Comments and replies are supported. Multiline and markup-like text remain literal plain text.
- Unchanged, unauthenticated, unauthorized, missing/deleted, and failed or unmatched updates send nothing.
- The request awaits delivery completion or the provider deadline, retaining its existing successful update response when notification preparation or delivery fails.
- Returned failures, promise rejections, synchronous throws, and timeouts cannot leak raw provider details into logs or HTTP responses.
- Disabled notifications leave editing working without sends or extra author lookups for notification preparation.
- Self-edits make no extra author query. Administrator edits of others have a bounded author lookup, with no leftover deadline timer on success, missing-author results, rejection, or timeout.

## Validation Strategy

Use real MongoDB persistence with an injected notification stub for lifecycle and content tests. Inspect stored state during the send. Cover no-send gates and unsuccessful/unmatched database results. Preserve existing POST tests and API response conventions. Use real endpoint/resolver/provider adapters with SDK boundaries stubbed for both providers and disabled mode. Advance fake timers only after persistence and SDK invocation; test deadline behavior without sleeping for its production duration. Before each implementation commit, run its focused tests; finish with `yarn ci:local`, Markdown formatting, and diff checks. No live email sends.

For the author-lookup follow-up, activate fake timers only when the additional query starts, after the edit is saved. Verify timely completion independently of a late query result, and release deferred work in cleanup. Test self-edits with ordinary and administrator users without duplicating the existing administrator-attribution matrix.

## Checklist

Source plan: this document's In Scope and Validation Strategy; source requirement: [#248](https://github.com/rendall/simple-comment/issues/248). The maintainer explicitly authorized tests → commit/push → implementation → commit/push for each slice, then an integration-base PR and completion beep.

- [x] T01 Add slice 1 regression tests and remove the obsolete successful-PUT no-send expectation; record the expected failures, commit, and push.
  - Trace: “Add edit notices after successful persistence” and “Retire the blanket PUT-does-not-notify assertion.” (In Scope, Slice 1)
- [x] C01 Implement saved-edit notices and author attribution; make T01 green, commit, and push.
  - Depends on: T01.
  - Trace: “the full updated plain text and the comment author's details” (In Scope, Slice 1); validated by T01 and existing POST/endpoint suites.
- [x] T02 Add failure-isolation, endpoint, disabled-mode, and timeout coverage; record expected failures, commit, and push.
  - Depends on: C01.
  - Trace: “Exercise the real endpoint with Resend, SendGrid, and notifications disabled, including provider timeouts and rejected edits.” (In Scope, Slice 2)
- [x] C02 Isolate notification failures and update the guide; pass focused tests and local CI, commit, and push.
  - Depends on: T02.
  - Trace: “Isolate notification preparation and delivery failures from successful edits” and “Update the notification guide.” (In Scope, Slice 2); validated by T02 and Validation Strategy.
- [x] T03 Add fail-first tests for ordinary and administrator self-edits avoiding an extra author query; commit and push.
  - Trace: “Reuse the authenticated user for self-edit notices” (In Scope, Review slice 1).
- [x] C03 Reuse the loaded author, pass T03 and existing attribution tests, then commit and push.
  - Depends on: T03.
  - Trace: “including administrators editing their own comments” (In Scope, Review slice 1); validated by T03 and the existing administrator-edit tests.
- [x] T04 Add author-lookup deadline, timer cleanup, and late-result regressions; record expected failures, commit, and push.
  - Depends on: C03.
  - Trace: “A late lookup result must not trigger an email” and “clear its timer on completion” (In Scope, Review slice 2).
- [x] C04 Bound the lookup, update the guide, pass focused tests and local CI, then commit and push.
  - Depends on: T04.
  - Trace: “Bound the remaining notification author lookup to one second” (In Scope, Review slice 2); validated by T04 and Validation Strategy.

## Behavior Slices

- **Slice 1 — Saved edits:** One edit notice with correct content and authorship, only after a successful changed-text update. Items: T01, C01. Type: behavior.
- **Slice 2 — Reliable delivery:** Notification failures do not change edit responses; both providers, disabled mode, and deadlines work through the endpoint. Items: T02, C02. Type: behavior.
- **Review slice 1 — Self-edits:** Reuse the authenticated author without an additional lookup. Items: T03, C03. Type: behavior.
- **Review slice 2 — Author lookup deadline:** Bound the remaining lookup and preserve safe edit completion. Items: T04, C04. Type: behavior.

## Validation Notes

- Baseline: 79 focused lifecycle/endpoint tests passed.
- T01: 8 expected failures and 86 passes. Failures identify missing edit notices and the unmatched-update success path. Existing POST and unrelated-method checks remain green; the two obsolete successful-PUT no-send cases were removed.
- C01: All 162 lifecycle, endpoint, and existing MongoDB service tests passed. Edit notices require a matched comment and a text change; unchanged or rejected edits retain their existing responses. Notifications use the original author's user record, with an unavailable-author fallback.
- T02: 12 expected failures and 116 passes across lifecycle and endpoint tests. Missing behavior is safe handling of rejected/thrown sends and failed author lookups, plus edit-specific diagnostics for returned failures and provider timeouts. Both providers' successful edit paths and rejected-edit gates already pass. A concurrent same-text update is covered and sends no duplicate notice.
- C02: All 196 lifecycle, endpoint, and existing MongoDB service tests passed. Full `yarn ci:local` passed lint, formatting, type checks, both builds, and 963 tests (1 environment, 741 backend, 193 frontend unit, 28 component). Markdown formatting and diff checks passed. The existing worker-exit warning recurred and remains tracked in #257. Provider SDK boundaries are stubbed; no live email was sent.
- Final scope review: authorization, unchanged-text rejection, and existing successful response shapes are preserved. An update with no matched comment now takes the existing update-error path instead of reporting success; this is necessary to distinguish saved edits from failed writes before notification. Notification author lookup and delivery are guarded after persistence, including for administrator edits. Comment links, revision history, new validation limits, and provider/framework changes are excluded.
- T03: Two expected failures and 57 passes in the lifecycle suite. Both ordinary and administrator self-edits perform one unnecessary author lookup; message attribution remains covered by the existing matrix.
- C03: All 131 lifecycle/endpoint tests pass, including self-edit query avoidance and administrator edits retaining the original author. The previous soft-delete race regression remains green.
- T04: Two expected stalled-lookup failures and 62 passes in the lifecycle suite. A stalled read currently holds the saved edit response until its late resolution or rejection. Added cleanup checks for successful, missing, and rejected author reads; fake timers start only at the post-save query, with deferred work released even on failure.
- C04: All 204 focused lifecycle, endpoint, and existing MongoDB tests pass. Full `yarn ci:local` passed lint, formatting, type checks, both builds, and all 971 tests (1 environment, 749 backend, 193 frontend unit, 28 component). No worker-exit warning occurred in this run. Markdown formatting and diff checks passed. The one-second deadline bounds waiting for the remaining author query; it does not cancel the database operation. Late results are ignored and cannot send an email. No live email was sent.

The PR targets the existing integration branch and closes #248; merging remains a maintainer action.
