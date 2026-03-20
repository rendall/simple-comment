# Priority 3 Test Survey

Status: active planning artifact (non-executable)

This document is a first-pass survey for Priority 3: Test Suite Signal Quality.

It is not an approved implementation checklist and does not authorize test changes by itself.

Each table is organized by test file.

- Column 1 records the current test copy.
- Column 2 is a placeholder for later decision-tracking.

## src/tests/backend/MongodbService.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| POST to auth with unknown credentials should return error 404 | TBD |
| POST to auth with incorrect password should 401 | TBD |
| POST to auth with user id and correct password should return auth token | TBD |
| POST to auth with email and correct password should return auth token | TBD |
| POST to auth with hardcoded credentials should return auth token | TBD |
| POST to /user with id should return user with same id and 201 User created | TBD |
| POST to /user without id should return 400: Invalid user id 'undefined' | TBD |
| POST to /user with guest id and admin credentials should fail | TBD |
| POST to /user with guest id and same credentials should succeed | TBD |
| POST to /user without credentials should create user | TBD |
| POST to /user with admin-only properties without credentials should error 403 | TBD |
| POST to /user with admin-only properties without admin credentials should error 403 | TBD |
| POST to /user without admin credentials should fail | TBD |
| POST to /user without admin credentials should fail | TBD |
| POST to /user with a guestUserId as targetId should fail | TBD |
| POST to /user with existing username should return 409 user exists | TBD |
| GET to /auth with newly created user should return authtoken | TBD |
| GET to /user/{userId} where userId does not exist should return 404 | TBD |
| GET to /user/{userId} should return User and 200 | TBD |
| GET to /user should return list of users | TBD |
| GET to /user with admin credentials can return list of users with email | TBD |
| GET get to /user/{userId} should return user | TBD |
| GET to /user/{userId} with public user | TBD |
| PUT to /user/{userId} with no credentials should return 401 | TBD |
| PUT to /user/{userId} with improper credentials should return 403 | TBD |
| PUT to /user/{userId} with public, own credentials cannot modify isAdmin | TBD |
| PUT to /user/{userId} with public, own credentials cannot modify isVerified | TBD |
| PUT to /user/{userId} with own credentials should alter user return 204 User updated | TBD |
| PUT to /user/{userId} with very long password should not timeout | TBD |
| PUT to /user/{userId} with invalid name, email, password should fail | TBD |
| PUT to /user/{userId} with admin credentials should alter user return 204 User updated | TBD |
| Admins should be able to modify guest users | TBD |
| Guest users should never be made into admins | TBD |
| PUT to /user/{userId} where userId does not exist (and admin credentials) should return 404 | TBD |
| DELETE to /user/{userId} with no credentials should return 401 | TBD |
| DELETE to /user/{userId} with improper credentials should return 403 | TBD |
| DELETE to /user/{userId} where userId does not exist and admin credentials should return 404 | TBD |
| DELETE to /user/{userId} with hardcoded admin userId should return 403 | TBD |
| DELETE to /user/{userId} should delete user and return 202 User deleted | TBD |
| DELETE to /user/{userId} by self | TBD |
| POST comment to comment to /discussion/{discussionId} with too long comment should return 413 Comment too long | TBD |
| POST comment to /comment/{commentId} should return comment and 201 Comment created | TBD |
| POST comment to /comment/{commentId} without credentials should fail | TBD |
| POST comment to /comment/{commentId} with identical information within a short length of time should return 425 Possible duplicate comment | TBD |
| GET comment to /comment/{commentId} where commentId does not exist should return 404 | TBD |
| GET comment to /comment/{commentId} should return the comment with 200 OK | TBD |
| PUT comment to /comment/{commentId} with no credentials should return 401 | TBD |
| PUT comment to /comment/{commentId} with improper credentials should return 403 | TBD |
| PUT comment to /comment/{commentId} where Id does not exist should return 404 | TBD |
| PUT comment to /comment/{commentId} should return the edited comment with 202 Comment updated | TBD |
| DELETE comment to /comment/{commentId} with no credentials should return 401 | TBD |
| DELETE comment to /comment/{commentId} with improper credentials should return 403 | TBD |
| DELETE comment to /comment/{commentId} where Id does not exist should return 404 | TBD |
| DELETE comment to /comment/{commentId} by an admin should delete the comment and return 202 Comment deleted | TBD |
| DELETE comment to /comment/{commentId} by the user should delete the comment and return 202 Comment deleted | TBD |
| POST to /topic with no credentials and policy.canPublicCreateTopic===false | TBD |
| POST to /topic with improper credentials should return 403 | TBD |
| POST to /topic should return Discussion object and 201 Discussion created | TBD |
| GET to /topic should return a list of topics and 200 OK | TBD |
| GET to /topic/{topicId} should return a topic and descendent comments | TBD |
| PUT topic  to /topic/{topicId} editing anything except title or isLocked should be ignored | TBD |
| PUT topic to /topic/{topicId} with no credentials should return 401 | TBD |
| PUT topic to /topic/{topicId} with improper credentials should return 403 | TBD |
| PUT to /topic/{topicId} where Id does not exist should return 404 | TBD |
| PUT topic with {topicId} to /topic/{topicId} should return topic and 204 Discussion updated | TBD |
| DELETE topic to /topic/{topicId} with no credentials should return 401 | TBD |
| DELETE topic to /topic/{topicId} with improper credentials should return 403 | TBD |
| DELETE to /topic/{topicId} where Id does not exist should return 404 | TBD |
| DELETE to /topic/{topicId} should delete the topic and return 202 Discussion deleted | TBD |
| DELETE topic to /topic/{topicId} should delete descended comments | TBD |

