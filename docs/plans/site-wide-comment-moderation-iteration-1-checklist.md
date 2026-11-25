# Iteration 1 checklist — Automatic holds and moderator review

Status — Approved for implementation

Source plan: [Site-wide comment moderation, iteration one](site-wide-comment-moderation.md#iteration-1--automatic-holds-and-moderator-review), revision `d79bc608e3fada4b185474a134b108c446836d17`.

## Scope lock

- **In scope.** AC1–AC8 cover derived privileges, author-only editing, automatic link and optional term holds, moderator exemption, in-discussion approval and deletion, viewer-specific reads, authoritative API responses, existing email delivery, and private terms-file deployment. The [iteration-one validation strategy](site-wide-comment-moderation.md#validation-strategy) defines the required evidence.
- **Implementation prerequisite.** Land [#280 — Soft deletion for all comments](https://github.com/rendall/simple-comment/issues/280) on the implementation base before starting C06, C08, or any work that depends on retained deletion records. This checklist adds moderation-specific author, actor, and reason handling to those records. Target implementation PRs at `284-build-a-site-wide-comment-moderation-system` as specified in the source plan.
- **Out of scope.** Manual holds, role appointments and demotions, the legacy-admin upgrade utility, account-managed recipient addresses, configurable publication or notification policy, the site-wide moderation view, shared links and focused views, incremental or real-time synchronization, advanced obfuscation detection, hold identifiers, revision history, cross-document locking, and owner credential rotation.
- **Accepted behavior under concurrency.** A reply that passes the server's parent eligibility check may finish after the parent is held or deleted. An old approval can release a subsequent hold on identical text.
- **Engineering choices.** Resolve the approval endpoint and request schema, placeholder representation, matching details, and function packaging within the work items that use them. New module and test-file names below are proposed locations.

## Atomic checklist items

- [x] C01 `[backend]` Derive effective privilege and role predicates from stored privilege and the configured owner identity. Define named levels in `src/lib/simple-comment-types.ts`, derive the values in `src/lib/backend-utilities.ts`, and use them in `src/lib/MongodbService.ts` for existing authorization and safe user responses, including users embedded in `commentGET` and `topicGET`. Reject invalid present stored values. Treat missing privilege as 0 for non-owners and derive 3 for the configured owner. Preserve the existing distinction between public and admin-safe account data. Update existing test fixtures that require stored admin authority to use privilege 2.
  - Validated by T01 and T06.
  - Trace:
    - “A missing stored privilege defaults to 0.” (AC1 — Privileges and authorization)
    - “The API exposes the effective privilege and derived predicates” (Stored privilege and derived permissions)
    - “Reject invalid stored or requested privilege values” (Privilege foundation)

- [x] C02 `[backend]` Persist privilege 0 for new ordinary accounts in `MongodbService.userPOST` and privilege 2 for new owner accounts in `MongodbService.userGET`. Initialize a missing stored privilege to 2 during existing-owner initialization, preserving a value already present and deriving owner access independently of that write.
  - Depends on C01. Validated by T01.
  - Trace:
    - “Newly created owner accounts store 2. Newly created ordinary accounts store 0” (Privilege foundation)
    - “Initialize the existing owner's underlying privilege to 2 if missing” (Privilege foundation)

- [x] C03 `[account-api]` Make role fields read-only across the account API and its client. In `src/apiClient.ts`, have `updateUser` put the account ID in the route and serialize an explicit projection of writable update fields. At `src/functions/user.ts` and in `MongodbService.userPOST` and `userPUT`, reject writes to `isAdmin` and attempts to assign `privilege`. Update `getNewUserInfo` and `getUpdatedUserInfo` in `src/lib/backend-utilities.ts` so the boundary can detect those inputs before projection. Keep derived role fields on responses.
  - Validated by T01 and T06.
  - Trace:
    - “Reject attempts to write the legacy `isAdmin` field in account creation or update requests” (Privilege foundation)
    - “it is a derived, read-only response property” (Privilege foundation)
    - “without implementing any role appointment or demotion workflow” (Privilege foundation)

- [x] C04 `[backend]` Enforce the actor-and-target privilege checks in `MongodbService.userPUT` and `userDELETE`. Return `403` for forbidden cross-account actions, protect the configured owner using the target identity, and preserve ordinary self-service for permitted fields.
  - Depends on C01 and C03. Validated by T01.
  - Trace:
    - “requires both admin privileges and a strictly higher effective privilege than the target account” (Account administration authority)
    - “Reject unauthorized requests with HTTP 403 without modifying the target account.” (Account administration authority)
    - “Use the target account's ID to protect the owner's record.” (Owner permissions and role appointments)

- [x] C05 `[backend]` Restrict `MongodbService.commentPUT` to the original author at the server authorization check, including when the caller has privilege 1, 2, or 3.
  - Validated by T02 and T06.
  - Trace:
    - “Only authors can edit their comments.” (AC1 — Privileges and authorization)

- [x] C06 `[backend]` Enforce viewer-specific publication visibility in `MongodbService.commentGET` and `topicGET` for requested comments and nested replies. Extend `Comment` and `DeletedComment` in `src/lib/simple-comment-types.ts` for the chosen response representation. Treat a live comment with no `isApproved` as approved and give `dateDeleted` precedence. Return held text and reasons to the recognized author or a moderator. Keep unavailable ancestors as redacted placeholders where visible descendants need them, and apply the same viewer checks to private deletion reasons and metadata.
  - Depends on C01 and #280. Validated by T02 and T06.
  - Trace:
    - “Authors and moderators can see held content, its publication status and its hold reason.” (AC3 — Visibility)
    - “Visible descendants remain accessible beneath structural placeholders.” (AC3 — Visibility)
    - “Existing comments without an `isApproved` field are considered approved” (Remaining details)
    - “Do not expose internal author or actor identifiers in public tombstones.” (Comment publication states)

- [x] C07 `[backend]` Reject a new direct reply in `MongodbService.commentPOST` if its parent is held or deleted at the eligibility check. Keep eligible descendants replyable and preserve an in-flight reply that passed the check before the parent changed state.
  - Depends on C06. Validated by T02 and T03.
  - Trace:
    - “New direct replies to held or deleted comments are rejected when the server checks parent eligibility.” (AC3 — Visibility)
    - “an in-flight reply may complete” (Placeholders and continuity of discussion threads)

- [x] C08 `[backend]` Apply the moderation deletion contract in `MongodbService.commentDELETE`, `AbstractDbService.commentDELETE`, and `src/functions/comment.ts`. Preserve author deletion and require effective moderator privileges and a non-empty `deletedReason` for cross-author deletion. Use one atomic write conditional on the record still being undeleted. Remove the text, clear active hold metadata, record `dateDeleted`, the authenticated `deletedBy`, and `deletedReason` when applicable, and retain the original author identity internally. Preserve the metadata recorded by the first successful deletion on repeated or concurrent requests.
  - Depends on C01, C06, and #280. Validated by T02, T03, and T06.
  - Trace:
    - “Moderation actions require `isModerator`” (AC1 — Privileges and authorization)
    - “Deletion records `dateDeleted`, `deletedBy` and, for cross-author deletion, a mandatory `deletedReason`.” (AC5 — Deletion)
    - “The original author identity is retained internally.” (AC5 — Deletion)
    - “Deletion takes precedence over approval.” (Comment publication states)
    - “A deleted comment no longer has an active hold” (Reasons for holding comments)

- [x] C09 `[backend]` Add an authenticated approval operation at `src/functions/comment.ts` backed by `src/lib/MongodbService.ts` and its service contract in `src/lib/AbstractDbService.ts`. Authorize effective moderators, including self-approval, and atomically approve only a live held comment with matching reviewed text. Apply AC4 to a conditional miss and clear active hold metadata in the approval write. Preserve timestamps and side effects on successful no-ops.
  - Depends on C01 and C06. Validated by T03, T06, and T10.
  - Trace:
    - “Privileged authors bypass automatic moderation and may explicitly approve their own held comments.” (Initial publication policy)
    - “Approval is atomic. Successful approval clears active hold metadata.” (AC4 — Approval)
    - “A successful no-op approval does not modify timestamps or generate duplicate publication side effects.” (Approval idempotency and concurrent edits)

- [x] C10 `[backend]` Apply the initial link rule at `MongodbService.commentPOST` using a shared publication decision in `src/lib/comment-publication.ts`. Hold recognized links from non-moderator authors, including common schemeless forms. Persist the text, approval status, and applicable author-facing reason together before returning the authoritative `201` response. Preserve any applicable existing developer-provided filtering. Limit the moderator bypass to automatic publication rules and keep submission authorization, parent eligibility, duplicate checks, and the create-length limit in force for every role.
  - Depends on C01, C06, and C07. Validated by T06 and T10.
  - Trace:
    - “Detect common URL forms, including recognizable links without an explicit scheme” (Initial publication policy)
    - “Preserve applicable existing developer-provided filtering” (Initial publication policy)
    - “Preserve account and comment authorization boundaries” (Initial publication policy)
    - “the server saves it as held, with an author-facing reason, before any public read can expose the content” (Initial workflow)
    - “Successful creates return `201 Created`.” (AC6 — Comment creation and editing)

- [x] C11 `[backend]` Re-evaluate changed text in `MongodbService.commentPUT` using the same publication decision as creation. Keep the existing edit validation and author-only authorization in force for every role. Commit text and publication state together, prevent updates to deleted records, and clear active hold metadata when a qualifying edit releases an automatic hold. Return the saved comment with HTTP `200` through `src/functions/comment.ts` and update the response definition in `src/lib/messages.ts`.
  - Depends on C05, C06, and C10. Validated by T03, T06, and T10.
  - Trace:
    - “Only authors can edit their comments.” (AC1 — Privileges and authorization)
    - “A qualifying edit can release an automatic hold.” (AC2 — Automatic publication policy)
    - “A successful edit replaces the existing HTTP 204 response with HTTP 200 and the updated comment object” (Comment creation and edit response contract)

- [x] C12 `[backend]` Apply the optional private term rule to the shared publication decision in `src/lib/comment-publication.ts`, within the same moderator exemption as the link rule. Put file reading and validation in `src/lib/moderation-terms.ts` for reuse by the build. Use UTF-8, literal case-insensitive words or phrases, and skip blank and comment lines. At runtime, log a sanitized configuration error for an invalid or unreadable supplied file, disable the term rule, and continue evaluating links. Use an author-facing reason that does not reveal the match.
  - Depends on C10 and C11. Validated by T04 and T10.
  - Trace:
    - “Use UTF-8, one literal word or phrase per line, case-insensitive matching” (Optional private moderation terms file)
    - “log the configuration failure without exposing the terms, disable the affected term rule” (Optional private moderation terms file)
    - “Do not reveal the matched term or the contents of the list.” (Optional private moderation terms file)

- [x] C13 `[build]` Reject an invalid or unreadable supplied terms file in the existing build and CI validation paths. Reuse the parser from `src/lib/moderation-terms.ts`, wire the check through `package.json`, and keep `yarn build`, the Netlify build command in `netlify.toml`, and the PR and local CI paths aligned.
  - Depends on C12. Validated by T04.
  - Trace:
    - “validate it during CI/build, and fail if it is invalid or unreadable” (Optional private moderation terms file)

- [x] C14 `[deployment]` Make the optional list available to the comment function using the existing Netlify function build and packaging configuration in `netlify.toml` or `webpack.netlify.functions.cjs`, as appropriate. Add a `.gitignore` rule for the real file and keep it out of public assets and client bundles.
  - Depends on C12. Validated by T08.
  - Trace:
    - “Exclude the real file from Git and from public assets, client bundles, API responses and logs.” (Optional private moderation terms file)
    - “The deployment mechanism must make it available to the server/API functions only.” (Optional private moderation terms file)

- [x] C15 `[backend]` Add the hold indication, reason, and available comment identifiers to the existing post and edit emails in `MongodbService.commentPOST` and `commentPUT`. Use the existing provider and configured recipient list. Keep delivery after the successful write and preserve the current events and failure handling.
  - Depends on C10, C11, and C12. Validated by T05.
  - Trace:
    - “Preserve existing notifications for successful comment creation and changed text, using `SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL`.” (AC7 — Notifications)
    - “Notifications concerning held comments identify the hold and its reason.” (AC7 — Notifications)
    - “Notification failures do not invalidate successful writes.” (AC7 — Notifications)

- [x] C16 `[contract]` Update the `/user` operations and user schemas in `src/schema/simple-comment-openapi3.json` for derived privilege and role fields, and for rejection of legacy role writes.
  - Depends on C01 and C03. Validated by T06.
  - Trace:
    - “it is a derived, read-only response property” (Privilege foundation)
    - “updated OpenAPI contract” (Iteration 1 — In Scope)

- [x] C17 `[contract]` Update the `/comment` and `/topic` contracts in `src/schema/simple-comment-openapi3.json` to match the implemented review operation, redacted and private response variants, deletion reason input, and authoritative create and edit responses.
  - Depends on C06, C07, C08, C09, C10, and C11. Validated by T06.
  - Trace:
    - “updated OpenAPI contract” (Iteration 1 — In Scope)
    - “Both return the authoritative comment object regardless of publication status.” (AC6 — Comment creation and editing)
    - “Exact approval endpoint and request schema.” (Remaining details)

- [x] C18 `[frontend]` Use the saved comment returned by `src/apiClient.ts` `putComment` in `src/components/CommentEdit.svelte` and `src/lib/commentEdit.xstate.ts`. Pass it through `CommentDisplay.svelte`, `CommentList.svelte`, and `DiscussionDisplay.svelte` to replace the local record. Preserve the authoritative `201` payload already passed along by `CommentInput.svelte`.
  - Depends on C10 and C11. Validated by T07.
  - Trace:
    - “The widget uses the returned server representation” (Comment creation and edit response contract)

- [x] C19 `[frontend]` Render held comments, reasons, and unavailable ancestors in `src/components/CommentDisplay.svelte` and `CommentList.svelte`, using the server-provided state in `DiscussionDisplay.svelte`. Keep visible descendants in place and disable direct replies on held or deleted comments.
  - Depends on C06, C07, and C18. Validated by T07.
  - Trace:
    - “The widget displays the returned state and explains any hold to the author.” (AC6 — Comment creation and editing)
    - “show a placeholder at its original position in the discussion tree” (Placeholders and continuity of discussion threads)

- [x] C20 `[frontend]` Add the in-discussion approval control beside deletion in `src/components/CommentDisplay.svelte`, using the approval request in `src/apiClient.ts`. Reconcile the discussion through `DiscussionDisplay.svelte` after success. On `409`, tell the moderator to review the updated text before trying again.
  - Depends on C09 and C19. Validated by T07.
  - Trace:
    - “Add approval alongside the existing delete control on the comment itself.” (Initial workflow)
    - “they must review the updated comment before approving it” (Approval idempotency and concurrent edits)

- [x] C21 `[frontend]` Update the removal flow in `src/components/CommentDisplay.svelte`, `CommentList.svelte`, `DiscussionDisplay.svelte`, `src/lib/commentDelete.xstate.ts`, and `src/apiClient.ts` `deleteComment`. Use `isModerator` for cross-author removal, require a reason for that action, and render the resulting removal and any viewer-authorized reason using the server state.
  - Depends on C01, C08, and C19. Validated by T07.
  - Trace:
    - “including review, approval and cross-author deletion” (Privilege foundation)
    - “Deletion reasons are visible only to the original author and moderators.” (AC5 — Deletion)
    - “a non-empty explanation required when `deletedBy` differs from the original author's account ID” (Comment publication states)

- [x] C22 `[frontend]` Scope discussion data and pending requests to the active viewer in `src/components/SimpleComment.svelte` and `DiscussionDisplay.svelte`, including comment read and mutation results passed from child components. Discard private data on logout or account switch, ignore late responses from the previous identity, and load the view for the new identity.
  - Depends on C18, C19, C20, and C21. Validated by T07.
  - Trace:
    - “On logout or account switch, discard no-longer-authorized private content and ignore outstanding responses belonging to the previous identity.” (Comment creation and edit response contract)

- [x] C23 `[docs]` Document optional terms-file setup and verification in `README.md` and provide `moderation-terms.example.txt` with harmless fixture terms. Explain how to supply the real file during deployment, the expected outcomes for absent, invalid, and unreadable files, and how to verify function-only delivery.
  - Depends on C13 and C14. Validated by T09.
  - Trace:
    - “Provide a harmless example file” (Optional private moderation terms file)
    - “document how installation owners supply the actual file” (Optional private moderation terms file)

- [x] C24 `[docs]` Update the moderation, upgrade, and API guidance in `README.md`. Cover the in-discussion review and removal controls, moderator bypass, legacy non-owner admins losing privilege, rejected role writes, author-only edits, and the edit response change from `204` to `200`.
  - Depends on C16, C17, C20, and C21. Validated by T09.
  - Trace:
    - “Installation, upgrade and usage instructions” (Iteration 1 — In Scope)
    - “Document the legacy-admin compatibility change prominently in upgrade instructions.” (Privilege foundation)
    - “document this API contract change” (Comment creation and edit response contract)

- [ ] C25 `[docs]` Update `docs/NOTIFICATIONS.md` to describe hold information on successful creation and edit emails, the existing address list, and how moderators use the notification to locate the comment manually.
  - Depends on C15 and C20. Validated by T09.
  - Trace:
    - “Notifications concerning held comments identify the hold and its reason.” (AC7 — Notifications)
    - “Moderators may need to locate held comments manually.” (Accepted limitations)

## Validation items

- [x] T01 `[tests]` Unit-test privilege derivation in `src/tests/backend/user.privilege.test.ts` and verify storage and account authorization in `src/tests/backend/MongodbService.test.ts`. Cover levels 0–3, owner bootstrap and existing-owner initialization, missing and invalid stored values, legacy flags, rejected role writes, and the account matrix for self-service and attempts against protected targets. In `src/tests/frontend/apiClient.account-update.test.ts`, verify that an ordinary profile edit using account data with derived roles preserves the changes, sends only writable fields, and receives a successful response. Run `yarn test:backend` and `yarn test:frontend:unit`.
  - Depends on C01–C04.
  - Trace:
    - “Privilege derivation, filtering and publication decisions produce the specified results” (Iteration 1 — Validation Strategy)
    - “Test cross-account administration against the privilege matrix” (Validation Strategy — Account administration)
    - “ordinary authorized self-service actions remain distinct from cross-account administration” (Validation Strategy — Account administration)

- [x] T02 `[tests]` Verify comment access and deletion in `src/tests/backend/MongodbService.test.ts` and `src/tests/backend/comment.moderation.test.ts` using seeded held, approved, legacy, and deleted records. Check author-only edits, direct reply eligibility, cross-author deletion authorization at levels 0–3, required deletion reasons, and removal of held text and active hold metadata. Exercise direct and discussion reads with nested ancestors and independently visible descendants as an anonymous reader, unrelated account, author, recognized guest author, and moderator. Verify that public responses omit private content and reasons, authorized readers can see applicable reasons, and deleted text is unavailable to everyone. Run `yarn test:backend`.
  - Depends on C05–C08.
  - Trace:
    - “Authorization, approval, deletion, visibility and response contracts conform to acceptance criteria” (Iteration 1 — Validation Strategy)
    - “Verify that an authenticated returning guest can see their own held comments and reasons” (Validation Strategy — Comment visibility and discussion continuity)

- [ ] T03 `[tests]` Verify controlled interleavings in `src/tests/backend/comment.moderation.test.ts` against MongoDB. Cover every AC4 decision, including approval overlapping an edit or deletion, a successful no-op when the latest edit published the comment, held-text mismatch, intervening edits that restore the reviewed text, and repeated approval without duplicate side effects. Verify that repeated and concurrent deletes preserve the first successful deletion's timestamp, actor, and reason. Verify that an in-flight reply retains its place if an edit holds its parent or deletion follows its eligibility check, and a later direct reply is rejected. Run `yarn test:backend`.
  - Depends on C07–C11.
  - Trace:
    - “Approval cannot publish mismatched text or restore deleted comments” (Iteration 1 — Validation Strategy)
    - “records the authenticated deleting account ID and timestamp” (Validation Strategy — Comment lifecycle and moderation)
    - “Permit a reply already in flight after a successful eligibility check to finish” (Validation Strategy — Comment visibility and discussion continuity)

- [ ] T04 `[tests]` Verify terms parsing and file-failure behavior in `src/tests/backend/moderation-terms.test.ts` and `src/tests/environment/moderation-terms.environment.test.ts`. Cover valid literal terms, absent and empty files, comments and blank lines, invalid UTF-8 or unreadable input, failed build and CI validation with invalid supplied input, and runtime fail-open with links still held and terms absent from errors. Use harmless fixtures and run `yarn test:backend`, `yarn test:environment`, and `yarn build`.
  - Depends on C12 and C13.
  - Trace:
    - “Test absent, valid, empty and invalid moderation terms files, CI/build failure for an invalid supplied file, runtime fail-open behavior with independent link filtering intact” (Validation Strategy — Publication and editing policies)

- [ ] T05 `[tests]` Verify notification compatibility in `src/tests/backend/MongodbService.notifications.test.ts` and `src/tests/backend/comment.notifications.test.ts`. Confirm exactly the configured recipients and the existing creation and changed-text events for held and published results, preservation of the prior message information, added hold details, and successful writes despite delivery failures. Confirm failed or unauthorized writes, unchanged edits, approvals, and deletions send nothing. Run `yarn test:backend`.
  - Depends on C08, C09, and C15.
  - Trace:
    - “Existing recipient and event behavior is preserved, with correct hold information” (Iteration 1 — Validation Strategy)
    - “Failed submissions, unchanged edits, approvals and deletions generate no new notifications.” (AC7 — Notifications)

- [ ] T06 `[tests]` Verify handler-to-schema parity in `src/tests/backend/api.test.ts` and `src/tests/backend/comment.moderation.test.ts` for the shipped account, comment, and discussion routes. Exercise published and held create/edit responses, rejected `isAdmin` writes, approval including `409` and deleted targets, required cross-author delete reasons, and public versus authorized representations. Run `yarn test:backend`.
  - Depends on C16 and C17.
  - Trace:
    - “Authorization, approval, deletion, visibility and response contracts conform to acceptance criteria” (Iteration 1 — Validation Strategy)
    - “Verify HTTP 201 for both published and held creates and HTTP 200 for both published and held edits” (Validation Strategy — Publication and editing policies)

- [ ] T07 `[tests]` Verify moderation in `src/tests/frontend/components/DiscussionDisplay.moderation.test.ts` and the existing `SimpleComment.auth-cleanup.test.ts`. Cover saved create and edit state, held reasons, effective moderator controls, stale approvals, removal reasons, redacted ancestors with visible replies, and correct visibility after a refresh. Verify logout and account switches discard previously fetched private content and ignore late reads or mutation results from the old identity. Run `yarn test:frontend`.
  - Depends on C18–C22.
  - Trace:
    - “Review controls, hold messages, edit responses and authentication changes behave correctly” (Iteration 1 — Validation Strategy)
    - “ignore outstanding responses belonging to the previous identity” (Comment creation and edit response contract)

- [ ] T08 `[deployment]` Record a Netlify deployment smoke test with a harmless fixture supplied through the chosen file path. Verify a submitted matching comment is held by the deployed function and a nonmatching comment publishes. Check that the private fixture is absent from the public deployment assets and client bundles.
  - Depends on C12–C14.
  - Trace:
    - “The server loads and applies harmless fixture terms without exposing the file publicly” (Iteration 1 — Validation Strategy)

- [ ] T09 `[validation]` Review `README.md`, `docs/NOTIFICATIONS.md`, and `moderation-terms.example.txt` against the behavior verified by T01–T08 and T10, and record the result.
  - Depends on C23–C25, T01–T08, and T10.
  - Trace:
    - “Installation owners can configure the feature and understand intentional compatibility changes” (Iteration 1 — Validation Strategy)

- [ ] T10 `[tests]` Verify automatic publication and moderator review in `src/tests/backend/comment.moderation.test.ts`. Exercise link and term holds, mixed rule matches, moderator bypass on create and edit, automatic hold release and reason clearing, and explicit moderator approval and self-approval. Verify moderator bypass still rejects an overlength create, a reply to an ineligible parent, and a cross-author edit. Run `yarn test:backend`.
  - Depends on C09–C12.
  - Trace:
    - “A qualifying edit can release an automatic hold.” (AC2 — Automatic publication policy)
    - “Privileged authors bypass automatic moderation and may explicitly approve their own held comments.” (Initial publication policy)
    - “Preserve account and comment authorization boundaries” (Initial publication policy)

Run `yarn run ci:local` for the repository's PR-parity gate and record its outcome alongside T01–T10. See [CI parity norms](../norms/ci-parity.md).

## Behavior Slices

| Slice | Goal | Items | Type |
| --- | --- | --- | --- |
| 1. Privilege foundation | Derive authority consistently and protect account mutations. | C01, C02, C03, C04, C16, T01 | behavior |
| 2. Comment access | Protect unpublished and deleted content, preserve visible replies, and limit editing to authors. | C05, C06, C07, C08, T02 | behavior |
| 3. Publication and review | Apply automatic holds and explicit approval through the HTTP API, preserving existing email delivery. | C09, C10, C11, C12, C15, C17, T03, T05, T06, T10 | behavior |
| 4. Private deployment | Validate, package, and verify the optional server-only file on Netlify. | C13, C14, T04, T08 | behavior |
| 5. Discussion widget | Show authoritative comment state and support authorized review and removal in place. | C18, C19, C20, C21, C22, T07 | behavior |
| 6. Release guidance | Document installation and upgrade behavior, and record the documentation review. | C23, C24, C25, T09 | mechanical |

## Conformance QC

- **Missing from plan** — None. The scope lock and AC1–AC8 govern the draft.
- **Extra beyond plan** — None. #280 supplies soft deletion and the separate site-wide moderation view stays deferred.
- **Atomicity fixes needed** — None identified. Items that span the service, its handler, or its widget caller keep the changes needed for that action together.
- **Validation mapping gaps** — None. Each implementation item names an evidence item, and the slices assign every item once.
- **Pass/Fail: checklist achieves plan goals** — **Pass**.
