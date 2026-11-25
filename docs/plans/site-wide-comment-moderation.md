# Site-wide comment moderation

Status — Draft for discussion

Parent issue — [#284](https://github.com/rendall/simple-comment/issues/284)

## Goal

Build a site-wide moderation system so an installation owner can appoint moderators and those moderators can manage comments across all discussions.

## Focused first iteration — owner review

The first iteration addresses a single practical concern: potentially objectionable links or terms should not appear publicly without human review. Use the existing environment-configured owner account as the initial reviewer. Do not build moderator appointments, a role-management dashboard, or a general policy configuration system as prerequisites.

### Privilege foundation

Implement the numerical privilege model in iteration one, without implementing any role appointment or demotion workflow.

| Stored privilege | Meaning |
| ---: | --- |
| Absent or 0 | Regular user |
| 1 | Moderator |
| 2 | Admin |

The configured owner has effective privilege 3, derived on the server from deployment configuration and never stored as 3. Newly created owner accounts store 2. Newly created ordinary accounts store 0; existing ordinary accounts without a privilege field need not be rewritten.

For a non-owner, an absent privilege field resolves to 0; a present valid stored value is used as-is. Derive `isModerator` from effective privilege >= 1, `isAdmin` from >= 2, and `isOwner` from === 3. Reject invalid stored or requested privilege values; do not interpret arbitrary numbers or legacy flag inputs as authority. Do not perform a legacy-admin migration in iteration one. A non-owner with only `isAdmin: true` and no stored privilege resolves to 0; the old Boolean flag is never an authorization source under the new model. The optional legacy-admin upgrade script belongs to iteration three. Initialize the existing owner's underlying privilege to 2 if missing when initializing the owner account; effective owner access does not depend on that write. Document the legacy-admin compatibility change prominently in upgrade instructions.

Use `isModerator` (effective privilege >= 1) as the authorization predicate for comment moderation from iteration one, including review, approval and cross-author deletion; iteration two uses the same predicate for manual holds. Select review notification recipients using the same effective moderator predicate. Initially the configured owner will normally be the only moderator, since there is no appointment workflow. Accounts already assigned a valid stored privilege of 1 or 2 can exercise moderation authority immediately. Do not hard-code an owner-only restriction that would need refactoring in iteration three. Keep author editing permissions separate: moderator status alone does not authorize editing someone else's text. Account administration remains subject to the higher privilege and target-account checks.

### Initial workflow

1. A user submits a comment or changes existing comment text.
2. The server checks the text against the link rule and the optional private moderation terms list.
3. If neither rule requires review, the comment is published immediately. If either rule requires review, the server saves it as held, with an author-facing reason, before any public read can expose the content.
4. Notify users with effective moderator privileges (normally just the configured owner initially) by email that a comment requires review, identifying the comment and providing a way to locate it.
5. An authenticated moderator can review the held content and explicitly approve it or delete it (disapprove/reject). A held comment stays unpublished until approved or until an edit legitimately clears an automatic hold. There is no separate rejection state.

A moderator can review a held comment in its discussion or through a minimal review entry point. Do not require a site-wide moderation dashboard or a new browsing mode for this iteration. Approval and deletion are authenticated application actions, not unauthenticated mutations triggered by visiting an email link. The precise navigation and UI are implementation decisions.

### Initial publication policy

| Comment or edit | Result |
| --- | --- |
| Contains a link | Hold for review |
| Matches a term or phrase in the optional server-side moderation list | Hold for review |
| Passes every applicable publication rule | Publish immediately, unless subject to a manual hold |

The link rule is enabled by default. Detect common URL forms, including recognizable links without an explicit scheme; the precise detection algorithm and false-positive trade-offs are implementation details. The term rule is active only when a nonempty moderation list is supplied. Keep the rules independent and use the existing publication decision convention. Preserve applicable existing developer-provided filtering rather than building a general policy engine.

For this minimal iteration, the rules apply to all authors; no role-based automatic publication exemption is required. Use the moderator predicate for new review alerts and explicit approval authority. Preserve account and comment authorization boundaries using the privilege foundation above; do not treat legacy admin flags as authority or run an automatic migration. Do not introduce new role appointments in this slice. Identify the configured owner on the server and retain the existing owner protections. Owner credential rotation (#286) remains an independent security fix.

Re-evaluate changed comment text so an author cannot evade review by editing a published comment. A qualifying edit may release an automatic hold. Do not scan or reclassify existing comments merely because a rule or term list is introduced or changed. Manual holding of published comments belongs to iteration two; manual holds must survive edits and automatic exemptions as specified below.

The rules identify material for human review rather than declare it illegal or unacceptable, and need not detect every possible obfuscation or evasion technique.

#### Optional private moderation terms file

The actual list is supplied by the installation owner, not distributed with Simple Comment. It may contain words and phrases in any language. Do not commit a real objectionable-terms list to the repository or require the owner to put its contents in an environment variable.

Use an optional server-only plain-text file, provisionally named `moderation-terms.txt`:

| File condition | Behavior |
| --- | --- |
| Absent | Term filtering disabled; link filtering still applies |
| Empty, or only blank/comment lines | No terms trigger moderation |
| Contains terms | Matching comments are held for review |
| Present but unreadable or invalid | Report a configuration error; do not silently disable an intended filter |

Use UTF-8, one literal word or phrase per line, case-insensitive matching, ignore blank lines and lines beginning with `#`, and do not support regular expressions initially. The exact matching boundaries and normalization can be settled during implementation.

Provide a harmless example file, such as `moderation-terms.example.txt`, and document how installation owners supply the actual file. Exclude the real file from Git and from public assets, client bundles, API responses and logs. The deployment mechanism must make it available to the server/API functions only. Verify how Netlify packages serverless function files before settling the precise location and deployment instructions; do not assume that placing a file in an API source directory automatically makes it available at runtime. This is a small optional deployment input, not a persistent configuration subsystem or hot-reload feature.

For matching terms, use a generic author-facing hold reason (for example, "Your comment contains a word or phrase that requires moderation"). Do not reveal the matched term or the contents of the list. Link-based holds likewise supply a clear reason. The list is a private filtering input, not a guarantee that objectionable content will be detected.

### First-iteration completion criteria

- Link or configured term matches are held before public exposure; nonmatching comments publish immediately. Existing comments remain published unless subsequently edited or moderated.
- Effective moderators (normally just the owner initially) receive best-effort notifications when a new comment or changed text requires review. A delivery failure does not publish the comment or undo a successful write. Unchanged, failed and unauthorized writes do not send review alerts.
- The original author (including a recognized guest) and effective moderators can see the held content and reason; unrelated readers cannot retrieve them through the UI or API. Apply visibility rules to all implemented comment read paths.
- An authenticated user with effective moderator privileges can approve the reviewed text or delete the held comment. Approval is atomic and idempotent; stale reviewed text that remains held returns HTTP 409. A deleted comment cannot be approved. Rejection uses the same deletion mechanism, not a separate publication state.
- Preserve visible descendants and their thread structure when a parent becomes held or deleted. Do not allow new direct replies to held or deleted comments. Coordinate the necessary soft-deletion behavior with #280.
- Ordinary author editing remains distinct from moderation; do not expand cross-author editing authority. Enforce authorization on the server.
- The server derives effective privilege and role predicates correctly, including missing privilege resolving to 0 and configured owner resolving to 3. New owner accounts store 2; existing ordinary records need no backfill. A legacy admin flag alone grants no privilege. No automatic migration or appointment interface is implemented in this iteration; the optional upgrade script is deferred to iteration three. Verify moderator authorization and notification selection at levels 0–3.

### Second iteration — manually holding published comments

Extend the existing review workflow so a moderator can unpublish an already published comment. In this iteration, authorize the new moderation action using the same effective `isModerator` predicate as in iteration one. The configured owner will normally be the only moderator; appointed moderator accounts are introduced in iteration three.

A moderator can choose to hide a published comment and must supply a non-empty reason. This is a manual hold, not deletion. Preserve the comment's content and original position, set `isApproved` to false, and record `heldBy` and `heldReason` together. Enforce authorization and required reasons on the server.

| Viewer | Comment content | Hidden state | Specific hold reason |
| --- | --- | --- | --- |
| Original author | Visible | Visible | Visible |
| Authorized moderator (normally the owner in this iteration) | Visible | Visible | Visible |
| Other readers | Not visible | Visible as a placeholder | Not visible |

For ordinary readers, replace the previously published comment with a placeholder, including when it has no replies. The provisional label is **Hidden pending moderation**. Do not expose the text or specific reason through the API, placeholder, history, or other read paths. The author and moderator see the held comment in its original position, clearly marked as hidden, together with the reason. This public placeholder requirement is for manually hidden published comments; it does not require exposing the existence of every automatically held new comment.

Existing replies remain independently visible and eligible for further replies according to their own states. New direct replies to the hidden comment are not permitted. The author may edit their comment, but a manual hold and its reason survive edits. Only explicit authorized approval of the current reviewed text republishes it and clears the active hold metadata; deletion remains a separate terminal action. No new administration or manual-hold email notification is required for this iteration.

#### Second-iteration completion criteria

- The moderator can hide a published comment with a reason and subsequently approve it using the existing review workflow.
- Unauthorized hide requests and requests without a reason are rejected without changing the comment.
- Other readers see the hidden placeholder, including for a manually hidden leaf, but cannot retrieve the content or specific reason.
- The author and moderator can read the content, hidden state and reason; the author's edits do not lift the hold.
- Existing descendants remain independently visible; new direct replies to the held comment are rejected.
- Concurrent edits and moderation actions preserve the manual hold and the atomic content-matched approval rules. Public reads and any implemented synchronization paths reflect the changed visibility.

### Third iteration — moderator appointments

Introduce owner-appointed moderators (#285) and the shared role-management infrastructure using the integer privilege model already implemented in iteration one, allowing the owner to appoint and demote moderators who immediately gain or lose the first two iterations' moderation capabilities through the existing predicate. Include an optional legacy-admin upgrade script as described under [Migration](#migration). Preserve already assigned valid privileges; new admin appointments remain deferred. Include the agreed idempotent role assignments and role-change notifications.

A dedicated site-wide review interface and user comment history (#288) may also be useful early enhancements, but their inclusion in the third iteration is not yet decided.

### Later iterations

Defer persistent configuration and its design, the Administration Settings dashboard (#275), new admin appointments and demotions, configurable permission and publication policies, role-based automatic approval, allowlists and mandatory-review lists, ownership change detection/transfers and collision warnings, configurable notifications, and the optional administration log. Preserve the broader design below for when the project matures.

The detailed implementation slices, dependencies and validation are tracked in [Implementation](#implementation). Deferral must not weaken the authorization, moderation or visibility invariants of features actually shipped.

## Plain-Language Intent

The configured site owner controls the entire Simple Comment installation and all its discussions. The owner can appoint admins and revoke admin or moderator access. The owner and admins can appoint and demote moderators. Nobody can delete the owner's account or take away its admin access through the API. Moderators can see comments from across the site in one place, review comments before they appear publicly, and act on comments that are already public.

### Intended role hierarchy

The full moderation system has three privileged roles. Each role inherits the permissions of the roles below it. This describes the intended system across releases.

- **Owner** — The site owner is the account configured through deployment environment variables and has all admin and moderator permissions. The API protects the owner account from deletion and demotion.
- **Admin** — Admins can administer accounts below their own privilege level and have all moderator permissions. Only the owner can administer another admin's account.
- **Moderator** — Moderators can review, hide, or delete comments. Moderators can edit their own comments as authors. Moderators cannot edit user account details.

Only the owner can appoint admins or demote admins. The owner and admins can appoint and demote moderators. Moderators cannot appoint, create, or demote other moderators.

### Stored privilege and derived permissions

Represent each user's underlying role with a single integer `privilege` instead of independent `isAdmin` and `isModerator` flags. New user records store the value; an existing record without the field is treated as privilege 0 without requiring a write. Roles form a strict, cumulative hierarchy. Each account has one role at a time, and every higher role inherits the privileges of the lower roles.

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

**Stored versus effective privilege.** Only values 0–2 are valid stored privileges. Level 3 is derived exclusively on the server from the authenticated account's configured owner identity; it is never persisted or assignable through the API. When the server creates a new user account for the configured owner (whether on first owner login or during owner initialization), initialize its stored privilege to 2 (Admin), not 0 or 3. The account has effective privilege 3 while it is the configured owner. If deployment configuration later transfers ownership away from that account, its stored privilege remains 2 by default and it becomes an admin. Any subsequent demotion must follow the ordinary role-management rules. Resolve the effective privilege for each request using the authenticated account's current role. The following example assumes stored values have been validated; a missing field defaults to 0, while invalid present values are rejected:

```typescript
const privilege = isConfiguredOwner(user)
  ? Privilege.Owner
  : (user.privilege ?? Privilege.User);
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

The privilege model is effective in iteration one without a collection-wide migration. Existing accounts without a stored privilege are logically privilege 0, except that configured ownership derives effective privilege 3. New ordinary accounts store 0; owner accounts created by the server store 2. A legacy `isAdmin: true` flag alone grants no authority. Update authorization and API read/write paths accordingly; obsolete fields on existing records can remain unused. Explain in iteration-one upgrade documentation that legacy non-owner administrators without a stored privilege lose privileged access until explicitly assigned a privilege; a server warning about unmigrated legacy admin records is desirable, without leaking private data.

In iteration three, provide an optional one-time upgrade utility for installation owners who wish to retain or reinterpret legacy administrator appointments. The script should:

- Detect non-owner accounts with `isAdmin: true` and no stored `privilege` field.
- Offer a dry run showing proposed changes and default to assigning privilege 1 (Moderator), with an explicit option for privilege 2 (Admin) if the owner wants to retain account administration authority.
- Preserve existing valid stored privileges, leave ordinary accounts untouched, and exclude the configured owner from the legacy conversion.
- Be idempotent and safe to rerun: do not overwrite a privilege already assigned by the utility or another authorized operation.

The script is an installation upgrade tool, not an application role-appointment feature. It is optional, does not run automatically, and is not required for iteration one or two. No legacy Boolean flag fallback is used while waiting for it.

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

The following sections describe the broader intended system. The [focused first iteration](#focused-first-iteration--owner-review) defines the initial release boundary; later capabilities in this section are not required to ship the first iteration.

### Owner permissions and role appointments

The role-management sub-issue under #284 ([#285](https://github.com/rendall/simple-comment/issues/285)) follows automatic review and manual holding in the first two iterations. Its third-iteration scope is owner appointment and demotion of moderators using the privilege model introduced in iteration one; the shared admin appointment capability described here is for later releases. The owner can appoint and demote admins and moderators; admins can appoint and demote moderators only. The server authorizes and persists each change using the same privilege model. This capability can proceed independently of the broader comment review and publication workflows.

Appointment immediately grants the moderation capabilities already implemented for the assigned role, including authorized deletion of other users' comments. As the broader review system is implemented, moderators also gain the ability to approve held comments, withdraw approval (hold or hide comments), and delete held or published comments, subject to applicable policies. Revocation removes the capabilities associated with the lost privilege on subsequent requests. The role-appointment sub-issue need not implement all future comment review workflows.

There is one owner for the entire installation. Deployment environment variables determine the owner's identity and credentials; the server derives effective privilege 3 and `isOwner` from the authenticated account and its configured identity. Ownership cannot be granted or transferred through the application. See [Owner configuration and ownership changes](#owner-configuration-and-ownership-changes) below for credential recovery, ownership transfers and change detection.

Use the target account's ID to protect the owner's record. Reject any attempt to delete or demote the owner with HTTP 403, regardless of who makes the request. Derive the owner's effective privilege from ownership so neither a lower stored privilege nor a legacy `isAdmin: false` can lock the owner out.

### Role management dashboard

Add an **Administration** tab alongside the existing **Discussion** view in the comment widget. The discussion tree remains the default. The tab opens the dashboard in the widget under a **Site administration** heading so it is clear that the roster and role changes apply across the installation. Other widget views can be designed later.

The owner, admins, and moderators can open the tab and see the site owner, current admins, and current moderators, with each account listed once under its highest role. Moderators can view the roster. The owner and admins also see the role-management actions their permissions allow.

If the widget becomes too cramped for future administration workflows, a dedicated route can be considered with the widget as an entry point. A reserved discussion topic is outside this design.

The owner and admins can search for existing accounts with a searchable combobox that filters as they type and shows usernames alongside display names. Selecting an account fills the selection. An explicit **Appoint** action applies the change immediately. Admins can appoint moderators, and the owner can appoint either admins or moderators through the same interface. Available destination roles depend on the actor's authority and the target's current role.

Show demotion on the roster only where the viewer has authority over the target role. For admin demotion, the owner can choose moderator or regular user as the destination role. Moderator demotion assigns regular user. Confirm the action with the person’s name and the access they will lose. Enforce the same permissions for direct API requests.

Role assignments are idempotent. A request specifies the desired destination privilege, not a toggle. After validating the caller's authority, the target and the requested privilege, assigning an account its existing stored privilege succeeds without changing the record or sending an administration notification. A repeated request must not produce additional side effects. The server must distinguish an actual transition from a no-op in a concurrency-safe manner; simultaneous identical requests must not independently generate duplicate change notices. A no-op does not bypass authorization or the owner's protections.

Treat successful admin and moderator appointments and demotions as administration actions. Notify all current moderators, all current admins, the site owner, and the affected person, including someone just demoted. Send one notice per person identifying who made the change, whose access changed, and which access was granted or revoked.

### Administration notifications

Send administration notifications by email through the existing notification service. Persist a successful administration action before attempting notification delivery. Email delivery is best-effort: disabled notifications, provider errors, timeouts or partial delivery failures must not roll back the committed action or cause the API to report the action itself as failed. Attempt delivery to the intended recipients independently, and record delivery failures in the server logs without exposing sensitive information. Rejected or failed administration actions and authorized no-op role assignments do not generate success notifications. Apply the same principle to successful ownership changes. For now, only the already specified administration events generate notices: actual admin/moderator appointments and demotions, successful ownership changes, and the associated ownership-collision warnings. Do not add administration emails for policy changes, allowlist changes, user account deletion, or routine moderation operations. These are separate from the default comment notifications described below.

A persistent administration log and additional notification events are possible follow-ups, not requirements for the initial implementation. See [Deferred considerations and possible solutions](#deferred-considerations-and-possible-solutions).

### Administration settings

Add a **Settings** section to the Administration tab. Admins and the owner can manage day-to-day moderation settings, such as which comments are held for review. Only the site owner can change settings that grant or revoke permissions, except for the explicitly admin-configurable publication policies governing moderator automatic approval and moderator allowlist management described below.

By default, only authors can edit their own comments. The owner can enable editing of other users’ comments for admins. The owner inherits that permission when it is enabled. Moderators can hold or delete comments and ask authors to revise them. The server enforces the current editing policy on every update, including direct API requests.

#### Policy settings at a glance

| Setting | Default | Who can change it |
| --- | --- | --- |
| [Publication policy](#publication-policy-and-notifications) | Publish immediately unless an applicable rule requires moderation | Admin, owner |
| [Moderator automatic approval](#moderator-automatic-approval) | Enabled | Admin, owner |
| [Moderator allowlist management](#moderator-allowlist-management) | Enabled | Admin, owner |
| [Admin editing of other authors' comments](#administration-settings) | Disabled | Owner |

The table summarizes agreed policy defaults and configuration authority; the detailed sections define their behavior and constraints. It does not prescribe the exact settings schema or require every feature to ship in the initial release.

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
- `heldReason` — an author-facing explanation of the active hold, generated by publication policy for automatic holds or supplied by the moderator for manual holds.
- `deletedAt` — when the comment was deleted.
- `deletedBy` — the immutable account ID of the user who deleted the comment. A username snapshot may additionally preserve the name at the time of deletion if historical display is needed.

The deletion metadata distinguishes an author's deletion of their own comment from a moderator's deletion of someone else's comment. Derive this distinction by comparing `deletedBy` with the comment's author account ID; no separate rejection flag or state is necessary. The interface may describe the former as deletion and the latter as rejection or moderator removal, with exact wording and disclosure deferred to UX design. Both use the same deletion mechanism and have the same effect on content and thread structure.

Deletion takes precedence over approval. A comment can start approved or held according to publication policy, and an edit that triggers review can cause approval to be withdrawn. A moderator can approve a held comment or return an approved comment to the held state. Either an approved or a held comment can be deleted; deleted comments cannot be restored by approving them.

Deletion removes the content but retains the comment object and structural metadata, consistent with the incremental loading design. Deleted text is no longer available to the author or moderators. The default is to publish immediately unless an applicable publication rule requires a hold. The remaining details of edit-triggered policy evaluation are open. Use #241 for prior investigation and check whether #63 offers a starting point.

#### Manual holds survive edits

Distinguish an automatic hold imposed by publication rules from a manual hold imposed by a moderator. An automatic hold has no `heldBy` value. A manual hold sets `isApproved` to false, records the acting moderator's immutable account ID in `heldBy`, and records the moderator's explanation in `heldReason`, including when a moderator explicitly places a manual hold on an already automatically held comment.

| Current state | Subsequent edit passes all publication rules | Subsequent edit fails a publication rule |
| --- | --- | --- |
| Automatically held (`heldBy` absent) | May become approved through policy evaluation | Remains held |
| Manually held (`heldBy` present) | Remains held | Remains held |

A manual hold survives edits regardless of whether the new content would otherwise qualify for immediate publication, including automatic exemptions. An author edit must not clear or replace `heldBy` or the manual `heldReason`. After an edit, a manually held comment must be reviewed by an authorized moderator before it can be published. Only an authorized explicit approval of the current reviewed content releases the manual hold, setting `isApproved` to true and clearing `heldBy` and `heldReason` together. Deletion remains terminal and takes precedence over either type of hold. No additional publication state is needed.

For example, Alice removes the link that triggered an automatic hold; the comment may then be automatically published. If Bob manually held Alice's comment, even a rewritten comment that passes every publication rule remains held until an authorized moderator approves it. A manual hold remains in force even if the moderator who imposed it subsequently loses moderator privileges.

Apply changes to the text, approval status and active manual hold consistently using atomic conditional updates where necessary. A concurrent edit must not overwrite a newly imposed manual hold with an automatic approval. The remaining details of which edits trigger policy evaluation are separate from this invariant.

#### Reasons for holding comments

Every active hold has an explanation that the author and moderators can read. For a manual hold, the acting moderator must provide a non-empty reason; the server rejects a manual hold request without one. For an automatic hold, the publication policy supplies an author-facing reason, such as "This comment contains a link and requires review." If several rules require a hold, the policy can combine their explanations into one reason. The exact rule-result representation is an implementation detail; preserve the existing true/false publication decision semantics. Use a safe generic explanation if a rule has no more specific author-facing reason. Do not expose private configuration, secrets or internal diagnostic details.

| Field | Automatic hold | Manual hold |
| --- | --- | --- |
| `isApproved` | false | false |
| `heldBy` | Absent or null | Moderator's account ID |
| `heldReason` | Generated by publication policy | Required explanation supplied by moderator |

For example, a moderator may enter "Please remove the personal insults." The author can read this reason alongside their held comment and revise the comment if appropriate. An author cannot edit the hold reason. An automatic hold's reason can be updated when an edit triggers policy re-evaluation; a manual hold's explanation survives author edits. If a moderator imposes a manual hold on an automatically held comment, the moderator's explanation replaces the automatic reason. When a comment becomes approved, clear the active hold metadata, including `heldReason`, atomically with the approval. A deleted comment no longer has an active hold; its reason must not become public through deletion or placeholder rendering.

The reason is moderation metadata, not a private message or a reply in the discussion tree. Only the original author and users with effective moderator privileges may read the active hold reason. Ordinary readers must not receive it through any API or view. Private messaging and conversations between moderators and authors about held comments are outside the initial design.

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

**Atomicity.** The comparison and approval must be atomic at the database level. MongoDB supports conditional atomic updates to individual documents, so the server can condition the approval update on the comment ID, the comment still being held and not deleted, and its current text matching the submitted reviewed text. A successful explicit approval also clears any active `heldBy` and `heldReason` in the same atomic update. An unconditional update following a separate read and comparison would introduce a race in which an author could change the text before the approval is applied.

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

Authors see their held comments in their original position in the discussion tree, with a clear indication that they are not yet published and the reason for the hold. Moderators can also read the reason. Holding is reversible and retains the comment content, unlike deletion.

Guest authors follow the same visibility rule as registered authors: a returning guest can see their held comments and reasons as long as the server recognizes the authenticated guest identity. The existing authentication cookie and browser-local guest credentials support identity continuity, but guest identity recovery is not guaranteed if credentials are lost. Do not introduce a separate recovery mechanism for moderation. Linking guest identities to registered accounts is a separate exploratory feature ([#287](https://github.com/rendall/simple-comment/issues/287)), not a dependency of this design.

Apply the same server-enforced visibility policy to every comment retrieval path, including direct API requests, discussion trees, comment histories and site-wide views. Excerpts and other public-facing data must not disclose held content or hold reasons to unauthorized viewers. Comment selection and comment visibility are separate concerns: a view determines which comments it selects, while the visibility policy determines what the requesting user may see.

#### Placeholders and continuity of discussion threads

Holding or deleting a comment does not automatically hold or delete its replies or descendants. Evaluate each descendant independently under the same publication and visibility rules.

When a comment is unavailable to a viewer but has descendants visible to that viewer, show a placeholder at its original position in the discussion tree to preserve the thread's structure. A deleted comment with no descendants can be omitted. A previously published comment manually hidden by a moderator is an explicit exception to the descendant requirement: display a hidden placeholder even if it has no replies, provisionally labeled **Hidden pending moderation**. Do not expose held or deleted content or the private hold reason through a public placeholder. The exact wording and detail are UX decisions: ordinary readers may see a generic unavailable or deleted-comment message, while moderators may see more information about the reason, state or deletion metadata. A held comment remains visible in full to its author and moderators.

A user cannot post a new direct reply to a held or deleted comment, including through direct API requests. This applies even to authors and moderators who can see a held comment. Existing replies remain intact, and users may continue the thread by replying to an existing, eligible descendant. A held or deleted ancestor does not make its descendants ineligible for replies. Once a held comment is approved, ordinary reply rules apply again. The exact presentation of held placeholders to different viewers remains a UX decision. Use the hold reason rather than a reply to explain moderation decisions to an author.

For example, if Alice's comment is deleted after Bob replies, Alice's comment becomes a placeholder, Bob's independently visible reply remains, and Carol can reply to Bob. Carol cannot create a new direct reply to Alice's deleted comment.

### User comment history

Related feature: [#288 — Explore a site-wide user comment history view](https://github.com/rendall/simple-comment/issues/288). See also [Views and focus](incremental-fetch.md#views-and-focus) for the distinction between selecting comments, presenting them as a tree or list, and focusing an individual comment.

Provide a site-wide view of comments authored by a particular user. This is a general feature, not exclusively a moderation tool. Readers can explore a user's public contributions, authors can review their own contributions including held comments, and moderators can inspect a user's history across discussions to assess patterns of misconduct or suitability for moderator appointments.

| View | Purpose |
| --- | --- |
| Discussion | Comments belonging to a particular discussion |
| All recent comments | Recent comments across the installation for moderation |
| Held for review | Site-wide moderation queue |
| User comment history | Comments authored by a particular user across the installation |

Apply the same visibility rules in the user comment history as in the discussion tree. Deleted content is not recoverable through any view. The exact navigation, sorting, pagination, and presentation of these views are deferred to subsequent UX and engineering design.

### Publication policy and notifications

Every applicable publication rule answers **Should this comment be published?** A rule returns `true` when it permits immediate publication and `false` when it requires moderation. Publish immediately only if every applicable rule returns `true`. A single `false` holds the comment for review. The developer-provided filter follows the same convention. **Default policy: publish immediately.** When no applicable rule requires moderation, a new comment is published without review. A fresh installation does not hold all comments indiscriminately. The focused first iteration enables the link rule by default and optionally enables term filtering when the installation owner supplies a list. An active manual hold is not overridden by automatic publication rules or exemptions.

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

The focused first iteration implements fixed link filtering and optional file-based term filtering. Later, explore opt-in settings that hold all comments from guests or new accounts and configurable link or term rules. Immediate publication is the default. Moderator automatic approval is defined above. The scope and implementation of trusted-user automatic exemptions remain open. Coordinate policy settings and enforcement with #275.

#### Default comment notifications

The broader notification policy prioritizes events that require moderators' attention rather than notifying them of every comment. In the first iteration, review alerts go to effective moderators (normally only the configured owner) for new or changed comments requiring review. Other notification event types are not prerequisites for the initial workflow. Simple Comment is intended to operate within free-tier email service limits for low-volume installations; avoid unnecessary email traffic. A future configurable notification system may support different preferences for low- and high-traffic installations, recipients and event types. Its detailed design is outside the scope of this moderation project.

| Event | Notify moderators by default | Notify ordinary subscribers by default |
| --- | --- | --- |
| New comment automatically approved | No | No |
| New comment held by publication policy | Yes | No |
| Held comment approved | No (see possible resolution notice below) | Yes, where subscriptions exist |
| Published comment edited | Yes, subject to review of the attention-based policy | TBD |
| Held comment edited and still held | Yes | No |
| Comment deleted | No | No |
| Repeated no-op approval | No | No |

A held-comment notification should direct moderators to the comment requiring review. Consider a follow-up resolution notification to moderators who were alerted about a held comment when it is subsequently approved, so they know that review is no longer necessary. This follow-up is a possibility rather than a required default; it may be more valuable as a configurable preference, particularly on installations with several moderators.

Do not disclose unpublished content or hold reasons to ordinary subscribers. Coordinate the new defaults with existing notification behavior, including #248 (notifications after edits). The exact behavior for edited published comments, automatic approval after an edit, manually imposed holds and notifications to the affected author remains to be finalized. Email delivery must not invalidate a successfully persisted comment or moderation action.

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

This draft leaves reader reports, appeals, bulk actions, IP blocking, and shadowbanning as possible follow-ups. Their priority and scope are open. A distinct rejection state or workflow is not part of the initial design; moderators delete comments instead. Private messaging and private discussion threads are also outside the initial design.

## Open Questions


- The focused first iteration re-evaluates changed comment text against the initial publication rules. Further edit-policy configuration remains open. Immediate publication applies when no rule requires a hold; manual holds survive edits, and new direct replies to held comments are not permitted. The concurrency and idempotency semantics of explicit approval are defined above.
- The focused first iteration requires no persistent policy settings. Which additional configurable policies should be prioritized in later releases? The initial comment notification defaults are defined above; remaining event details and a possible moderator resolution notice are open. A configurable notification system is a separate future design.
- Should a persistent, reviewable administration log be added, and which actions, viewers and retention policy should it support?
- Should deployment-based ownership transfers to existing accounts be accepted or rejected? How should unexpected replacement or disappearance of the last known owner account be handled? See [Owner configuration and ownership changes](#owner-configuration-and-ownership-changes).

## Draft Acceptance Criteria

The criteria below describe the broader agreed behavior of the relevant features when implemented. Use the completion criteria in the [focused first iteration](#first-iteration-completion-criteria) for the initial release; later features are not prerequisites.

### Privilege hierarchy and role management

- Each account has an underlying privilege in the range 0–2; an absent field resolves to 0 without a database rewrite. The API derives the role predicates from the effective privilege.
- The owner and admins can appoint and remove moderators.
- Only the owner can appoint and demote admins; admin demotion explicitly assigns privilege 1 or 0.
- The API rejects attempts by moderators to appoint, create, or remove another moderator, attempts by admins to grant or revoke admin access, and attempts to assign owner privilege or invalid privilege values.
- Existing accounts without a stored privilege default to 0 without a backfill, regardless of legacy admin flags. New ordinary accounts store 0. Iteration three provides an optional idempotent upgrade script assigning legacy admin accounts privilege 1 by default or 2 by explicit choice, preserving existing valid privileges.
- The same role-management interface supports admin and moderator appointments and demotions, subject to actor and target privileges.
- Appointment grants already implemented moderation capabilities, including authorized cross-author comment deletion, and revocation removes the corresponding privileges on subsequent requests.
- Approval and holding capabilities are added as the comment review system is implemented.
- Authorized role assignments to the existing privilege succeed without changes or notifications, including repeated requests.

### Account administration

- An admin cannot delete another admin's account, change its password, or modify any of its account details.
- Only the owner can perform administrative account mutations on an admin account.
- Unauthorized cross-account mutations return HTTP 403 and leave the account unchanged.
- The same restrictions protect the owner from administrative changes by other users.

### Comment lifecycle and moderation

- A designated moderator can see held and recent comments across multiple discussions in one place.
- Approving a held comment makes it public, and moderators can hold or delete published comments or delete held comments.
- Deletion removes content, records deletion time and actor, and takes precedence over approval.
- Author deletion and moderator removal (rejection) are distinguishable from deletion metadata without a separate state or operation.
- An active manual hold is recorded in `heldBy`, survives edits and is cleared only by an authorized explicit approval.
- Every active hold has an author-facing `heldReason`, required from the moderator for manual holds and supplied by policy for automatic holds.
- Manual reasons survive author edits; approval clears active hold metadata atomically.
- Explicit approval is idempotent: an already approved comment returns success without a change even if its text differs from what the moderator reviewed; a held comment is approved only if its current text matches the reviewed text, otherwise the request returns HTTP 409 Conflict.
- A deleted comment cannot be approved.
- The conditional approval is atomic.

### Comment visibility and discussion continuity

- Only the author and moderators can read it.
- Authors and moderators can see held comments; unrelated ordinary readers cannot.
- Authors see their own held comments in their original tree position, identified as unpublished.
- Independently visible descendants of unavailable comments remain visible under structural placeholders, and new direct replies to held or deleted comments are rejected (including for authors and moderators) while replies to eligible descendants are allowed.
- A manually hidden published comment has a public hidden placeholder even if it has no replies; only the author and authorized moderators can see its content and specific reason.
- The site-wide user comment history allows ordinary readers to see public contributions, authors to see their own held contributions, and moderators to see held contributions by any user, consistently with the same server-enforced visibility policy.

### Publication and editing policies

- New comments publish by default unless an applicable rule requires moderation.
- Moderator automatic approval is enabled by default and can be disabled or re-enabled by admins and the owner through persisted publication settings.
- Enabled means privileged authors' new comments bypass ordinary publication rules; disabled means ordinary publication rules and applicable exemptions apply.
- Automatic approval never releases a manual hold.
- When disabled, a privileged author cannot explicitly approve their own held comment; another moderator can approve it.
- The server rejects unauthorized setting changes and explicit approval actions.
- By default, only authors can edit comment text.
- When the owner enables admin editing, admins and the owner can edit others’ comments.
- The API rejects cross-author edits by moderators in either mode and rejects attempts by non-owners to change the editing setting.
- Where publication allowlists are implemented, moderator allowlist management is enabled by default; admins and the owner can disable or re-enable it without losing their own allowlist management authority.
- Authorized allowlist managers may manage their own entries and those of other moderators; no special anti-collusion restriction is imposed.
- Publication policy and list membership changes never automatically change existing comments' publication states.

### Notifications

- Administration actions are committed before email delivery is attempted.
- Notification failures or disabled email delivery do not undo successful actions or turn them into failed API responses.
- No additional administration notification event types are required beyond role changes and the specified ownership events.
- New automatically approved comments do not generate moderator or ordinary-subscriber email by default.
- New policy-held comments and edited comments that remain held alert moderators, not ordinary subscribers; approval of a held comment can notify ordinary subscribers where subscriptions exist.
- Notification delivery does not undo successful actions.
- The remaining notification event details, possible resolution notices, and initial release scope for configurable rules remain open.

### Ownership configuration and recovery

- The configured owner has effective privilege 3 and retains admin and moderator access regardless of the stored privilege or legacy `isAdmin` flag.
- An account created for the configured owner stores privilege 2 and retains it when ownership is transferred away, becoming an admin by default.
- Attempts to delete or demote the configured owner account return HTTP 403 and leave the record intact.
- Users cannot gain ownership through profile changes or role changes.
- Rotating the configured password and redeploying restores owner access for an existing account and invalidates the previous password.
- Owner username, email and password cannot be changed through application APIs; the owner can edit non-identity profile details.
- The last-known-owner record detects ownership changes and potential collisions without granting ownership.
- Successful transfers to new accounts update that record and generate administration notices.
- Handling of transfers to existing accounts and unexpected account replacement or disappearance remains open.

## Validation Strategy

Use the corresponding validation group for each implementation slice. Conditional and deferred features are tested when they are implemented.

### Privilege hierarchy and role management

- Unit tests should cover every effective privilege level and its derived predicates, including owner records with a lower stored privilege or legacy `isAdmin: false`.
- Test missing privilege resolving to 0 without rewriting existing accounts, including legacy `isAdmin: true` records; new ordinary accounts storing 0; initialization of a missing stored privilege to 2 for the configured owner; invalid stored values; and owner access without persisting privilege 3.
- Test the iteration-three optional legacy-admin upgrade utility: detection, dry run, default level 1, explicit level 2, exclusion of owner and ordinary accounts, preservation of valid existing privilege values, and idempotent reruns.
- Test promotion from moderator to admin and demotion from admin to either moderator or regular user, including the resulting effective permissions.
- Test moderator appointment by the owner and an admin, removal by the owner and an admin, owner-only admin appointments and demotions, rejection of role changes attempted by a moderator, and rejection of attempts to grant or revoke admin access by an admin.
- Verify that direct API requests cannot assign privilege 3 or bypass role checks through legacy flag inputs.
- Test the shared role-management interface for admin and moderator appointments and demotions, including restricted destination roles.
- Verify appointment enables existing moderation actions and demotion removes lost privileges on subsequent requests.
- Test repeated and concurrent identical assignments, ensuring the role changes once and notification side effects are not duplicated.
- Verify that unauthorized no-op requests cannot bypass permissions and no other administration actions introduce new notification events.
- The API contract and dashboard should agree on who can perform each action.

### Account administration

- Test cross-account administration against the privilege matrix, including account deletion, password changes, and profile and identity updates.
- In particular, verify that an admin cannot modify or delete another admin or the owner through direct API requests, that the owner can administer admins, and that admins can administer lower-privilege accounts subject to the separate role-assignment rules.
- Verify that forbidden requests leave the target unchanged and that ordinary authorized self-service actions remain distinct from cross-account administration.

### Comment lifecycle and moderation

- Exercise the full review flow across multiple discussions.
- Test held-to-approved and approved-to-held transitions and deletion of either state.
- Exercise every row of the approval decision table, including repeated approval requests, automatic approval after an author edit, a changed comment that remains held, and intervening edits that restore identical text.
- Test concurrent edit, deletion and approval operations against the MongoDB conditional update, ensuring no unreviewed held content is published and no deleted comment is restored.
- Verify that no-op approvals do not modify timestamps or repeat publication side effects.
- Verify that deletion records the authenticated deleting account ID and timestamp, removes content, retains the structural comment object, and cannot be reversed through approval.
- Test author deletion and moderator removal, deriving the distinction from the author and deleting account IDs without introducing another state.
- Test imposing a manual hold on an already automatically held comment, explicit approval clearing `heldBy` and `heldReason` atomically, and concurrent edits and manual holds preserving the manual hold.
- Test required non-empty manual hold reasons, policy-generated automatic reasons, automatic reason updates on re-evaluation, preservation of manual reasons across author edits, and replacement of automatic reasons on manual hold.

### Comment visibility and discussion continuity

- Verify that automatic approval also clears active hold metadata, and that reasons are visible only to the author and moderators, including through direct reads, history, placeholders and alternate retrieval paths.
- Test visibility for unauthenticated readers, unrelated authenticated users, authors and privileged users in the discussion tree, direct comment reads, user comment history and site-wide moderation views as applicable.
- Verify that an authenticated returning guest can see their own held comments and reasons under the same author-visibility rule, and an unrecognized visitor cannot.
- Verify that authors see their own held comments in their original tree position, that unauthorized readers cannot access held content through alternate retrieval paths, and that no viewer can retrieve deleted text.
- Test preservation of independently visible descendants beneath deleted or held parents, including nested placeholders without hidden content. Test that manually hidden published leaf comments also retain a public placeholder, without exposing their text or private reason.
- Verify that the server rejects new direct replies to held or deleted comments for every role (including when the parent is held or deleted after the reply form is opened), but permits replies to eligible existing descendants and to a formerly held comment after approval.
- Verify user comment history across multiple discussions and that the moderator queue excludes deleted comments.

### Publication and editing policies

- Test moderator automatic approval with the setting enabled and disabled for moderators, admins and the owner, including bypass of ordinary rules when enabled, ordinary evaluation when disabled, manual holds surviving edits in either mode, prospective-only changes, persistence and runtime changes.
- Test explicit approval of own and other authors' held comments according to the setting and the content-matching policy.
- Verify that admins and the owner can change the setting, moderators and ordinary users cannot, and direct API requests cannot bypass approval authorization.
- Test publish-by-default with no applicable holding rule, automatic holds that can be cleared by qualifying edits, and manual holds that survive edits even when all rules pass or an allowlist applies.
- Test allowlist management with the setting enabled and disabled for each privilege level, including direct API requests, persistence, runtime changes, permitted self-listing and listing of other moderators when authorized, and preservation of existing entries when moderator management is disabled.
- Verify prospective-only application of publication rules and allowlist changes: existing approved and held comments retain their state, while subsequent submissions follow the new policy.
- Test mandatory-review list changes in the same manner if implemented, and edits according to the eventual edit policy.

### Notifications

- Verify that each actual successful role change attempts one notice per intended recipient, including a removed moderator, and that rejected requests and authorized no-op assignments send none.
- Test disabled notifications, provider errors, timeouts and partial delivery failures; verify that the action remains committed, the API reports success, and delivery failures are logged.
- Verify the defined default notification matrix, especially that automatically approved new comments send no notification to moderators or ordinary subscribers, new policy-held comments alert moderators only, and no-op approvals and deletions do not send comment notifications.
- Confirm no held content is sent to ordinary subscribers and email delivery failure does not undo a persisted action.
- Validate remaining notification events once agreed.

### Ownership configuration and recovery

- Verify a newly created owner account stores privilege 2 while deriving privilege 3.
- API integration tests should exercise owner deletion and demotion as both the owner and another admin, confirm HTTP 403, and confirm the record and effective permissions afterward.
- Verify that a moderator cannot demote or delete the owner through a direct API request.
- Test owner initialization, normal restart, credential rotation, protected owner identity fields, permitted owner profile edits, transfer to a previously unused username, and detection of existing-account collisions, mismatched account IDs, missing owner records and conflicting username/email identities.
- Verify that the last-known-owner record is not authoritative for permissions, successful reconciliation updates the baseline, the previous owner loses effective owner access and retains its stored admin privilege by default, the newly created owner stores privilege 2, and concurrent initialization does not process the same change twice.
- Verify notices include the former and new owner on successful transfers and omit secrets.
- Validate the remaining collision cases once their policy is agreed.

## Implementation

This section is reserved for implementation plans, implementation-specific decisions, sequencing and links to the relevant sub-issues. The preceding sections describe the intended system, not a commitment to deliver every feature in the first release.

As implementation is planned, categorize and prioritize the features here. The initial release should deliver a functional end-to-end moderation system without requiring all of the designed or exploratory capabilities at once.

| Category | Meaning |
| --- | --- |
| Essential | Required for the initial functional moderation release |
| Designed but deferrable | Behavior has been agreed, but implementation can follow in a later release |
| Exploratory | Further design discussion is required before implementation can be planned |

The [focused first iteration](#focused-first-iteration--owner-review) establishes the privilege foundation and automatic holds and moderator-authorized review as the first deliverable. Manual holding of published comments follows in iteration two. Moderator appointments using the existing privilege model and the optional legacy-admin upgrade utility follow in iteration three. The detailed assignment of tasks to implementation slices and remaining dependencies is still to be planned. Deferring a feature does not discard its design, and must not weaken the authorization, visibility or other invariants applicable to features that are implemented.

### Implementation tracking

- [#284](https://github.com/rendall/simple-comment/issues/284) — Parent issue for site-wide moderation.
- [#285](https://github.com/rendall/simple-comment/issues/285) — Third iteration: owner-appointed moderators using the iteration-one privilege model, plus the optional legacy-admin upgrade utility; new admin appointments remain deferred.
- [#275](https://github.com/rendall/simple-comment/issues/275) — Administration settings dashboard, deferred with persistent configuration.
- [#286](https://github.com/rendall/simple-comment/issues/286) — Owner credential rotation, tracked independently of the moderation rollout.

Implementation PRs for sub-issues under #284 use `284-build-a-site-wide-comment-moderation-system` as their base branch.

Detailed implementation plans, scope decisions and further sub-issues can be added here as the work is broken down.

## Deferred considerations and possible solutions

This section records ideas for later consideration, not additional initial-release acceptance criteria. When implementation is broken into sub-issues, distinguish essential end-to-end moderation capabilities from nice-to-haves. Features can be deferred without discarding the corresponding design discussion. The focused first iteration sets the initial feature boundary, with detailed implementation slices still to be planned; deferral must not weaken the agreed authorization and visibility invariants.

- **Additional administration notification events:** Consider notifications for consequential policy changes (especially enabling admin editing of other authors' comments), allowlist membership changes, and account deletions. These might aid oversight but could generate excessive email traffic. Prefer a later configurable event/recipient policy or an administration log over adding blanket notices now. No new administration event types are required in the initial design.
- **Administration log:** Consider a persistent, reviewable log in the Administration view recording the action, actor, affected account or resource, and timestamp independently of email delivery. Authorized users could review it even when email is disabled or delivery fails. Access permissions, retention, scope and presentation are TBD.
- **Configurable notifications:** Design notification preferences separately, with attention to event types, recipients, traffic levels, free-tier email limits, and optional notifications that a held comment has already been resolved by another moderator. Preserve the initial default comment notification policy until a separate design changes it.
- **Persistent configuration and ownership lifecycle:** Treat installation-wide runtime configuration as a separate design effort; defer settings UI, administrator appointments, ownership transfer detection and collision handling until later.
- **Additional publication policy features:** The first iteration uses fixed link filtering and an optional private server-side term list. Rule-specific exemptions, global trusted-user and mandatory-review lists, and a configurable rule catalogue may be phased in later.