## src/tests/backend/SendGridNotificationService.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| should set API key | TBD |
| should use environmental variable for API key | TBD |
| should handle email sending failure | TBD |
| should throw given empty moderator contact emails | TBD |
| should throw given undefined moderator contact emails | TBD |
| should allow moderator contact email override when env value is missing | TBD |
| should allow API key override when env API key is missing | TBD |
| should send notification to moderators | TBD |
| should send mulitple emails given comma-separated SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL | TBD |

## src/tests/backend/api.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| simple-comment-openapi3.json exists | TBD |
| topicGET should be defined in AbstractDbService | TBD |
| topicPOST should be defined in AbstractDbService | TBD |
| topicGET should be defined in AbstractDbService | TBD |
| topicPUT should be defined in AbstractDbService | TBD |
| topicDELETE should be defined in AbstractDbService | TBD |
| commentPOST should be defined in AbstractDbService | TBD |
| commentGET should be defined in AbstractDbService | TBD |
| commentPUT should be defined in AbstractDbService | TBD |
| commentDELETE should be defined in AbstractDbService | TBD |
| userGET should be defined in AbstractDbService | TBD |
| userPOST should be defined in AbstractDbService | TBD |
| userGET should be defined in AbstractDbService | TBD |
| userPUT should be defined in AbstractDbService | TBD |
| userDELETE should be defined in AbstractDbService | TBD |
| authPOST should be defined in AbstractDbService | TBD |
| authDELETE should be defined in AbstractDbService | TBD |
| gauthGET should be defined in AbstractDbService | TBD |
| verifyGET should be defined in AbstractDbService | TBD |
| non existent method on AbstractDbService should fail | TBD |

## src/tests/backend/crypt.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| Get Expiration time | TBD |
| Test auth token | TBD |

## src/tests/backend/env-utils.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| ignores blank lines and full-line comments while preserving entry order | TBD |
| uses the first equals sign as the key/value separator | TBD |
| fails fast when a non-comment line is missing "=" | TBD |
| fails fast when a key is blank | TBD |
| fails fast on duplicate keys | TBD |
| classifies SECRET and PASSWORD keys as sensitive | TBD |
| builds deterministic secret replacement values | TBD |

## src/tests/backend/mongoDb.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| should insert a doc into collection | TBD |

