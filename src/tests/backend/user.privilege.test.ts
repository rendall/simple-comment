import type { APIGatewayEvent } from "aws-lambda"
import { handler } from "../../functions/user"
import { getUserRole } from "../../lib/backend-utilities"
import { getBackendEnv } from "../../lib/env"
import { Privilege } from "../../lib/simple-comment-types"

const ownerId = getBackendEnv().moderatorId

describe("Effective account privilege", () => {
  test.each([
    [Privilege.User, false, false],
    [Privilege.Moderator, true, false],
    [Privilege.Admin, true, true],
  ])(
    "derives role predicates for stored level %i",
    (privilege, moderator, admin) => {
      expect(getUserRole({ id: "regular-account", privilege })).toEqual({
        privilege,
        isModerator: moderator,
        isAdmin: admin,
        isOwner: false,
      })
    }
  )

  test("defaults a legacy administrator without stored privilege to level 0", () => {
    const legacyAdmin = { id: "legacy-admin", isAdmin: true }

    expect(getUserRole(legacyAdmin)).toEqual({
      privilege: Privilege.User,
      isModerator: false,
      isAdmin: false,
      isOwner: false,
    })
  })

  test("gives the configured owner full access from the configured identity", () => {
    const owner = { id: ownerId, privilege: Privilege.User, isAdmin: false }

    expect(getUserRole(owner)).toEqual({
      privilege: Privilege.Owner,
      isModerator: true,
      isAdmin: true,
      isOwner: true,
    })
  })

  test.each([null, undefined, -1, 1.5, Privilege.Owner, "2"])(
    "rejects invalid present stored privilege %p",
    privilege => {
      expect(() =>
        getUserRole({
          id: "regular-account",
          privilege: privilege as Privilege,
        })
      ).toThrow("Invalid stored user privilege")
    }
  )
})

describe("Read-only role fields on the account endpoint", () => {
  test.each([
    "privilege=2",
    "isAdmin=false",
    "isModerator=true",
    "isOwner=true",
  ])("rejects %s on create and update before persistence", body => {
    const url = "/.netlify/functions/user"
    const create = { httpMethod: "POST", path: url, headers: {}, body }
    const update = { ...create, httpMethod: "PUT", path: `${url}/regular-user` }

    return Promise.all([
      expect(handler(create as APIGatewayEvent)).resolves.toMatchObject({
        statusCode: 403,
      }),
      expect(handler(update as APIGatewayEvent)).resolves.toMatchObject({
        statusCode: 403,
      }),
    ])
  })
})
