# Temporary User Flow

A visitor to a website may not necessarily want to sign up or authenticate to make comments, but may change their mind later. The Temporary User Flow accommodates this use-case.

The *identified user* is a user who has a password and can log in from any device. A *temporary user* is a user whose credentials are in local storage only and limited to a single device.

A hit to the `/verify` endpoint will verify if a user is identified by returning claims represented in the `simple-comment-token` value of its `Cookie` header, or return a `204 No Content` response.

A comment post that has no user can get temporary credentials from `/auth/temp`. These credentials do not allow a user to log in, but do allow comment posts and other public activity according to `policy`. These credentials are expected to be stored locally in the visitor's browser and reused. The temporary user's id is always a `uuid` and therefore an authenticated user can never have a `uuid` as its id

When a user logs in (authenticates) or creates a new authenticated user, but using the `authId` of a temporary user, that temporary user becomes linked to the permanent user.