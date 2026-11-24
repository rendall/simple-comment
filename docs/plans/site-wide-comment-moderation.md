# Site-wide comment moderation

Status — Draft for discussion

Parent issue — [#284](https://github.com/rendall/simple-comment/issues/284)

## Goal

Build a site-wide moderation system so an installation owner can appoint moderators and those moderators can manage comments across all discussions.

## Plain-Language Intent

The person configured to own the discussion keeps control of it. The owner and existing moderators can appoint users to help moderate. The owner can revoke that access. Nobody can delete the owner's account or take away its admin access through the API. Moderators can see comments from across the site in one place, review comments before they appear publicly, and act on comments that are already public.

## Current behavior

The environment-configured Simple Comment Moderator account is created with `isAdmin: true`. The user-delete API already blocks deletion when the target is that account. The user-update API checks the caller's ID when applying its special protection, which lets another admin clear the configured account's stored admin flag. Comment actions such as deleting someone else's comment rely on the stored flag.

See [account creation](../../src/lib/MongodbService.ts#L349), [user updates](../../src/lib/MongodbService.ts#L460), [user deletion](../../src/lib/MongodbService.ts#L532), and [comment deletion](../../src/lib/MongodbService.ts#L1039).

## In Scope

### Owner permissions and moderator appointments

The first implementation sub-issue under #284 ([#285](https://github.com/rendall/simple-comment/issues/285)) is to enable the owner and existing moderators to appoint an existing user as a moderator. It should deliver a working appointment flow that the server authorizes and persists. This capability is needed regardless of how the broader moderation dashboard and publication policies are designed, so it can proceed independently of those decisions.

Treat the existing environment-configured account as the owner of the installation and its discussions. The server derives `isOwner` from the authenticated account's ID and the configured owner identity. If configuration identifies the owner by email, bind that identity to the account ID so ordinary profile edits cannot transfer ownership.

Use the target account's ID to protect the owner's record. Reject any attempt to delete the owner or clear its admin access with HTTP 403, regardless of who makes the request. Derive the owner's effective admin access from ownership so a stored `isAdmin: false` from an earlier update cannot lock the owner out.

The owner dashboard should let the owner see who currently has moderator access, appoint an existing user, and revoke an appointment. Provide an appointment flow for existing moderators as well. Enforce appointment permissions on the server, including for direct API requests. Whether moderators can revoke another moderator’s access remains open.

### Site-wide comment review

After owner permissions and appointments, design a moderator view with **Held for review** and **All recent comments**. Both views should show comment status and link to the discussion. Design how moderators approve or reject held comments and act on published comments. A held comment stays private until approved. Use #241 for prior investigation and check whether #63 offers a starting point.

### Publication policy and notifications

Explore settings that hold all comments from guests or new accounts, publish by default, or hold comments that match rules such as links or selected words or phrases. Decide whether trusted users and moderators qualify for automatic approval. Coordinate policy settings and enforcement with #275.

Define how the existing notifications fit this workflow. Decide when moderators hear about held comments and when public comment notifications should go out. Coordinate with #248 when considering what happens after a comment is edited.

## Out of Scope

This draft leaves reader reports, appeals, bulk actions, IP blocking, and shadowbanning as possible follow-ups. Their priority and scope are open.

## Open Questions

- Should moderator appointments use a distinct permission or build on `isAdmin`? Existing admins have powers beyond comment moderation, including updating other user accounts.
- How should existing admin access relate to moderator appointment authority? The design needs to account for the existing user-update API as well as the dashboard.
- What is the intended way to change the configured owner, and how should installations recognize the same owner during an upgrade?
- Should owner identity and appointment authority apply to the entire installation, as assumed here, or can individual discussions have their own owners?

- Which actions on published comments should the first release support?
- What should the installation publish or hold by default, and how should edits and replies be handled?
- Which policy settings and notifications are essential to completing #284?

## Draft Acceptance Criteria

The configured owner retains admin access even when an existing record has `isAdmin: false`. Attempts to delete or demote that account return HTTP 403 and leave the record intact. Users cannot gain ownership through profile changes.

The owner and existing moderators can appoint moderators. The owner can revoke moderator access. The API rejects appointment requests from users who have neither ownership nor moderator authority. The final permission model will define which actions become available on appointment and which are lost on revocation.

A designated moderator can see held and recent comments across multiple discussions in one place. Approving a held comment makes it public, rejecting it keeps it private, and moderators can act on published comments. The initial release scope for configurable rules and notifications remains open for discussion.

## Validation Strategy

Unit tests should distinguish owner identity from a stored admin flag and cover an owner record whose flag is false. API integration tests should exercise owner deletion and demotion as both the owner and another admin, confirm HTTP 403, and confirm the record and effective permissions afterward. Test appointment by the owner and a moderator, rejection for users without appointment authority, and revocation by the owner. Verify that a moderator cannot demote or delete the owner through a direct API request. The API contract and dashboard should agree on who can perform each action.

Exercise the full review flow across multiple discussions. Verify that public comment reads exclude held and rejected comments, approval makes a comment visible, and direct API requests apply the same permissions as the moderator view. Once policy and notification behavior are agreed, verify that rules produce the expected publication state and notifications follow that state.

Implementation PRs for sub-issues under #284 use `284-build-a-site-wide-comment-moderation-system` as their base branch.
