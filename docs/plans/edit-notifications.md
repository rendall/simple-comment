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

## Out of Scope

Authorization changes, new edit length limits, revision history, before/after comparisons, comment links, a new notification framework, retries, provider changes, and deployment verification. Links remain in #240 and deployment verification remains in #249.

## Acceptance Criteria

- An authorized saved text change sends one edit notice containing the full updated text and the original comment author's name/email when available.
- Comments and replies are supported. Multiline and markup-like text remain literal plain text.
- Unchanged, unauthenticated, unauthorized, missing/deleted, and failed or unmatched updates send nothing.
- The request awaits delivery completion or the provider deadline, retaining its existing successful update response when notification preparation or delivery fails.
- Returned failures, promise rejections, synchronous throws, and timeouts cannot leak raw provider details into logs or HTTP responses.
- Disabled notifications leave editing working without sends or extra author lookups for notification preparation.

## Validation Strategy

Use real MongoDB persistence with an injected notification stub for lifecycle and content tests. Inspect stored state during the send. Cover no-send gates and unsuccessful/unmatched database results. Preserve existing POST tests and API response conventions. Use real endpoint/resolver/provider adapters with SDK boundaries stubbed for both providers and disabled mode. Advance fake timers only after persistence and SDK invocation; test deadline behavior without sleeping for its production duration. Before each implementation commit, run its focused tests; finish with `yarn ci:local`, Markdown formatting, and diff checks. No live email sends.

## Checklist

Source plan: this document's In Scope and Validation Strategy; source requirement: [#248](https://github.com/rendall/simple-comment/issues/248). The maintainer explicitly authorized tests → commit/push → implementation → commit/push for each slice, then an integration-base PR and completion beep.

- [x] T01 Add slice 1 regression tests and remove the obsolete successful-PUT no-send expectation; record the expected failures, commit, and push.
  - Trace: “Add edit notices after successful persistence” and “Retire the blanket PUT-does-not-notify assertion.” (In Scope, Slice 1)
- [ ] C01 Implement saved-edit notices and author attribution; make T01 green, commit, and push.
  - Depends on: T01.
  - Trace: “the full updated plain text and the comment author's details” (In Scope, Slice 1); validated by T01 and existing POST/endpoint suites.
- [ ] T02 Add failure-isolation, endpoint, disabled-mode, and timeout coverage; record expected failures, commit, and push.
  - Depends on: C01.
  - Trace: “Exercise the real endpoint with Resend, SendGrid, and notifications disabled, including provider timeouts and rejected edits.” (In Scope, Slice 2)
- [ ] C02 Isolate notification failures and update the guide; pass focused tests and local CI, commit, and push.
  - Depends on: T02.
  - Trace: “Isolate notification preparation and delivery failures from successful edits” and “Update the notification guide.” (In Scope, Slice 2); validated by T02 and Validation Strategy.

## Behavior Slices

- **Slice 1 — Saved edits:** One edit notice with correct content and authorship, only after a successful changed-text update. Items: T01, C01. Type: behavior.
- **Slice 2 — Reliable delivery:** Notification failures do not change edit responses; both providers, disabled mode, and deadlines work through the endpoint. Items: T02, C02. Type: behavior.

## Validation Notes

- Baseline: 79 focused lifecycle/endpoint tests passed.
- T01: 8 expected failures and 86 passes. Failures identify missing edit notices and the unmatched-update success path. Existing POST and unrelated-method checks remain green; the two obsolete successful-PUT no-send cases were removed.

The PR targets the existing integration branch and closes #248; merging remains a maintainer action.
