# Site-wide comment moderation

Status — Draft for discussion

Parent issue — [#284](https://github.com/rendall/simple-comment/issues/284)

## Goal

Build a site-wide moderation system so an installation owner can appoint moderators and those moderators can manage comments across all discussions.

## Plain-Language Intent

The configured site owner controls the entire Simple Comment installation and all its discussions. The owner can appoint admins and revoke admin or moderator access. The owner and admins can appoint moderators. Nobody can delete the owner's account or take away its admin access through the API. Moderators can see comments from across the site in one place, review comments before they appear publicly, and act on comments that are already public.

### Intended role hierarchy

The full moderation system has three privileged roles. Each role inherits the permissions of the roles below it. This describes the intended system across releases.

- **Owner** — The site owner is the account configured through deployment environment variables and has all admin and moderator permissions. The API protects the owner account from deletion and demotion.
- **Admin** — Admins can edit user account details and have all moderator permissions.
- **Moderator** — Moderators can review, hide, or delete comments. Editing another person's comment, if supported, is a comment-level permission whose policy still needs to be settled with #275. Moderators cannot edit user account details.

Only the owner can appoint admins or demote admins. The owner and admins can appoint moderators. The owner can demote moderators. Moderators cannot appoint, create, or demote other moderators. Whether admins can demote moderators remains open.

## Current behavior

The environment-configured Simple Comment Moderator account is created with `isAdmin: true`. The user-delete API already blocks deletion when the target is that account. The user-update API checks the caller's ID when applying its special protection, which lets another admin clear the configured account's stored admin flag. Comment actions such as deleting someone else's comment rely on the stored flag.

See [account creation](../../src/lib/MongodbService.ts#L349), [user updates](../../src/lib/MongodbService.ts#L460), [user deletion](../../src/lib/MongodbService.ts#L532), and [comment deletion](../../src/lib/MongodbService.ts#L1039).

## In Scope

### Owner permissions and moderator appointments

The first implementation sub-issue under #284 ([#285](https://github.com/rendall/simple-comment/issues/285)) is to enable the owner and admins to appoint an existing user as a moderator and the owner to revoke moderator access. The server authorizes and persists both changes. This capability is needed regardless of how the broader moderation dashboard and publication policies are designed, so it can proceed independently of those decisions.

There is one owner for the entire installation. The deployment environment variables specify the owner’s login identifier and password. The server derives `isOwner` from the authenticated account and its configured identity. If login uses an email address, bind ownership to the configured account’s ID so profile edits cannot transfer it. Admin and moderator permissions cannot grant or transfer ownership or change the owner’s configured credentials.

Someone with deployment access can recover the owner account by rotating the password in the environment and rebuilding or redeploying as required by the platform. Recovery must work even when the owner’s database record already exists. Today, the environment password only bootstraps a missing owner record. An existing record uses its stored password hash, so deployment-based rotation requires an implementation change.

Use the target account's ID to protect the owner's record. Reject any attempt to delete the owner or clear its admin access with HTTP 403, regardless of who makes the request. Derive the owner's effective admin access from ownership so a stored `isAdmin: false` from an earlier update cannot lock the owner out.

The owner dashboard should let the owner see who currently has moderator access, appoint an existing user, and revoke an appointment. Provide a moderator appointment flow for admins as well. Enforce both permissions on the server, including for direct API requests.

After each successful grant or revocation, notify all current moderators, the owner, and the person whose access changed. Send one notice per person, including an affected moderator who was just removed. The notice identifies who made the change, whose access changed, and whether access was granted or revoked.

### Site-wide comment review

After owner permissions and appointments, design a moderator view with **Held for review** and **All recent comments**. Both views should show comment status and link to the discussion. Design how moderators approve or reject held comments and act on published comments. A held comment stays private until approved. Use #241 for prior investigation and check whether #63 offers a starting point.

### Publication policy and notifications

Explore settings that hold all comments from guests or new accounts, publish by default, or hold comments that match rules such as links or selected words or phrases. Decide whether trusted users and moderators qualify for automatic approval. Coordinate policy settings and enforcement with #275.

Define how the existing notifications fit this workflow. Decide when moderators hear about held comments and when public comment notifications should go out. Coordinate with #248 when considering what happens after a comment is edited.

## Out of Scope

This draft leaves reader reports, appeals, bulk actions, IP blocking, and shadowbanning as possible follow-ups. Their priority and scope are open.

## Open Questions

- How should the distinct moderator role be stored and introduced alongside the existing `isAdmin` flag?
- How should existing admins inherit moderator permissions during the rollout? The design needs to account for the existing user-update API as well as the dashboard.
- How should upgrades bind the existing owner account and apply deployment-configured password changes?

- Which actions on published comments should the first release support?
- What should the installation publish or hold by default, and how should edits and replies be handled?
- Which policy settings and notifications are essential to completing #284?

## Draft Acceptance Criteria

The configured owner retains admin access even when an existing record has `isAdmin: false`. Attempts to delete or demote that account return HTTP 403 and leave the record intact. Users cannot gain ownership through profile changes or role changes. Rotating the configured password and redeploying restores owner access for an existing account and invalidates the previous password.

The owner and admins can appoint moderators, and the owner can remove moderators. The API rejects attempts by moderators to appoint, create, or remove another moderator. The final permission model will define which actions become available on appointment and which are lost on revocation.

A designated moderator can see held and recent comments across multiple discussions in one place. Approving a held comment makes it public, rejecting it keeps it private, and moderators can act on published comments. The initial release scope for configurable rules and notifications remains open for discussion.

## Validation Strategy

Unit tests should distinguish owner identity from a stored admin flag and cover an owner record whose flag is false. API integration tests should exercise owner deletion and demotion as both the owner and another admin, confirm HTTP 403, and confirm the record and effective permissions afterward. Test moderator appointment by the owner and an admin, removal by the owner, and rejection of role changes attempted by a moderator. Verify that each successful change sends one notice per intended recipient, including a removed moderator, and that rejected requests send none. Verify that a moderator cannot demote or delete the owner through a direct API request. The API contract and dashboard should agree on who can perform each action.

Exercise the full review flow across multiple discussions. Verify that public comment reads exclude held and rejected comments, approval makes a comment visible, and direct API requests apply the same permissions as the moderator view. Once policy and notification behavior are agreed, verify that rules produce the expected publication state and notifications follow that state.

Implementation PRs for sub-issues under #284 use `284-build-a-site-wide-comment-moderation-system` as their base branch.
