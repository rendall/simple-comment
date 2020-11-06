// post to auth with incorrect credentials should return error 401
// post to auth with correct credentials should return authtoken

// post to user with identical credentials should return 425 Possible duplicate user
// post to user too quickly should return 425 too early
// post to user with improper credentials and admin-only-create-user policy should return 401
// post to user should return user and 201 User created

// get to /user with no credentials and public-can-view-users set to false should return 401
// get to /user with improper credentials and users-can-view-users false should return 403
// get to /user should return array of users

// delete to /user/{userId} with no credentials should return 401
// delete to /user/{userId} with improper credentials should return 403
// delete to /user/{userId} where userId does not exist and admin credentials should return 404
// delete to /user/{userId} should delete user and return 202 User deleted

// put to /user/{userId} with no credentials should return 401
// put to /user/{userId} with improper credentials should return 403
// put to /user/{userId} with own credentials should alter user return 204 User updated
// put to /user/{userId} with admin credentials should alter user return 204 User updated
// put to /user/{userId} where userId does not exist and admin credentials should return 404

// get to /user/{userId} with no credentials and public-view-users set to false should return 401
// get to /user/{userId} without admin credentials and admin-only-view-users should return 403
// get to /user/{userId} where userId does not exist should return 404
// get to /user/{userId} should return User and 200

// delete to /discussion/{discussionId}/{commentId} with no credentials should return 401
// delete to /discussion/{discussionId}/{commentId} with improper credentials should return 403
// delete to /discussion/{discussionId}/{commentId} where either Id does not exist should return 404 and indicate which does not exist
// delete to /discussion/{discussionId}/{commentId} should delete the comment and return 202 Comment deleted

// put to /discussion/{discussionId}/{commentId} with no credentials should return 401
// put to /discussion/{discussionId}/{commentId} with improper credentials should return 403
// put to /discussion/{discussionId}/{commentId} where either Id does not exist should return 404 and indicate which does not exist
// put to /discussion/{discussionId}/{commentId} should return the edited comment with 202 Comment updated

// get to /discussion/{discussionId}/{commentId} with no credentials and public-view-discussion false should return 401
// get to /discussion/{discussionId}/{commentId} with improper credentials and public-view-discussion false should return 403
// get to /discussion/{discussionId}/{commentId} where either Id does not exist should return 404 and indicate which does not exist
// get to /discussion/{discussionId}/{commentId} should return the comment with 200 OK

// delete to /discussion/{discussionId} with no credentials should return 401
// delete to /discussion/{discussionId} with improper credentials should return 403
// delete to /discussion/{discussionId} where Id does not exist should return 404 
// delete to /discussion/{discussionId} should delete the discussion and return 202 Discussion deleted

// post to /discussion/{discussionId} with improper credentials and public-can-post-comment false policy should return 401
// post to /discussion/{discussionId} too often should return 429 Too many comments
// post to /discussion/{discussionId} with identical information should return 425 Possible duplicate comment
// post to /discussion/{discussionId} with too long comment should return 413 Comment too long
// post to /discussion/{discussionId} should return comment and 201 Comment created

// get to /discussion with no credentials and policy should return 401
// get to /discussion with improper credentials and policy should return 403
// get to /discussion should return a list of discussions and 200 OK

// post to /discussion with no credentials and public-can-create-discussion false policy should return 401
// post to /discussion with improper credentials and user-can-create-discussion false policy should return 403
// post to /discussion too often should return 429 Too much discussion
// post to /discussion with identical information should return 425 Discussion already exists
// post to /discussion should return Discussion object and 201 Discussion created


