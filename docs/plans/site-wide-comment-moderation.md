# Site-wide comment moderation

Status — Draft for discussion

Parent issue — [#284](https://github.com/rendall/simple-comment/issues/284)

## Goal

Build a site-wide moderation system so an installation owner can appoint moderators and those moderators can manage comments across all discussions.

## Plain-Language Intent

The configured site owner controls the entire Simple Comment installation and all its discussions. The owner can appoint admins and revoke admin or moderator access. The owner and admins can appoint and demote moderators. Nobody can delete the owner's account or take away its admin access through the API. Moderators can see comments from across the site in one place, review comments before they appear publicly, and act on comments that are already public.

### Intended role hierarchy

The full moderation system has three privileged roles. Each role inherits the permissions of the roles below it. This describes the intended system across releases.

- **Owner** — The site owner is the account configured through deployment environment variables and has all admin and moderator permissions. The API protects the owner account from deletion and demotion.
- **Admin** — Admins can administer accounts below their own privilege level and have all moderator permissions. Only the owner can administer another admin's account.
- **Moderator** — Moderators can review, hide, or delete comments. Moderators can edit their own comments as authors. Moderators cannot edit user account details.

Only the owner can appoint admins or demote admins. The owner and admins can appoint and demote moderators. Moderators cannot appoint, create, or demote other moderators.

### Stored privilege and derived permissions

Store a single integer `privilege` on each user record instead of independent `isAdmin` and `isModerator` flags. Roles form a strict, cumulative hierarchy. Each account has one role at a time, and every higher role inherits the privileges of the lower roles.

| Role | Effective privilege | `isModerator` | `isAdmin` | `isOwner` |
| --- | ---: | --- | --- | --- |
| Regular user | 0 | false | false | false |
| Moderator | 1 | true | false | false |
| Admin | 2 | true | true | false |
| Owner | 3 | true | true | true |

Use named constants rather than magic numbers throughout the codebase. For example, a TypeScript enum can express the hierarchy:

```typescript
enum Privilege {
  User = 0,
  Moderator = 1,
  Admin = 2,
  Owner = 3
}
```

**Stored versus effective privilege.** Only values 0–2 are valid stored privileges. Level 3 is derived exclusively on the server from the authenticated account's configured owner identity; it is never persisted or assignable through the API. When the server creates a new user account for the configured owner (whether on first owner login or during owner initialization), initialize its stored privilege to 2 (Admin), not 0 or 3. The account has effective privilege 3 while it is the configured owner. If deployment configuration later transfers ownership away from that account, its stored privilege remains 2 by default and it becomes an admin. Any subsequent demotion must follow the ordinary role-management rules. Resolve the effective privilege for each request using the authenticated account's current role:

```typescript
const privilege = isConfiguredOwner(user)
  ? Privilege.Owner
  : user.privilege;
```

The API exposes the effective privilege and derived predicates, including `isModerator`, `isAdmin`, and `isOwner`. These remain useful to the frontend and preserve compatibility with consumers of the existing `isAdmin` response field, but they are not independently stored or writable sources of authority.

```typescript
const isModerator = privilege >= Privilege.Moderator;
const isAdmin = privilege >= Privilege.Admin;
const isOwner = privilege === Privilege.Owner;
```

The server may also expose action-specific permission predicates, such as `canModerateComments` and `canAppointModerators`. It must enforce all permissions on each request; frontend predicates are not authorization.

**Promotion and demotion.** A role change explicitly assigns the destination privilege. For example, promoting a moderator (1) to admin (2) and subsequently demoting that admin to moderator (1) requires no remembered flags or previous-role history. Demotion to regular user (0) instead removes both admin and moderator privileges. The intended destination role determines the access retained.

**Privilege versus authority.** Checking whether someone has a role's privileges is a numerical comparison, but authorizing a role change also requires checking the caller, the target's current effective privilege, and the requested destination privilege. Only the owner can grant or revoke admin access. Admins can promote regular users to moderators and demote moderators to regular users, but cannot promote anyone to admin or demote an admin. No application role change can grant or revoke ownership. Validate role assignments on the server and reject invalid stored values, including level 3.

#### Account administration authority

Administrative authority over another user's account requires both admin privileges and a strictly higher effective privilege than the target account. An admin can administer regular user and moderator accounts, but cannot delete, change the password of, or modify any account details of another admin or the owner. Only the owner can administer an admin account.

| Actor | Regular user account | Moderator account | Admin account | Owner account |
| --- | --- | --- | --- | --- |
| Regular user | No | No | No | No |
| Moderator | No | No | No | No |
| Admin | Yes | Yes | No | No |
| Owner | Yes | Yes | Yes | No |

This table covers administrative actions on **other users' accounts**, not ordinary self-service profile or password changes. The owner's special account protections and the separate rules for assigning roles still apply. In particular, authority to administer a lower-privilege account does not authorize granting it a privilege equal to or higher than the actor's own.

For cross-account administration, the general authorization condition is:

```typescript
const canAdministerTarget =
  actorPrivilege >= Privilege.Admin &&
  actorPrivilege > targetPrivilege;
```

Use server-derived effective privileges for both actor and target. Apply the restriction to every administrative account mutation, including deletion, credentials, identity and profile fields, regardless of which API endpoint is used. Reject unauthorized requests with HTTP 403 without modifying the target account. The frontend must reflect the same restrictions. This is an account administration rule, not a restriction on moderation of comments authored by privileged users.

#### Migration

Migrate existing non-owner accounts with `isAdmin: true` to privilege 2; ordinary accounts default to privilege 0. For the existing configured owner, initialize a missing stored privilege to 2 as the default underlying role. Preserve any already valid stored privilege when rerunning the migration. The configured owner's effective privilege is always 3, independent of the stored value or legacy admin flag. Retire the legacy persisted flags once existing records and all read/write paths have been migrated; retain the derived API predicates. Ensure existing installations preserve their legitimate admin access throughout the migration and that legacy role-update inputs cannot bypass the new authorization rules.

#### Rationale

- A single source of truth eliminates overlapping flags and ambiguous combinations.
- Promotion and demotion assign one explicit value rather than manipulating independent flags.
- Numerical comparisons express the intended inheritance naturally.
- Derived predicates keep the existing frontend/API vocabulary.
- Four effective levels simplify reasoning and testing.

Numeric roles can become unsuitable when permissions are independent or orthogonal. That is not the intended role model here: the hierarchy is deliberate. Configurable policies (such as admin editing of other users' comments) remain separate from the role itself.

**Store the role; derive the permissions.**

## Current behavior

The environment-configured Simple Comment Moderator account is created with `isAdmin: true`. The user-delete API already blocks deletion when the target is that account. The user-update API checks the caller's ID when applying its special protection, which lets another admin clear the configured account's stored admin flag. Comment actions such as deleting someone else's comment rely on the stored flag.

See [account creation](../../src/lib/MongodbService.ts#L349), [user updates](../../src/lib/MongodbService.ts#L460), [user deletion](../../src/lib/MongodbService.ts#L532), and [comment deletion](../../src/lib/MongodbService.ts#L1039).

## In Scope

### Owner permissions and role appointments

The first implementation sub-issue under #284 ([#285](https://github.com/rendall/simple-comment/issues/285)) covers admin and moderator appointments and demotions through a shared role-management interface. The owner can appoint and demote admins and moderators; admins can appoint and demote moderators only. The server authorizes and persists each change using the same privilege model. This capability can proceed independently of the broader comment review and publication workflows.

Appointment immediately grants the moderation capabilities already implemented for the assigned role, including authorized deletion of other users' comments. As the broader review system is implemented, moderators also gain the ability to approve held comments, withdraw approval (hold or hide comments), and delete held or published comments, subject to applicable policies. Revocation removes the capabilities associated with the lost privilege on subsequent requests. The role-appointment sub-issue need not implement all future comment review workflows.

There is one owner for the entire installation. Deployment environment variables determine the owner's identity and credentials; the server derives effective privilege 3 and `isOwner` from the authenticated account and its configured identity. Ownership cannot be granted or transferred through the application. See [Owner configuration and ownership changes](#owner-configuration-and-ownership-changes) below for credential recovery, ownership transfers and change detection.

Use the target account's ID to protect the owner's record. Reject any attempt to delete or demote the owner with HTTP 403, regardless of who makes the request. Derive the owner's effective privilege from ownership so neither a lower stored privilege nor a legacy `isAdmin: false` can lock the owner out.

### Role management dashboard

Add an **Administration** tab alongside the existing **Discussion** view in the comment widget. The discussion tree remains the default. The tab opens the dashboard in the widget under a **Site administration** heading so it is clear that the roster and role changes apply across the installation. Other widget views can be designed later.

The owner, admins, and moderators can open the tab and see the site owner, current admins, and current moderators, with each account listed once under its highest role. Moderators can view the roster. The owner and admins also see the role-management actions their permissions allow.

If the widget becomes too cramped for future administration workflows, a dedicated route can be considered with the widget as an entry point. A reserved discussion topic is outside this design.

The owner and admins can search for existing accounts with a searchable combobox that filters as they type and shows usernames alongside display names. Selecting an account fills the selection. An explicit **Appoint** action applies the change immediately. Admins can appoint moderators, and the owner can appoint either admins or moderators through the same interface. Available destination roles depend on the actor's authority and the target's current role.

Show demotion on the roster only where the viewer has authority over the target role. For admin demotion, the owner can choose moderator or regular user as the destination role. Moderator demotion assigns regular user. Confirm the action with the person’s name and the access they will lose. Enforce the same permissions for direct API requests.

Treat successful admin and moderator appointments and demotions as administration actions. Notify all current moderators, all current admins, the site owner, and the affected person, including someone just demoted. Send one notice per person identifying who made the change, whose access changed, and which access was granted or revoked.

### Administration notifications

Send administration notifications by email through the existing notification service. Persist a successful administration action before attempting notification delivery. Email delivery is best-effort: disabled notifications, provider errors, timeouts or partial delivery failures must not roll back the committed action or cause the API to report the action itself as failed. Attempt delivery to the intended recipients independently, and record delivery failures in the server logs without exposing sensitive information. Rejected or failed administration actions do not generate success notifications. Apply the same principle to successful ownership changes.

Consider a persistent **Administration log** in the Administration view, so authorized users can review administration activity even if they missed an email or delivery failed. Such a log could record the action, actor, affected account or resource, and timestamp independently of email delivery. This is a possible follow-up, not a requirement for the initial implementation. Its scope, access permissions, retention and presentation remain to be decided.

### Administration settings

Add a **Settings** section to the Administration tab. Admins and the owner can manage day-to-day moderation settings, such as which comments are held for review. Only the site owner can change settings that grant or revoke permissions, except for the explicitly admin-configurable publication policies governing moderator automatic approval and moderator allowlist management described below.

By default, only authors can edit their own comments. The owner can enable editing of other users’ comments for admins. The owner inherits that permission when it is enabled. Moderators can hold or delete comments and ask authors to revise them. The server enforces the current editing policy on every update, including direct API requests.

If owners need to delegate control of permission settings later, consider delegation for specific settings or groups of settings.

### Site-wide comment review

After owner permissions and appointments, design a moderator view with **Held for review** and **All recent comments**. Both views should show comment status and link to the discussion. Moderators can approve or delete held comments, and can delete a published comment or withdraw its approval and hold it from public view so the author can revise it. By default, only the author can edit the text. The current comment update API allows admins to edit other users’ comments. Apply the owner-controlled editing setting in both the backend and the widget. See #275.

#### Comment publication states

A comment has three effective states. There is no separate rejection state or workflow: a moderator who decides that a held comment should be removed deletes it. Withdrawing approval (disapproving or hiding a comment) instead returns it to the held state and is reversible.

| State | Publicly visible content | Content retained | Reversible |
| --- | --- | --- | --- |
| Approved | Yes | Yes | Yes |
| Held for review | No | Yes | Yes |
| Deleted | No | No | No |

Use an `isApproved` boolean alongside manual-hold and soft-deletion metadata:

- `isApproved` — whether the comment is approved for publication.
- `heldBy` — the immutable account ID of the moderator who imposed an active manual hold; absent or null when there is no active manual hold.
- `deletedAt` — when the comment was deleted.
- `deletedBy` — the immutable account ID of the user who deleted the comment. A username snapshot may additionally preserve the name at the time of deletion if historical display is needed.

The deletion metadata distinguishes an author's deletion of their own comment from a moderator's deletion of someone else's comment. Derive this distinction by comparing `deletedBy` with the comment's author account ID; no separate rejection flag or state is necessary. The interface may describe the former as deletion and the latter as rejection or moderator removal, with exact wording and disclosure deferred to UX design. Both use the same deletion mechanism and have the same effect on content and thread structure.

Deletion takes precedence over approval. A comment can start approved or held according to publication policy, and an edit that triggers review can cause approval to be withdrawn. A moderator can approve a held comment or return an approved comment to the held state. Either an approved or a held comment can be deleted; deleted comments cannot be restored by approving them.

Deletion removes the content but retains the comment object and structural metadata, consistent with the incremental loading design. Deleted text is no longer available to the author or moderators. The default is to publish immediately unless an applicable publication rule requires a hold. The remaining details of edit-triggered policy evaluation are open. Use #241 for prior investigation and check whether #63 offers a starting point.

#### Manual holds survive edits

Distinguish an automatic hold imposed by publication rules from a manual hold imposed by a moderator. An automatic hold has no `heldBy` value. A manual hold sets `isApproved` to false and records the acting moderator's immutable account ID in `heldBy`, including when a moderator explicitly places a manual hold on an already automatically held comment.

| Current state | Subsequent edit passes all publication rules | Subsequent edit fails a publication rule |
| --- | --- | --- |
| Automatically held (`heldBy` absent) | May become approved through policy evaluation | Remains held |
| Manually held (`heldBy` present) | Remains held | Remains held |

A manual hold survives edits regardless of whether the new content would otherwise qualify for immediate publication, including automatic exemptions. An edit must not clear or replace `heldBy`. Only an authorized explicit approval of the current reviewed content releases the manual hold, setting `isApproved` to true and clearing `heldBy` together. Deletion remains terminal and takes precedence over either type of hold. No additional publication state is needed.

For example, Alice removes the link that triggered an automatic hold; the comment may then be automatically published. If Bob manually held Alice's comment, even a rewritten comment that passes every publication rule remains held until an authorized moderator approves it. A manual hold remains in force even if the moderator who imposed it subsequently loses moderator privileges.

Apply changes to the text, approval status and active manual hold consistently using atomic conditional updates where necessary. A concurrent edit must not overwrite a newly imposed manual hold with an automatic approval. The remaining details of which edits trigger policy evaluation are separate from this invariant.

#### Approval idempotency and concurrent edits

Approval is idempotent. An approval request must never inadvertently publish content that the moderator has not reviewed. The moderator submits the comment ID and the text they reviewed. The server authorizes the caller, then considers the comment's current publication state before comparing its content against the reviewed text.

| Current comment state | Current text matches reviewed text | Result |
| --- | --- | --- |
| Approved | Yes | Success; no change |
| Approved | No | Success; no change |
| Held for review | Yes | Approve |
| Held for review | No | HTTP 409 Conflict; review the updated text |
| Deleted | Either | Error; cannot approve |

For example, Alice submits a comment that a publication rule holds for review. Bob, a moderator, begins reviewing it. Alice edits the comment before Bob submits his approval:

- If Alice's edited comment passes all applicable publication rules and becomes approved automatically, Bob's approval succeeds as a no-op. The comment is already public, and the request does not change its content or publication state.
- If Alice's edited comment remains held and its text differs from what Bob reviewed, Bob's approval returns HTTP 409 Conflict. He must review the updated text before approving it.
- If the comment remains held but its current text is identical to what Bob reviewed, approval may proceed. The intent is to approve the reviewed content, not to require that no intervening edit has occurred.

On a content mismatch, the client should inform the moderator that the comment has been edited since they began reviewing it and that they must review the updated comment before approving it. The precise presentation is a UX decision.

Submitting the reviewed text is the preferred approach for now. Comparing a hash of the reviewed text is an alternative that avoids sending the full text, while a content revision number would also detect intervening edits that restore the original text. The latter behavior is not required by the current design.

**Atomicity.** The comparison and approval must be atomic at the database level. MongoDB supports conditional atomic updates to individual documents, so the server can condition the approval update on the comment ID, the comment still being held and not deleted, and its current text matching the submitted reviewed text. A successful explicit approval also clears any active `heldBy` in the same atomic update. An unconditional update following a separate read and comparison would introduce a race in which an author could change the text before the approval is applied.

If the conditional update does not match, inspect the current state and apply the decision table above. Do not approve changed held content on a retry. Concurrent edits and deletions must also preserve these state and visibility invariants. A successful no-op approval does not modify timestamps or generate duplicate publication side effects.

#### Visibility of unpublished comments

An unpublished comment is visible only to its original author and users with effective moderator privileges. Ordinary readers cannot see its content.

| Viewer | Approved content | Held content |
| --- | --- | --- |
| Ordinary reader (not the author) | Yes | No |
| Original author | Yes | Yes |
| Moderator | Yes | Yes |
| Admin | Yes | Yes |
| Owner | Yes | Yes |

Authors see their held comments in their original position in the discussion tree, with a clear indication that they are not yet published. Holding is reversible and retains the comment content, unlike deletion.

Apply the same server-enforced visibility policy to every comment retrieval path, including direct API requests, discussion trees, comment histories and site-wide views. Excerpts and other public-facing data must not disclose held content to unauthorized viewers. Comment selection and comment visibility are separate concerns: a view determines which comments it selects, while the visibility policy determines what the requesting user may see.

#### Placeholders and continuity of discussion threads

Holding or deleting a comment does not automatically hold or delete its replies or descendants. Evaluate each descendant independently under the same publication and visibility rules.

When a comment is unavailable to a viewer but has descendants visible to that viewer, show a placeholder at its original position in the discussion tree to preserve the thread's structure. A deleted comment with no descendants can be omitted. Do not expose held or deleted content through a placeholder. The exact wording and detail are UX decisions: ordinary readers may see a generic unavailable or deleted-comment message, while moderators may see more information about the reason, state or deletion metadata. A held comment remains visible in full to its author and moderators.

A user cannot post a new direct reply to an already deleted comment, including through direct API requests. Existing replies remain intact, and users may continue the thread by replying to an existing, eligible descendant. A deleted ancestor does not make its descendants ineligible for replies. Whether a visible held comment can receive new direct replies, and the exact presentation of held placeholders to different viewers, remain open.

For example, if Alice's comment is deleted after Bob replies, Alice's comment becomes a placeholder, Bob's independently visible reply remains, and Carol can reply to Bob. Carol cannot create a new direct reply to Alice's deleted comment.

### User comment history

Provide a site-wide view of comments authored by a particular user. This is a general feature, not exclusively a moderation tool. Readers can explore a user's public contributions, authors can review their own contributions including held comments, and moderators can inspect a user's history across discussions to assess patterns of misconduct or suitability for moderator appointments.

| View | Purpose |
| --- | --- |
| Discussion | Comments belonging to a particular discussion |
| All recent comments | Recent comments across the installation for moderation |
| Held for review | Site-wide moderation queue |
| User comment history | Comments authored by a particular user across the installation |

Apply the same visibility rules in the user comment history as in the discussion tree. Deleted content is not recoverable through any view. The exact navigation, sorting, pagination, and presentation of these views are deferred to subsequent UX and engineering design.

### Publication policy and notifications

Every applicable publication rule answers **Should this comment be published?** A rule returns `true` when it permits immediate publication and `false` when it requires moderation. Publish immediately only if every applicable rule returns `true`. A single `false` holds the comment for review. The developer-provided filter follows the same convention. **Default policy: publish immediately.** When no applicable rule requires moderation, a new comment is published without review. A fresh installation must not hold comments by default. An active manual hold is not overridden by automatic publication rules or exemptions.

#### Moderator automatic approval

Moderators are entrusted with the authority to publish comments. By default, new comments authored by users with effective moderator privileges (moderators, admins and the owner) are automatically approved without evaluating ordinary automatic publication rules or requiring an explicit approval action.

Provide a persisted, installation-wide moderator automatic approval setting, enabled by default. Admins and the owner may disable or re-enable it through Administration settings without redeploying; moderators cannot change it themselves.

| Setting | New comments by moderators, admins and owner |
| --- | --- |
| Enabled (default) | Automatically approved |
| Disabled | Evaluated under the ordinary publication policy, including applicable allowlist exemptions |

Disabling automatic approval does not mean every moderator comment is held. Comments that satisfy the ordinary publication policy are still published immediately. Existing publication states are not changed by toggling the setting.

Automatic approval never overrides an active manual hold, and deletion remains terminal. Where edits trigger publication-policy evaluation, apply the same automatic approval exemption only in the absence of an active manual hold. If the proposed mandatory-review list is implemented, its requirement for explicit review takes precedence over automatic exemptions, including moderator automatic approval.

There is no separate self-approval setting. Preserve the previously agreed restriction when automatic approval is disabled: a privileged author whose own comment is held cannot explicitly approve it; another authorized moderator must approve it. When automatic approval is enabled, explicit self-approval remains an authorized moderator action for a held comment, subject to the same content-matching rules and any applicable explicit-review requirements. Automatic publication is not an explicit approval action and must never release a manual hold.

#### Publication rules and exemptions

An allowlist can exempt an account from a rule where that rule explicitly supports exemptions. An allowlist match cannot override a `false` returned by another applicable rule. Which rules support exemptions remains open.

A later iteration may add account-level overrides before evaluating publication rules. A **trusted-user allowlist** would publish comments immediately by bypassing all publication rules. Authorized allowlist managers can remove a user from that list if they misuse the exception, and moderators can still act on published comments. A **mandatory-review list** would hold every comment from a listed user until a moderator explicitly approves it. Mandatory review takes precedence over automatic exemptions, including the trusted-user allowlist and moderator automatic approval.

#### Moderator allowlist management

By default, moderators can add trusted users to publication allowlists, making it easier to manage the moderation workload. Admins and the owner can disable or re-enable this capability through a persisted, installation-wide Administration setting. This is an explicit exception to the general rule that only the owner can configure permission settings.

| Actor | Moderator management enabled (default) | Moderator management disabled | Can change the setting |
| --- | --- | --- | --- |
| Regular user | No | No | No |
| Moderator | Yes | No | No |
| Admin | Yes | Yes | Yes |
| Owner | Yes | Yes | Yes |

Allowlist management includes adding and removing entries, so moderators can withdraw trust when it is no longer warranted. When moderators are authorized to manage allowlists, they may add or remove their own accounts and other moderators' accounts as well as ordinary users' accounts. Do not impose a special self-listing restriction or attempt to prevent reciprocal additions between moderators. The authority is trust-based: someone trusted to exempt other users can misuse that authority, and forbidding self-additions would not prevent collusion. If admins or the owner do not trust moderators with this authority, disable moderator allowlist management and manage the entries themselves. The automatic moderator approval setting and allowlist management permission are independent; allowlist exemptions can still permit immediate publication when moderator automatic approval is disabled. Disabling moderator allowlist management does not remove existing entries; admins and the owner retain control over them. The server enforces the current policy on each allowlist mutation, including direct API requests, and rejects unauthorized mutations with HTTP 403. The frontend reflects the same policy.

This permission governs publication allowlists, including rule-specific exemptions and the proposed trusted-user allowlist if implemented. It does not itself grant authority to change publication rules, manage mandatory-review lists, administer user accounts, or appoint privileged roles. The release scope and specific rule exemption behavior remain open.

#### Prospective publication policy changes

Publication policy changes are prospective, not retroactive. Changing a publication rule, enabling or disabling an exemption, or adding or removing an allowlist or mandatory-review entry does not automatically re-evaluate existing comments or change their stored publication state.

| Policy change | Effect on existing comments |
| --- | --- |
| A stricter rule is enabled | Approved comments remain approved |
| A rule is relaxed or disabled | Held comments remain held |
| A user is added to an allowlist | Their held comments remain held |
| A user is removed from an allowlist | Their approved comments remain approved |

Apply the current publication policy to subsequent submissions and to future edits where the agreed edit policy calls for re-evaluation. Moderators can still explicitly approve, hold or delete individual existing comments. A setting that changes moderation authority, such as allowlist management, applies to subsequent actions under the current settings; it does not undo previously authorized actions.

Explore opt-in settings that hold all comments from guests or new accounts, or hold comments that match rules such as links or selected words or phrases. Immediate publication is the default. Moderator automatic approval is defined above. The scope and implementation of trusted-user automatic exemptions remain open. Coordinate policy settings and enforcement with #275.

Define how the existing notifications fit this workflow. Decide when moderators hear about held comments and when public comment notifications should go out. Coordinate with #248 when considering what happens after a comment is edited.

## Owner configuration and ownership changes

This section addresses less common deployment and recovery scenarios. The environment configuration is authoritative for ownership; the database records the last successfully recognized owner for change detection, not as an independent source of authority.

### Owner identity, credentials and profile

| Owner account property | Environment variables | Application |
| --- | --- | --- |
| Username | Yes | No |
| Password | Yes | No |
| Email address | Yes | No |
| Effective privilege | Derived from configured identity | No |
| Display name | No | Yes |
| Avatar (future) | No | Yes |

The owner may manage non-identity profile information through ordinary self-service features. No application operation, including password resets, email changes or administrative account updates, may override the owner's configured username, email address or password.

Someone with deployment access can recover the owner account by rotating the password in the environment and rebuilding or redeploying as required by the platform. Recovery must work even when the owner's database record already exists. Today, the environment password only bootstraps a missing owner record. An existing record uses its stored password hash, so deployment-based rotation requires the fix tracked in [#286](https://github.com/rendall/simple-comment/issues/286). Changes to configured email and password must be honored for the recognized owner. Invalidate existing authentication sessions on credential rotation or ownership transfer so stale sessions cannot retain ownership access.

### Detecting ownership changes

In the installation-level configuration object, store `lastKnownOwnerUsername` and `lastKnownOwnerAccountId` (the immutable database account ID). Set these automatically when the configured owner is first successfully recognized, and update them automatically after a successful ownership change. Neither field grants ownership or overrides deployment configuration. Effective privilege 3 remains derived, never stored on a user record.

Resolve the configured username to an account and compare it with the last known owner during server initialization (or equivalent serverless initialization before serving requests). Build-time database access is not required.

| Last known owner username | Configured owner username | Configured username exists? | Interpretation |
| --- | --- | --- | --- |
| None | Alice | No | First initialization; create owner account with stored privilege 2 and establish baseline |
| None | Alice | Yes | Existing installation; establish baseline from configured account |
| Alice | Alice | Yes | Normal startup if the account ID also matches |
| Alice | Bob | No | Ownership transfer to a new account; create it with stored privilege 2 |
| Alice | Bob | Yes | Ownership transfer to an existing account; potential identity collision |
| Alice | Alice | Yes, different account ID | Unexpected account replacement; potential identity collision |
| Alice | Alice | No | Previously recognized owner account is missing; unexpected recovery condition |

A changed username alone signals a change in ownership configuration, not necessarily a collision. A collision is detected when the new configured identity resolves to an existing account other than the last known owner, or when the username is unchanged but the account ID differs. If configured username and email identify different existing accounts, reject the inconsistent configuration rather than silently merge or overwrite accounts.

The intended straightforward transfer path is to configure a previously unused username, create a new owner account, and recognize that account as owner. The former owner loses effective privilege 3 and reverts to its stored privilege (2 by default for an account created as owner). The newly created owner stores privilege 2 and derives effective privilege 3. Do not rewrite an existing account's stored privilege merely by deriving owner access; the policy for transfers to existing accounts is still open. Whether to accept or reject transfers to existing accounts, and how to handle an unexpected replacement or missing account, remain open decisions. Detect and report these conditions regardless of the eventual policy. A rejected change must not advance the last-known-owner record or silently modify either account.

### Notifications and reconciliation

Treat a successful ownership change as an administration action. Send one notice per recipient to all current moderators, all current admins, and both the previous and new owners, even if the previous owner no longer has a privileged role. Identify the previous and new owner and that the change originated in deployment configuration. Do not disclose credentials. Notify the relevant administration recipients of detected potential collisions as a warning, even if the transfer is not accepted. Ordinary restarts and establishing the initial baseline are not ownership changes.

After a successful reconciliation, persist the new last-known-owner username and account ID so subsequent startups do not treat the same change as new. Make reconciliation concurrency-safe so multiple serverless instances cannot independently process the same transition. The exact persistence and notification delivery/deduplication mechanism remains to be designed. As with other administration actions, email delivery failure must not roll back a successfully reconciled ownership change.

## Out of Scope

This draft leaves reader reports, appeals, bulk actions, IP blocking, and shadowbanning as possible follow-ups. Their priority and scope are open. A distinct rejection state or workflow is not part of the initial design; moderators delete comments instead.

## Open Questions


- Which edits should trigger automatic publication policy evaluation, and should visible held comments accept new direct replies? Immediate publication is the default; manual holds survive edits. The concurrency and idempotency semantics of explicit approval are defined above.
- Which policy settings and notifications are essential to completing #284?
- Should a persistent, reviewable administration log be added, and which actions, viewers and retention policy should it support?
- Should deployment-based ownership transfers to existing accounts be accepted or rejected? How should unexpected replacement or disappearance of the last known owner account be handled? See [Owner configuration and ownership changes](#owner-configuration-and-ownership-changes).

## Draft Acceptance Criteria

The configured owner has effective privilege 3 and retains admin and moderator access regardless of the stored privilege or legacy `isAdmin` flag. An account created for the configured owner stores privilege 2 and retains it when ownership is transferred away, becoming an admin by default. All accounts store exactly one privilege in the range 0–2; the API derives the role predicates from the effective privilege. Attempts to delete or demote the configured owner account return HTTP 403 and leave the record intact. Users cannot gain ownership through profile changes or role changes. Rotating the configured password and redeploying restores owner access for an existing account and invalidates the previous password. Owner username, email and password cannot be changed through application APIs; the owner can edit non-identity profile details. The last-known-owner record detects ownership changes and potential collisions without granting ownership. Successful transfers to new accounts update that record and generate administration notices. Handling of transfers to existing accounts and unexpected account replacement or disappearance remains open.

The owner and admins can appoint and remove moderators. Only the owner can appoint and demote admins; admin demotion explicitly assigns privilege 1 or 0. The API rejects attempts by moderators to appoint, create, or remove another moderator, attempts by admins to grant or revoke admin access, and attempts to assign owner privilege or invalid privilege values. Existing admin accounts migrate to privilege 2 and ordinary accounts to privilege 0. The same role-management interface supports admin and moderator appointments and demotions, subject to actor and target privileges. Appointment grants already implemented moderation capabilities, including authorized cross-author comment deletion, and revocation removes the corresponding privileges on subsequent requests. Approval and holding capabilities are added as the comment review system is implemented. Administration actions are committed before email delivery is attempted. Notification failures or disabled email delivery do not undo successful actions or turn them into failed API responses.

An admin cannot delete another admin's account, change its password, or modify any of its account details. Only the owner can perform administrative account mutations on an admin account. Unauthorized cross-account mutations return HTTP 403 and leave the account unchanged. The same restrictions protect the owner from administrative changes by other users.

A designated moderator can see held and recent comments across multiple discussions in one place. Approving a held comment makes it public, and moderators can hold or delete published comments or delete held comments. Deletion removes content, records deletion time and actor, and takes precedence over approval. Author deletion and moderator removal (rejection) are distinguishable from deletion metadata without a separate state or operation. New comments publish by default unless an applicable rule requires moderation. An active manual hold is recorded in `heldBy`, survives edits and is cleared only by an authorized explicit approval. Explicit approval is idempotent: an already approved comment returns success without a change even if its text differs from what the moderator reviewed; a held comment is approved only if its current text matches the reviewed text, otherwise the request returns HTTP 409 Conflict. A deleted comment cannot be approved. The conditional approval is atomic. Moderator automatic approval is enabled by default and can be disabled or re-enabled by admins and the owner through persisted publication settings. Enabled means privileged authors' new comments bypass ordinary publication rules; disabled means ordinary publication rules and applicable exemptions apply. Automatic approval never releases a manual hold. When disabled, a privileged author cannot explicitly approve their own held comment; another moderator can approve it. The server rejects unauthorized setting changes and explicit approval actions. Authors and moderators can see held comments; unrelated ordinary readers cannot. Authors see their own held comments in their original tree position, identified as unpublished. Independently visible descendants of unavailable comments remain visible under structural placeholders, and new direct replies to deleted comments are rejected while replies to eligible descendants are allowed. The site-wide user comment history allows ordinary readers to see public contributions, authors to see their own held contributions, and moderators to see held contributions by any user, consistently with the same server-enforced visibility policy. By default, only authors can edit comment text. When the owner enables admin editing, admins and the owner can edit others’ comments. The API rejects cross-author edits by moderators in either mode and rejects attempts by non-owners to change the editing setting. Where publication allowlists are implemented, moderator allowlist management is enabled by default; admins and the owner can disable or re-enable it without losing their own allowlist management authority. Authorized allowlist managers may manage their own entries and those of other moderators; no special anti-collusion restriction is imposed. Publication policy and list membership changes never automatically change existing comments' publication states. The initial release scope for configurable rules and notifications remains open for discussion.

## Validation Strategy

Unit tests should cover every effective privilege level and its derived predicates, including owner records with a lower stored privilege or legacy `isAdmin: false`. Test migration of existing admin and ordinary accounts, initialization of a missing stored privilege to 2 for the existing configured owner, migration reruns, rejection of invalid stored privileges, and preservation of owner access without persisting privilege 3. Verify a newly created owner account stores privilege 2 while deriving privilege 3. Test promotion from moderator to admin and demotion from admin to either moderator or regular user, including the resulting effective permissions. API integration tests should exercise owner deletion and demotion as both the owner and another admin, confirm HTTP 403, and confirm the record and effective permissions afterward. Test moderator appointment by the owner and an admin, removal by the owner and an admin, owner-only admin appointments and demotions, rejection of role changes attempted by a moderator, and rejection of attempts to grant or revoke admin access by an admin. Verify that direct API requests cannot assign privilege 3 or bypass role checks through legacy flag inputs. Test the shared role-management interface for admin and moderator appointments and demotions, including restricted destination roles. Verify appointment enables existing moderation actions and demotion removes lost privileges on subsequent requests. Verify that each successful change attempts one notice per intended recipient, including a removed moderator, and that rejected requests send none. Test disabled notifications, provider errors, timeouts and partial delivery failures; verify that the action remains committed, the API reports success, and delivery failures are logged. Verify that a moderator cannot demote or delete the owner through a direct API request. The API contract and dashboard should agree on who can perform each action.

Test cross-account administration against the privilege matrix, including account deletion, password changes, and profile and identity updates. In particular, verify that an admin cannot modify or delete another admin or the owner through direct API requests, that the owner can administer admins, and that admins can administer lower-privilege accounts subject to the separate role-assignment rules. Verify that forbidden requests leave the target unchanged and that ordinary authorized self-service actions remain distinct from cross-account administration.

Exercise the full review flow across multiple discussions. Test held-to-approved and approved-to-held transitions and deletion of either state. Exercise every row of the approval decision table, including repeated approval requests, automatic approval after an author edit, a changed comment that remains held, and intervening edits that restore identical text. Test concurrent edit, deletion and approval operations against the MongoDB conditional update, ensuring no unreviewed held content is published and no deleted comment is restored. Verify that no-op approvals do not modify timestamps or repeat publication side effects. Test moderator automatic approval with the setting enabled and disabled for moderators, admins and the owner, including bypass of ordinary rules when enabled, ordinary evaluation when disabled, manual holds surviving edits in either mode, prospective-only changes, persistence and runtime changes. Test explicit approval of own and other authors' held comments according to the setting and the content-matching policy. Verify that admins and the owner can change the setting, moderators and ordinary users cannot, and direct API requests cannot bypass approval authorization. Verify that deletion records the authenticated deleting account ID and timestamp, removes content, retains the structural comment object, and cannot be reversed through approval. Test author deletion and moderator removal, deriving the distinction from the author and deleting account IDs without introducing another state. Test publish-by-default with no applicable holding rule, automatic holds that can be cleared by qualifying edits, and manual holds that survive edits even when all rules pass or an allowlist applies. Test imposing a manual hold on an already automatically held comment, explicit approval clearing `heldBy` atomically, and concurrent edits and manual holds preserving the manual hold. Test visibility for unauthenticated readers, unrelated authenticated users, authors and privileged users in the discussion tree, direct comment reads, user comment history and site-wide moderation views as applicable. Verify that authors see their own held comments in their original tree position, that unauthorized readers cannot access held content through alternate retrieval paths, and that no viewer can retrieve deleted text. Test preservation of independently visible descendants beneath deleted or held parents, including nested placeholders without hidden content. Verify that the server rejects new direct replies to deleted comments (including when the parent is deleted after the reply form is opened), but permits replies to eligible existing descendants. Verify user comment history across multiple discussions and that the moderator queue excludes deleted comments. Test allowlist management with the setting enabled and disabled for each privilege level, including direct API requests, persistence, runtime changes, permitted self-listing and listing of other moderators when authorized, and preservation of existing entries when moderator management is disabled. Verify prospective-only application of publication rules and allowlist changes: existing approved and held comments retain their state, while subsequent submissions follow the new policy. Test mandatory-review list changes in the same manner if implemented, and edits according to the eventual edit policy. Once policy and notification behavior are agreed, verify that rules produce the expected publication state and notifications follow that state.

Test owner initialization, normal restart, credential rotation, protected owner identity fields, permitted owner profile edits, transfer to a previously unused username, and detection of existing-account collisions, mismatched account IDs, missing owner records and conflicting username/email identities. Verify that the last-known-owner record is not authoritative for permissions, successful reconciliation updates the baseline, the previous owner loses effective owner access and retains its stored admin privilege by default, the newly created owner stores privilege 2, and concurrent initialization does not process the same change twice. Verify notices include the former and new owner on successful transfers and omit secrets. Validate the remaining collision cases once their policy is agreed.

Implementation PRs for sub-issues under #284 use `284-build-a-site-wide-comment-moderation-system` as their base branch.
