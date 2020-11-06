import type { AuthToken, Comment, CommentId, Discussion, DiscussionId, Error, Success, User, UserId } from "./simple-comment";
import { MongodbService } from "./MongodbService";
import { Db, MongoClient } from "mongodb";
import { user401, user404 } from "./errors";
import { getAuthToken, hashPassword } from "./crypt";

declare const global: any

const adminUser: Partial<User> = {
  id: "admin",
  verified: true,
  avatar: "some-url",
  email: "admin@simple-comment",
  isAdmin: true,
  name: "Simple Comment Admin",
}

const adminUserPassword = "LZI6uw1ZZRXrCqjAKc9s"

let connection: MongoClient
let db: Db

describe('Full API service test', () => {
  let service: MongodbService;

  beforeAll(async () => {
    service = new MongodbService(global.__MONGO_URI__, global.__MONGO_DB_NAME__);

    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true, useUnifiedTopology: true
    });
    db = await connection.db(global.__MONGO_DB_NAME__);
    const users = db.collection('users');

    const hash = await hashPassword(adminUserPassword)
    users.insertOne({ ...adminUser, hash })
  });

  afterAll(async () => {
    await service.destroy()
    await connection.close()
  });

  // post to auth with unknown credentials should return error 404
  test('POST to auth with unknown user', () => {
    return service.authPOST("userId", "password").catch(e => expect(e).toEqual(user404))
  });
  // post to auth with incorrect credentials should return error 401
  test('POST to auth with incorrect password', () => {
    return service.authPOST(adminUser.id, "password").catch(e => expect(e).toEqual(user401))
  });
  // post to auth with correct credentials should return authtoken
  test('POST to auth with correct credentials', () => {
    const authToken = getAuthToken(adminUser.id)
    // this will occassionally fail when the getAuthToken expiration is +- 1 second difference
    return service.authPOST(adminUser.id, adminUserPassword).then((value: AuthToken) => expect(value).toEqual(authToken))
  });
  // post to /user with identical credentials should return 425 Possible duplicate user
  test('POST to /user with identical credentials', () => { })
  // post to /user too quickly should return 425 too early
  test('POST to /user too quickly', () => { })
  // post to /user with improper credentials and admin-only-create-user policy should return 401
  test('POST to /user with improper credentials and admin-only-create-user policy', () => { })
  // post to /user should return user and 201 User created
  test('POST to /user', () => { })

  // get to /user with no credentials and public-can-view-users set to false should return 401
  test('GET to /user with no credentials and public-can-view-users set to false', () => { })
  // get to /user with improper credentials and users-can-view-users false should return 403
  test('GET to /user with improper credentials and users-can-view-users false', () => { })
  // get to /user should return array of users
  test('GET to /user', () => { })

  // delete to /user/{userId} with no credentials should return 401
  test('DELETE to /user/{userId} with no credentials', () => { })
  // delete to /user/{userId} with improper credentials should return 403
  test('DELETE to /user/{userId} with improper credentials', () => { })
  // delete to /user/{userId} where userId does not exist and admin credentials should return 404
  test('DELETE to /user/{userId} where userId does not exist and admin credentials', () => { })
  // delete to /user/{userId} with hardcoded admin userId should return 403
  test('DELETE to /user/{userId} with hardcoded admin userId', () => { })
  // delete to /user/{userId} should delete user and return 202 User deleted
  test('DELETE to /user/{userId} should', () => { })

  // put to /user/{userId} with no credentials should return 401
  test('PUT to /user/{userId} with no credentials', () => { })
  // put to /user/{userId} with improper credentials should return 403
  test('PUT to /user/{userId} with improper credentials', () => { })
  // put to /user/{userId} with own credentials should alter user return 204 User updated
  test('PUT to /user/{userId} with own credentials', () => { })
  // put to /user/{userId} with admin credentials should alter user return 204 User updated
  test('PUT to /user/{userId} with admin credentials', () => { })
  // put to /user/{userId} where userId does not exist and admin credentials should return 404
  test('PUT to /user/{userId} where userId does not exist and admin credentials', () => { })

  // get to /user/{userId} with no credentials and public-view-users set to false should return 401
  test('GET to /user/{userId} with no credentials and public-view-users set to false', () => { })
  // get to /user/{userId} without admin credentials and admin-only-view-users should return 403
  test('GET to /user/{userId} without admin credentials and admin-only-view-users', () => { })
  // get to /user/{userId} where userId does not exist should return 404
  test('GET to /user/{userId} where userId does not exist', () => { })
  // get to /user/{userId} should return User and 200
  test('GET to /user/{userId} should', () => { })

  // delete to /discussion/{discussionId}/{commentId} with no credentials should return 401
  test('DELETE to /discussion/{discussionId}/{commentId} with no credentials', () => { })
  // delete to /discussion/{discussionId}/{commentId} with improper credentials should return 403
  test('DELETE to /discussion/{discussionId}/{commentId} with improper credentials', () => { })
  // delete to /discussion/{discussionId}/{commentId} where either Id does not exist should return 404 and indicate which does not exist
  test('DELETE to /discussion/{discussionId}/{commentId} where either Id does not exist', () => { })
  // delete to /discussion/{discussionId}/{commentId} should delete the comment and return 202 Comment deleted
  test('DELETE to /discussion/{discussionId}/{commentId} should', () => { })

  // put to /discussion/{discussionId}/{commentId} with no credentials should return 401
  test('PUT to /discussion/{discussionId}/{commentId} with no credentials', () => { })
  // put to /discussion/{discussionId}/{commentId} with improper credentials should return 403
  test('PUT to /discussion/{discussionId}/{commentId} with improper credentials', () => { })
  // put to /discussion/{discussionId}/{commentId} where either Id does not exist should return 404 and indicate which does not exist
  test('PUT to /discussion/{discussionId}/{commentId} where either Id does not exist', () => { })
  // put to /discussion/{discussionId}/{commentId} should return the edited comment with 202 Comment updated
  test('PUT to /discussion/{discussionId}/{commentId} should', () => { })

  // get to /discussion/{discussionId}/{commentId} with no credentials and public-view-discussion false should return 401
  test('GET to /discussion/{discussionId}/{commentId} with no credentials and public-view-discussion false', () => { })
  // get to /discussion/{discussionId}/{commentId} with improper credentials and public-view-discussion false should return 403
  test('GET to /discussion/{discussionId}/{commentId} with improper credentials and public-view-discussion false', () => { })
  // get to /discussion/{discussionId}/{commentId} where either Id does not exist should return 404 and indicate which does not exist
  test('GET to /discussion/{discussionId}/{commentId} where either Id does not exist', () => { })
  // get to /discussion/{discussionId}/{commentId} should return the comment with 200 OK
  test('GET to /discussion/{discussionId}/{commentId} should', () => { })

  // delete to /discussion/{discussionId} with no credentials should return 401
  test('DELETE to /discussion/{discussionId} with no credentials', () => { })
  // delete to /discussion/{discussionId} with improper credentials should return 403
  test('DELETE to /discussion/{discussionId} with improper credentials', () => { })
  // delete to /discussion/{discussionId} where Id does not exist should return 404 
  test('DELETE to /discussion/{discussionId} where Id does not exist', () => { })
  // delete to /discussion/{discussionId} should delete the discussion and return 202 Discussion deleted
  test('DELETE to /discussion/{discussionId} should', () => { })

  // post to /discussion/{discussionId} with improper credentials and public-can-post-comment false policy should return 401
  test('POST to /discussion/{discussionId} with improper credentials and public-can-post-comment false policy', () => { })
  // post to /discussion/{discussionId} too often should return 429 Too many comments
  test('POST to /discussion/{discussionId} too often', () => { })
  // post to /discussion/{discussionId} with identical information should return 425 Possible duplicate comment
  test('POST to /discussion/{discussionId} with identical information', () => { })
  // post to /discussion/{discussionId} with too long comment should return 413 Comment too long
  test('POST to /discussion/{discussionId} with too long comment', () => { })
  // post to /discussion/{discussionId} should return comment and 201 Comment created
  test('POST to /discussion/{discussionId} should', () => { })

  // get to /discussion with no credentials and policy should return 401
  test('GET to /discussion with no credentials and policy', () => { })
  // get to /discussion with improper credentials and policy should return 403
  test('GET to /discussion with improper credentials and policy', () => { })
  // get to /discussion should return a list of discussions and 200 OK
  test('GET to /discussion', () => { })

  // post to /discussion with no credentials and public-can-create-discussion false policy should return 401
  test('POST to /discussion with no credentials and public-can-create-discussion false policy', () => { })
  // post to /discussion with improper credentials and user-can-create-discussion false policy should return 403
  test('POST to /discussion with improper credentials and user-can-create-discussion false policy', () => { })
  // post to /discussion too often should return 429 Too much discussion
  test('POST to /discussion too often', () => { })
  // post to /discussion with identical information should return 425 Discussion already exists
  test('POST to /discussion with identical information', () => { })
  // post to /discussion should return Discussion object and 201 Discussion created
  test('POST to /discussion', () => { })
});
