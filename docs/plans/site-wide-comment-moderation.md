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
- **Admin** — Admins can edit user account details and have all moderator permissions.
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

**Stored versus effective privilege.** Only values 0–2 are valid stored privileges. Level 3 is derived exclusively on the server from the authenticated account's configured owner identity; it is never persisted or assignable through the API. Resolve the effective privilege for each request using the authenticated account's current role:

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

#### Migration

Migrate existing non-owner accounts with `isAdmin: true` to privilege 2; ordinary accounts default to privilege 0. Preserve any already valid stored privilege when rerunning the migration. The configured owner's effective privilege is always 3, independent of the stored value or legacy admin flag. Retire the legacy persisted flags once existing records and all read/write paths have been migrated; retain the derived API predicates. Ensure existing installations preserve their legitimate admin access throughout the migration and that legacy role-update inputs cannot bypass the new authorization rules.

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

### Owner permissions and moderator appointments

The first implementation sub-issue under #284 ([#285](https://github.com/rendall/simple-comment/issues/285)) is to enable the owner and admins to appoint an existing user as a moderator or revoke an existing moderator’s access. The server authorizes and persists both changes. This capability is needed regardless of how the broader moderation dashboard and publication policies are designed, so it can proceed independently of those decisions.

There is one owner for the entire installation. The deployment environment variables specify the owner’s login identifier and password. The server derives effective privilege 3 and `isOwner` from the authenticated account and its configured identity. If login uses an email address, bind ownership to the configured account’s ID so profile edits cannot transfer it. Admin and moderator permissions cannot grant or transfer ownership or change the owner’s configured credentials.

