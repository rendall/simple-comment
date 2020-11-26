# Guest Authentication Flow

A visitor to a website may not necessarily want to sign up or authenticate to make comments, but may change their mind later. The Guest Authentication Flow accommodates this use-case.

The *identified user* is a user who has a password and can log in from any device. A *guest user* is a user whose credentials are in local storage only and limited to a single device. A visitor who is uncredentialed is considered *public*

A hit to the `/verify` endpoint verifies if a user is *identified* or a *guest* by returning claims represented in the `simple-comment-token` value of its `Cookie` header, or return a `401 Unauthenticated` response.

An uncredentialed user can acquire guest credentials via the `/gauth` endpoint (*guest auth*). These credentials allow a user to create a *guest user* on the `/user` endpoint.

A *guest user* does not have a password and cannot log in, but can comment according to `policy` settings, and can edit non-admin properties like `name` and `email`. *guest auth* credentials are expected to be stored locally in the visitor's browser and reused. The guest user's id is always a `uuid` and therefore an *identifed user* can never have a `uuid` as its id.

If an *identified user* logs in or is created with *guest auth* credentials of a guest user, that guest user can be linked to the *identified* user.