## src/tests/backend/normalizeUrl.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| should handle URLs without any of the stripped elements | TBD |
| should strip protocol https:// | TBD |
| should strip protocol http:// | TBD |
| should strip authentication part of the URL | TBD |
| should strip hash part of the URL | TBD |
| should remove www. from the URL | TBD |
| should remove all query parameters | TBD |
| should remove trailing slash | TBD |
| should remove a sole / pathname in the output | TBD |
| should remove multiple /// | TBD |
| should remove default directory index file from path that matches provided regex | TBD |
| should remove default port number from the URL | TBD |
| should not remove explicit port number from the URL | TBD |
| should handle URLs with all of the stripped elements | TBD |

## src/tests/backend/policyEnforcement.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| should not post comment | TBD |
| should post comment | TBD |

## src/tests/backend/secrets.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| example.env exists | TBD |
| example.env has information | TBD |
| SIMPLE_COMMENT_MODERATOR_CONTACT_EMAIL is defined as an environmental variable | TBD |
| SIMPLE_COMMENT_MODERATOR_ID is defined as an environmental variable | TBD |
| SIMPLE_COMMENT_MODERATOR_PASSWORD is defined as an environmental variable | TBD |
| JWT_SECRET is defined as an environmental variable | TBD |
| ALLOW_ORIGIN is defined as an environmental variable | TBD |
| DATABASE_ADMIN_PASSWORD is defined as an environmental variable | TBD |
| DATABASE_NAME is defined as an environmental variable | TBD |
| DB_CONNECTION_STRING is defined as an environmental variable | TBD |
| IS_CROSS_SITE is defined as an environmental variable | TBD |
| SIMPLE_COMMENT_API_URL is defined as an environmental variable | TBD |
| SIMPLE_COMMENT_MODERATOR_PASSWORD is not easyToRememberHardToGuessLikeABC123 | TBD |
| JWT_SECRET is not secret-key-looks-like-aXvEQ572fvOMvQQ36K2i2PE0bwEMg9qpqBWlnPhsa5OMF1vl9NyI3TxRH0DK | TBD |
| DATABASE_ADMIN_PASSWORD is not data-base-admin-password | TBD |

## src/tests/backend/setup-env.contract.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| injects missing non-sensitive keys from example env entries | TBD |
| injects deterministic non-default values for unset sensitive keys | TBD |
| replaces sensitive defaults when process.env still matches example env | TBD |
| does not overwrite pre-set non-default values | TBD |
| uses the shared sensitive-key classifier during bootstrap | TBD |

## src/tests/backend/utilities.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| should return {headers} if there is a header match | TBD |
| should return {} if there is no header match | TBD |
| should return { 'Access-Control-Allow-Origin': '*' } if allowed origin includes * | TBD |
| isGuestId should pass id from generateGuestId | TBD |
| generates a comment ID with a given parent ID | TBD |
| has parent id in string | TBD |
| generates a comment ID without a parent ID | TBD |
| generates a valid comment even with Date(0, 0) | TBD |
| generates unique comment IDs | TBD |
| good validateUserId | TBD |
| guestId is validateUserId | TBD |
| incorrect characters in validateUserId | TBD |
| not enough characters in validateUserId | TBD |
| too many characters in validateUserId | TBD |
| bad email should fail | TBD |
| good email should pass | TBD |
| should handle URLs with hash, query parameters, and directory index | TBD |
| should handle URLs without any of the stripped elements | TBD |
| should parse correctly | TBD |
| should decode URI components | TBD |
| should handle empty strings | TBD |
| should handle keys without values | TBD |
| should handle values without keys | TBD |
| should throw an error for malformed URI sequences | TBD |
| should add headers to a response without a body | TBD |
| should add headers and stringify a JSON body | TBD |
| should add headers and leave a string body as is | TBD |
| isApiError should detect API-style error objects | TBD |
| toApiError should return fallback for unknown errors | TBD |
| toApiError should keep API-style errors | TBD |
| toErrorBody should normalize unknown values to strings | TBD |