Someone with deployment access can recover the owner account by rotating the password in the environment and rebuilding or redeploying as required by the platform. Recovery must work even when the owner’s database record already exists. Today, the environment password only bootstraps a missing owner record. An existing record uses its stored password hash, so deployment-based rotation requires the fix tracked in [#286](https://github.com/rendall/simple-comment/issues/286).

Use the target account's ID to protect the owner's record. Reject any attempt to delete or demote the owner with HTTP 403, regardless of who makes the request. Derive the owner's effective privilege from ownership so neither a lower stored privilege nor a legacy `isAdmin: false` can lock the owner out.

### Role management dashboard

Add an **Administration** tab alongside the existing **Discussion** view in the comment widget. The discussion tree remains the default. The tab opens the dashboard in the widget under a **Site administration** heading so it is clear that the roster and role changes apply across the installation. Other widget views can be designed later.

The owner, admins, and moderators can open the tab and see the site owner, current admins, and current moderators, with each account listed once under its highest role. Moderators can view the roster. The owner and admins also see the role-management actions their permissions allow.

If the widget becomes too cramped for future administration workflows, a dedicated route can be considered with the widget as an entry point. A reserved discussion topic is outside this design.

The owner and admins can search for existing accounts with a searchable combobox that filters as they type and shows usernames alongside display names. Selecting an account fills the selection. An explicit **Appoint** action applies the change immediately. Admins can appoint moderators, and the owner can appoint either admins or moderators.

Show demotion on the roster only where the viewer has authority over the target role. For admin demotion, the owner can choose moderator or regular user as the destination role. Moderator demotion assigns regular user. Confirm the action with the person’s name and the access they will lose. Enforce the same permissions for direct API requests.

Treat successful admin and moderator appointments and demotions as administration actions. Notify all current moderators, all current admins, the site owner, and the affected person, including someone just demoted. Send one notice per person identifying who made the change, whose access changed, and which access was granted or revoked.

### Administration settings

Add a **Settings** section to the Administration tab. Admins and the owner can manage day-to-day moderation settings, such as which comments are held for review. Only the site owner can change settings that grant or revoke permissions.

By default, only authors can edit their own comments. The owner can enable editing of other users’ comments for admins. The owner inherits that permission when it is enabled. Moderators can hold or delete comments and ask authors to revise them. The server enforces the current editing policy on every update, including direct API requests.

If owners need to delegate control of permission settings later, consider delegation for specific settings or groups of settings.

### Site-wide comment review

After owner permissions and appointments, design a moderator view with **Held for review** and **All recent comments**. Both views should show comment status and link to the discussion. Moderators can approve or reject held comments and can delete a published comment or withdraw its approval and hold it from public view so the author can revise it. By default, only the author can edit the text. The current comment update API allows admins to edit other users’ comments. Apply the owner-controlled editing setting in both the backend and the widget. See #275.

Track whether a comment is approved for publication. An `isApproved` flag is one option. A comment can start approved or held according to policy, and an edit that triggers review can cause approval to be withdrawn. Held comments stay private until approved. The default publication policy and the exact handling of edited comments and replies remain open. Use #241 for prior investigation and check whether #63 offers a starting point.

### Publication policy and notifications

Every applicable publication rule answers **Should this comment be published?** A rule returns `true` when it permits immediate publication and `false` when it requires moderation. Publish immediately only if every applicable rule returns `true`. A single `false` holds the comment for review. The developer-provided filter follows the same convention.

An allowlist can exempt an account from a rule where that rule explicitly supports exemptions. An allowlist match cannot override a `false` returned by another applicable rule. Which rules support exemptions remains open.

A later iteration may add account-level overrides before evaluating publication rules. A **trusted-user allowlist** would publish comments immediately by bypassing all publication rules. Admins could remove a user from that list if they misuse the exception, and moderators could still act on published comments. A **mandatory-review list** would hold every comment from a listed user until a moderator explicitly approves it. If an account is on both lists, mandatory review takes precedence.

Explore settings that hold all comments from guests or new accounts, publish by default, or hold comments that match rules such as links or selected words or phrases. Decide whether trusted users and moderators qualify for automatic approval. Coordinate policy settings and enforcement with #275.

Define how the existing notifications fit this workflow. Decide when moderators hear about held comments and when public comment notifications should go out. Coordinate with #248 when considering what happens after a comment is edited.

## Out of Scope

This draft leaves reader reports, appeals, bulk actions, IP blocking, and shadowbanning as possible follow-ups. Their priority and scope are open.

## Open Questions


- What should the installation publish or hold by default, and how should edits and replies be handled?
- Which policy settings and notifications are essential to completing #284?

## Draft Acceptance Criteria

The configured owner has effective privilege 3 and retains admin and moderator access regardless of the stored privilege or legacy `isAdmin` flag. Non-owner accounts store exactly one privilege in the range 0–2; the API derives the role predicates from the effective privilege. Attempts to delete or demote that account return HTTP 403 and leave the record intact. Users cannot gain ownership through profile changes or role changes. Rotating the configured password and redeploying restores owner access for an existing account and invalidates the previous password.

The owner and admins can appoint and remove moderators. Only the owner can appoint and demote admins; admin demotion explicitly assigns privilege 1 or 0. The API rejects attempts by moderators to appoint, create, or remove another moderator, attempts by admins to grant or revoke admin access, and attempts to assign owner privilege or invalid privilege values. Existing admin accounts migrate to privilege 2 and ordinary accounts to privilege 0. The final permission model will define which actions become available on appointment and which are lost on revocation.

A designated moderator can see held and recent comments across multiple discussions in one place. Approving a held comment makes it public, rejecting it keeps it private, and moderators can hold or delete published comments. By default, only authors can edit comment text. When the owner enables admin editing, admins and the owner can edit others’ comments. The API rejects cross-author edits by moderators in either mode and rejects attempts by non-owners to change the editing setting. The initial release scope for configurable rules and notifications remains open for discussion.

## Validation Strategy

Unit tests should cover every effective privilege level and its derived predicates, including owner records with a lower stored privilege or legacy `isAdmin: false`. Test migration of existing admin and ordinary accounts, migration reruns, rejection of invalid stored privileges, and preservation of owner access without persisting privilege 3. Test promotion from moderator to admin and demotion from admin to either moderator or regular user, including the resulting effective permissions. API integration tests should exercise owner deletion and demotion as both the owner and another admin, confirm HTTP 403, and confirm the record and effective permissions afterward. Test moderator appointment by the owner and an admin, removal by the owner and an admin, owner-only admin appointments and demotions, rejection of role changes attempted by a moderator, and rejection of attempts to grant or revoke admin access by an admin. Verify that direct API requests cannot assign privilege 3 or bypass role checks through legacy flag inputs. Verify that each successful change sends one notice per intended recipient, including a removed moderator, and that rejected requests send none. Verify that a moderator cannot demote or delete the owner through a direct API request. The API contract and dashboard should agree on who can perform each action.

Exercise the full review flow across multiple discussions. Verify that public comment reads exclude held and rejected comments, approval makes a comment visible, and direct API requests apply the same permissions as the moderator view. Once policy and notification behavior are agreed, verify that rules produce the expected publication state and notifications follow that state.

Implementation PRs for sub-issues under #284 use `284-build-a-site-wide-comment-moderation-system` as their base branch.
