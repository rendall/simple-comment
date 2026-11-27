# Iteration 2 checklist — Manually holding published comments

Status — Approved for implementation

Source plan: [Second iteration — manually holding published comments](site-wide-comment-moderation.md#second-iteration--manually-holding-published-comments).

## Scope lock

- Implement MH1–MH5 for published comments, including legacy live comments without a stored publication flag. Use the existing discussion, moderation privileges, and reviewed-text approval flow.
- Defer conversion of an automatic hold, changes to an active manual hold's reason, role appointments, comment history, a site-wide moderation view, settings, new notification events, and real-time or incremental refresh.
- Land the prerequisite PRs before starting feature work. Keep #292 in its own issue and PR. Preserve the direct-deletion contract on the implementation base.
- The hosted Netlify terms-file smoke test and its documentation sign-off stay on the iteration-one checklist.

## Prerequisite issues

Complete C01 and C02 before any manual-hold implementation. Use separate PRs for prerequisite fixes and target feature implementation at `284-build-a-site-wide-comment-moderation-system`.

- [x] C01 `[prerequisite]` Land [PR #289 — Iteration one](https://github.com/rendall/simple-comment/pull/289) on the moderation implementation base. Verify the merged base includes [#280 soft deletion](https://github.com/rendall/simple-comment/issues/280) and the iteration-one moderation foundation. Record the merge and the base revision in the checklist or PR validation notes.
  - Verified that the implementation base at `5e5975a` contains the #289 merge (`3b4261f`) and the #280 soft-deletion merge (`6ad9784`).
  - Trace:
    - “Iteration two builds on the shipped moderator permissions, viewer-specific reads, approval, deletion, and discussion controls.” (Iteration-two prerequisites)

- [x] C02 `[prerequisite]` Land the [#291 account-ID reservation fix](https://github.com/rendall/simple-comment/issues/291) on the moderation implementation base. Verify reservation for new account deletions and continued moderator access to held comments from deleted accounts.
  - Depends on C01 for final verification on the base.
  - [PR #295](https://github.com/rendall/simple-comment/pull/295) landed as `5e5975a` on the implementation base. Its regression tests verify rejection of reserved-ID registration, denial of author access to reserved accounts, and continued moderator review. The PR reports 1,051 tests passed through `yarn run ci:local`.
  - Legacy backfill and historical authorship are deferred, as are standalone session verification (#293) and database-wide uniqueness (#294).
  - Trace:
    - “Reserve IDs for accounts deleted after the fix is deployed.” (Iteration-two prerequisites)
    - “Reserved IDs are unavailable to registration, and reservation records are inactive for moderation reads and writes.” (Iteration-two prerequisites)

## Atomic implementation items

- [x] C03 `[backend]` Add a manual-hold operation to `src/lib/AbstractDbService.ts` and `src/lib/MongodbService.ts`. Resolve the authenticated actor's effective moderator privilege and require a non-blank reason. Use a single conditional write against a live, published target to set `isApproved`, `heldBy`, and `heldReason`. Include legacy published records. Leave already-held or deleted records untouched. Update the test service in `src/tests/backend/api.test.ts` for the new abstract method.
  - Depends on C01 and C02. Validated by T01 and T03.
  - Trace:
    - “A live legacy comment without stored `isApproved` counts as published.” (MH1 — Place a hold)
    - “In one conditional write, set `isApproved` to false and record `heldBy` and `heldReason`.” (MH1 — Place a hold)

- [x] C04 `[backend]` Project manual holds through `MongodbService.commentGET`, `topicGET`, and their shared visibility helpers. Keep a redacted manual-hold leaf in the discussion and preserve visible descendants on direct and discussion reads. Use a safe representation in `src/lib/simple-comment-types.ts` that lets the widget identify a manual hold without receiving the actor ID. Continue to require an active account for author-only access under C02 and preserve the base's automatic-hold and deletion behavior.
  - Depends on C03. Validated by T02.
  - Trace:
    - “Other readers see a redacted **Hidden pending moderation** placeholder in the discussion, including for a comment with no replies.” (MH2 — Protect private content)
    - “Direct reads apply the same visibility restrictions and retain available thread structure.” (MH2 — Protect private content)
    - “The public placeholder omits the text, private reason, and internal moderation actor ID.” (MH2 — Protect private content)

- [x] C05 `[backend]` Route the manual-hold request in `src/functions/comment.ts` through the existing authentication and service response handling. Pass the target and reason to the operation from C03, and keep approval and deletion routes available.
  - Depends on C03. Validated by T01.
  - Trace:
    - “A moderator can hide a published comment by supplying a non-blank reason in the existing discussion.” (MH1 — Place a hold)
    - “Use the server's effective `isModerator` predicate.” (MH1 — Place a hold)

- [x] C06 `[contract]` Document the hold request, success and error responses, and viewer-specific read representations in `src/schema/simple-comment-openapi3.json`. Update the route map in `src/tests/backend/api.test.ts` to match the shipped routes and schema.
  - Depends on C04 and C05. Validated by T01 and T02.
  - Trace:
    - “Shipped responses match OpenAPI.” (Iteration two — Validation Strategy)
    - “The exact hold endpoint, response statuses, and placeholder fields are engineering details within these acceptance criteria.” (Iteration two — Validation Strategy)

- [x] C07 `[backend]` Preserve an active manual hold in `MongodbService.commentPUT` using the hold state at the atomic edit write. Keep the actor and reason when a manual hold applies. Apply normal automatic rules whenever the write sees no manual hold, including when approval releases the hold during the edit. Return the saved viewer-appropriate representation and base the existing edit notification on the effective saved publication state.
  - Depends on C03 and C04. Validated by T03 and T04.
  - Trace:
    - “An edit that races with a manual hold must preserve the hold if it is active when the edit writes.” (MH4 — Edit, approve, and delete)
    - “A successful edit of manually held text identifies the active hold in its existing edit email.” (MH5 — Preserve notifications)

- [x] C08 `[frontend]` Add the manual-hold request to `src/apiClient.ts` using the shipped route and existing credential and response handling.
  - Depends on C05 and C06. Validated by T05.
  - Trace:
    - “A moderator can hide a published comment by supplying a non-blank reason in the existing discussion.” (MH1 — Place a hold)

- [x] C09 `[frontend]` Render manual holds in `src/components/DiscussionDisplay.svelte` and `CommentDisplay.svelte`. Keep manually hidden leaves and visible replies in the rendered tree. Show the private reason from an authorized server response and the generic label for public placeholders. Preserve the safe placeholder when the viewer changes and remove private details.
  - Depends on C04. Validated by T05.
  - Trace:
    - “Other readers see a redacted **Hidden pending moderation** placeholder in the discussion, including for a comment with no replies.” (MH2 — Protect private content)
    - “The widget discards private details on authentication changes.” (MH2 — Protect private content)

- [x] C10 `[frontend]` Add **Hide** to `src/components/CommentDisplay.svelte` for moderators viewing published comments. Require a non-blank reason, submit through C08, surface failures, and refresh the discussion on success under the current viewer. Reuse the existing approval action for republishing and discard results or private action state when authentication changes.
  - Depends on C08 and C09. Validated by T05.
  - Trace:
    - “A moderator can open a published comment's action menu, hide the comment, and explain why.” (Iteration two — Plain-Language Intent)
    - “The comment becomes public again when a moderator approves the current text.” (Iteration two — Plain-Language Intent)
    - “Use subsequent fetches or refreshes to reflect changes made by other viewers.” (Iteration two — Validation Strategy)

- [ ] C11 `[docs]` Update `docs/MODERATION.md` with the hide, review, and republish workflow. Describe who sees the private reason, how replies behave, and how the author can revise held text.
  - Depends on C10. Validated by T06.
  - Trace:
    - “The moderation guide matches the verified hide and approval workflow.” (Iteration two — Validation Strategy)

## Validation items

- [x] T01 `[tests]` Verify the hold write and shipped API contract in `src/tests/backend/comment.moderation.test.ts` and `src/tests/backend/api.test.ts`. Cover effective moderator levels 1–3, guests and ordinary accounts, missing authentication, non-blank reasons, published and legacy targets, both kinds of held targets, deleted and missing targets, and repeated hold requests. Check that rejected or repeated requests preserve the prior record.
  - Depends on C03, C05, and C06.
  - Verify that a level-one moderator can hide an owner-authored published comment.
  - Trace:
    - “Use the server's effective `isModerator` predicate.” (MH1 — Place a hold)
    - “Unauthorized requests, blank reasons, and requests targeting a held or deleted comment leave the record unchanged.” (MH1 — Place a hold)
    - “A repeated hold on an already held target does not replace the original reason or actor.” (Iteration two — Validation Strategy)

- [x] T02 `[tests]` Verify direct and discussion reads and reply eligibility in `src/tests/backend/comment.moderation.test.ts`. Cover manually hidden leaves and parents, visible descendants, recognized guest authors, unrelated readers, moderators, and redaction of text, reason, and actor ID. Check that unconnected automatic holds and the base's deleted-comment contract retain their existing visibility. Verify that a new direct reply to a held comment fails while a reply to an eligible descendant succeeds, and that ordinary reply rules resume after approval.
  - Depends on C04 and C06.
  - For an unrelated reader, verify that a manually hidden leaf keeps its automatically held ancestor visible as a structural placeholder. Check both direct and discussion reads for the redacted pair.
  - Trace:
    - “The original author, including a recognized returning guest, and moderators see the held text and reason.” (MH2 — Protect private content)
    - “Direct reads apply the same visibility restrictions and retain available thread structure.” (MH2 — Protect private content)
    - “Existing descendants remain independently visible and eligible for replies under their own state.” (MH3 — Preserve the thread)

- [x] T03 `[tests]` Verify persistence and controlled MongoDB interleavings in `src/tests/backend/comment.moderation.test.ts`. Cover edits by ordinary and moderator authors, matching and stale approval of edited text, the accepted identical-text approval retry, and an in-flight reply that passed the server check before the hold. Check resulting text, visibility, and hold metadata.
  - Depends on C03 and C07.
  - Place a hold through C03 and verify that the existing `commentAPPROVE` and `commentDELETE` writes remove both `heldBy` and `heldReason` from storage when they succeed. Race hold or approval with deletion and verify that later hold, edit, and approval requests cannot restore the deleted comment or its hold metadata.
  - Pause an edit before its write and place a manual hold. Verify that the edit preserves the held state, actor, and reason. Repeat with an existing manual hold and approve it before the edit writes. Verify that new text passing the automatic rules publishes and new text matching an automatic rule receives the policy's hold reason. In both cases, verify that the former manual actor and reason stay cleared.
  - Race two moderators placing holds with different reasons. Verify that only one request places a hold and that the stored actor and reason both come from the winning request.
  - Verify that a moderator author's own edit preserves the manual hold until they explicitly approve the current text.
  - Trace:
    - “A reply that passed the check may finish after the hold.” (MH3 — Preserve the thread)
    - “An edit that races with a manual hold must preserve the hold if it is active when the edit writes.” (MH4 — Edit, approve, and delete)
    - “Reuse the atomic reviewed-text approval rule and clear active hold metadata in the successful approval write.” (MH4 — Edit, approve, and delete)
    - “Deletion stays terminal and clears active hold metadata.” (MH4 — Edit, approve, and delete)
    - “Controlled MongoDB interleavings preserve manual holds through author edits, apply approval only to current reviewed text, and keep deletion terminal.” (Iteration two — Validation Strategy)

- [x] T04 `[tests]` Verify notifications in `src/tests/backend/MongodbService.notifications.test.ts`. Check that the hold action sends no email and that a changed-text edit of a manually held comment retains the configured recipients and describes the active hold in the existing notice. Verify ordinary creation and edit behavior through the existing tests.
  - Depends on C03 and C07.
  - Trace:
    - “Keep the existing creation and changed-text emails and recipients.” (MH5 — Preserve notifications)
    - “Applying a manual hold creates no email event.” (MH5 — Preserve notifications)

- [ ] T05 `[tests]` Verify the widget flow in `src/tests/frontend/components/DiscussionDisplay.moderation.test.ts`. Cover moderator-only **Hide** on published comments, reason entry, the resulting server state after refresh, approval using the current text, and manual-hold leaves and descendants.
  - Depends on C08, C09, and C10.
  - Render a manually hidden leaf beneath an automatically held ancestor for an unrelated reader. Verify that both redacted placeholders survive recursive pruning and retain their nesting.
  - Switch directly from a moderator to an unrelated signed-in ordinary user. Cover an editor open on the moderator's own held comment and a Hide dialog with a reason draft. Verify that the private text, reasons, and local form state are cleared and that late reads or hold results from the previous viewer cannot restore them.
  - Trace:
    - “A moderator can hide and republish a comment.” (Iteration two — Validation Strategy)
    - “Authentication changes discard the previous viewer's private text and reasons.” (Iteration two — Validation Strategy)

- [ ] T06 `[validation]` Check `docs/MODERATION.md` against the verified widget and API workflow. Run `yarn run ci:local` and record the result with T01–T05 in the PR validation notes.
  - Depends on C11 and T01–T05.
  - Trace:
    - “The moderation guide matches the verified hide and approval workflow.” (Iteration two — Validation Strategy)
    - “The repository's local CI parity gate passes.” (Iteration two — Validation Strategy)

## Behavior Slices

| Slice | Goal | Items | Type |
| --- | --- | --- | --- |
| 1. Prerequisites | Establish the iteration-one base and protect original-author access. | C01, C02 | mechanical |
| 2. Hold API and reads | Hide eligible comments atomically and expose the right representation to each viewer. | C03, C04, C05, C06, T01, T02 | behavior |
| 3. Hold lifecycle | Preserve manual holds across edits, review, deletion, and notifications. | C07, T03, T04 | behavior |
| 4. Discussion widget | Let moderators hide and republish comments in the discussion. | C08, C09, C10, T05 | behavior |
| 5. Release verification | Document the workflow and pass the local CI gate. | C11, T06 | mechanical |

## Conformance QC

- **Missing from plan** — None. C01 and C02 cover the prerequisites. C03–C11 and T01–T06 cover MH1–MH5, including verification of the existing approval and deletion cleanup in T03.
- **Extra beyond plan** — None. Automatic-to-manual conversion, #292, and hosted iteration-one validation retain their recorded scope.
- **Atomicity fixes needed** — None. Each prerequisite item records its own merged evidence. Each feature item covers one behavior or contract change.
- **Validation mapping gaps** — None. T01–T03 and T05 cover cross-privilege moderation, nested placeholders, concurrent writes, and direct account switches. Each item belongs to one behavior slice.
- **Pass/Fail: checklist achieves plan goals** — **Pass**.