## src/tests/frontend/blockies.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| should return a different number for different seeds | TBD |
| 1 should return identical results | TBD |
| 2 should return identical results | TBD |
| 3 should return identical results | TBD |
| 4 should return identical results | TBD |
| 5 should return identical results | TBD |
| 6 should return identical results | TBD |
| 1 should return different results | TBD |
| 2 should return different results | TBD |
| 3 should return different results | TBD |
| should return deterministic results | TBD |
| should return a string | TBD |
| should return a different color for different seeds | TBD |
| should return deterministic results | TBD |
| should return an array | TBD |
| should return a different array for different seeds | TBD |

## src/tests/frontend/discussion.xstate.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| init state should be 'idle' | TBD |
| loading state should allow only actions SUCCESS or ERROR | TBD |
| creating state should allow only actions SUCCESS or ERROR | TBD |
| 'created' state should always transition to 'loading' | TBD |
| loaded state should allow only action LOAD | TBD |
| error state should allow only actions RETRY or CREATE | TBD |
| loading with SUCCESS should transition to state `loaded` | TBD |
| loading with ERROR should transition to state `error` | TBD |
| creating with SUCCESS should transition to state `created` | TBD |
| creating with ERROR should transition to state `error` | TBD |
| loaded with LOAD should transition to state `loading` | TBD |
| error with RETRY should transition to state `loading` | TBD |
| error with CREATE should transition to state `creating` | TBD |

## src/tests/frontend/frontend-utilities.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| should thread comments correctly | TBD |
| should thread mockDiscussion.json in under 0.1s | TBD |
| should thread flat array of 2000 comments in under 1s | TBD |
| calls as expected | TBD |
| does not call immediately | TBD |
| never calls callback if continuously called | TBD |
| calls after its wait time | TBD |
| calls once only after debounce ends | TBD |
| should handle undefined date | TBD |
| should handle invalid date | TBD |

## src/tests/frontend/hello-world.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| adds 1 + 2 to equal 3 | TBD |

## src/tests/frontend/login.xstate.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| init state should be 'verifying' | TBD |
| loggingIn state should allow only actions SUCCESS or ERROR | TBD |
| signingUp state should allow only actions SUCCESS or ERROR | TBD |
| loggedIn state should allow only action LOGOUT | TBD |
| loggingOut state should allow only actions SUCCESS, CONFIRM, CANCEL, SIGNUP or ERROR | TBD |
| loggedOut state should allow only actions 'LOGIN', 'SIGNUP', 'GUEST', 'ERROR' | TBD |
| error state should allow only actions '*' and LOGOUT | TBD |
| verifying state should allow only actions SUCCESS, ERROR or FIRST_VISIT | TBD |
| verifying with SUCCESS should transition to state `loggedIn` | TBD |
| verifying with ERROR should transition to state `error` | TBD |
| loggingIn with SUCCESS should transition to state `verifying` | TBD |
| signingUp with SUCCESS should transition to state `loggingIn` | TBD |
| loggingIn with ERROR should transition to state `error` | TBD |
| signingUp with ERROR should transition to state `error` | TBD |
| loggedIn with LOGOUT should transition to state `loggingOut` | TBD |

## src/tests/frontend/shared-utilities.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| returns valid result when all validations are valid | TBD |
| returns invalid result with combined reason when all validations are invalid | TBD |
| returns invalid result with combined reason when some validations are invalid | TBD |
| returns valid result when there are no validations | TBD |
| should return valid for a valid user id | TBD |
| should return invalid for an null user id | TBD |
| should return invalid for an undefined user id | TBD |
| should return invalid for a non-string user id | TBD |
| should return invalid for a user id shorter than 5 characters | TBD |
| should return invalid for a user id longer than 36 characters | TBD |
| should return invalid for a user id with invalid characters | TBD |
| should return invalid for a user id with multiple issues | TBD |

## src/tests/frontend/svelte-stores.test.ts

| Test Copy | Decision Placeholder |
| --- | ---: |
| should initialize with the correct default state | TBD |
| should dispatch and update the state correctly | TBD |
