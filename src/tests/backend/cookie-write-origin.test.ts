import type { NetlifyRequest } from "../../lib/backend-utilities"
import { getAuthToken } from "../../lib/crypt"

const apiOrigin = "https://comments.example.test"
const embedOrigin = "https://blog.example.test"
const otherOrigin = "https://other.example.test"
const cookieUser = "cookie-user"
const bearerUser = "bearer-user"
const cookie = `simple_comment_token=${getAuthToken(cookieUser)}`
const bearer = `Bearer ${getAuthToken(bearerUser)}`

const writeRoutes = [
  ["comment", "POST", "/parent", "commentPOST"],
  ["comment", "PUT", "/entry", "commentPUT"],
  ["comment", "DELETE", "/entry", "commentDELETE"],
  ["comment", "POST", "/entry/hold", "commentHOLD"],
  ["comment", "POST", "/entry/approve", "commentAPPROVE"],
  ["topic", "POST", "", "topicPOST"],
  ["topic", "PUT", "/discussion", "topicPUT"],
  ["topic", "DELETE", "/discussion", "topicDELETE"],
  ["user", "POST", "", "userPOST"],
  ["user", "PUT", "/account", "userPUT"],
  ["user", "DELETE", "/account", "userDELETE"],
  ["auth", "DELETE", "", "authDELETE"],
] as const

type Route = (typeof writeRoutes)[number][0]
type Handler = typeof import("../../functions/comment").handler

const setup = (crossSite: string | undefined, allowOrigin = embedOrigin) => {
  const write = jest.fn(async () => ({
    statusCode: 200,
    body: "Fixture write",
  }))
  const read = jest.fn(async () => ({ statusCode: 200, body: "Fixture read" }))
  const service = {
    ...Object.fromEntries(writeRoutes.map(route => [route[3], write])),
    commentGET: read,
  }
  let handlers!: Record<Route, Handler>
  const originalEnv = process.env
  process.env = {
    ...originalEnv,
    NODE_ENV: "production",
    ALLOW_ORIGIN: allowOrigin,
  }
  if (crossSite === undefined) delete process.env.IS_CROSS_SITE
  else process.env.IS_CROSS_SITE = crossSite

  try {
    jest.isolateModules(() => {
      jest.doMock("../../lib/MongodbService", () => ({
        MongodbService: jest.fn(() => service),
      }))
      jest.doMock("../../lib/getNotificationService", () => ({
        getNotificationService: () => undefined,
      }))
      handlers = {
        comment: jest.requireActual("../../functions/comment").handler,
        topic: jest.requireActual("../../functions/topic").handler,
        user: jest.requireActual("../../functions/user").handler,
        auth: jest.requireActual("../../functions/auth").handler,
      }
    })
  } finally {
    jest.dontMock("../../lib/MongodbService")
    jest.dontMock("../../lib/getNotificationService")
    process.env = originalEnv
  }

  const request = (
    route: Route,
    httpMethod: string,
    suffix: string,
    headers: NetlifyRequest["headers"],
    baseUrl = apiOrigin
  ) => {
    const path = `/.netlify/functions/${route}${suffix}`
    return handlers[route]({
      httpMethod,
      path,
      rawUrl: `${baseUrl}${path}`,
      headers,
      body: "Fixture input",
    } as NetlifyRequest)
  }
  return { request, write, read }
}

test.each(writeRoutes)(
  "blocks cookie writes through %s %s %s before the service",
  async (route, method, suffix) => {
    const { request, write } = setup("true", "*")
    expect(
      await request(route, method, suffix, {
        Cookie: cookie,
        Origin: otherOrigin,
      })
    ).toMatchObject({
      statusCode: 403,
      body: "Cookie-authenticated writes require a trusted origin",
    })
    expect(write).not.toHaveBeenCalled()
  }
)

test.each([
  {
    name: "an explicitly allowed embed",
    enabled: "true",
    headers: { Origin: embedOrigin },
    allowed: true,
  },
  {
    name: "an embed with cross-site mode disabled",
    enabled: "false",
    headers: { Origin: embedOrigin },
    allowed: false,
  },
  {
    name: "an embed with cross-site mode unset",
    enabled: undefined,
    headers: { Origin: embedOrigin },
    allowed: false,
  },
  {
    name: "an embed with a non-true environment value",
    enabled: "TRUE",
    headers: { Origin: embedOrigin },
    allowed: false,
  },
  {
    name: "a same-origin request in cross-site mode",
    enabled: "true",
    headers: { Origin: apiOrigin },
    allowed: true,
  },
  {
    name: "a same-origin request in strict-cookie mode",
    enabled: "false",
    headers: { Origin: apiOrigin },
    allowed: true,
  },
  {
    name: "a sibling origin in strict-cookie mode",
    enabled: "false",
    headers: { Origin: embedOrigin, "Sec-Fetch-Site": "same-site" },
    allowed: false,
  },
  {
    name: "a same-origin browser request behind a local proxy",
    enabled: "false",
    headers: {
      Origin: "http://localhost:5000",
      "Sec-Fetch-Site": "same-origin",
    },
    allowed: true,
  },
  {
    name: "a request with a trusted Referer and no Origin",
    enabled: "false",
    headers: { Referer: `${apiOrigin}/discussion` },
    allowed: true,
  },
  {
    name: "a request with no trusted origin evidence",
    enabled: "true",
    headers: {},
    allowed: false,
  },
  {
    name: "an opaque Origin with an otherwise trusted Referer",
    enabled: "true",
    headers: { Origin: "null", Referer: `${apiOrigin}/discussion` },
    allowed: false,
  },
  {
    name: "an untrusted Origin with an otherwise trusted Referer",
    enabled: "true",
    headers: { Origin: otherOrigin, Referer: `${apiOrigin}/discussion` },
    allowed: false,
  },
  {
    name: "a host that only begins with the allowed origin",
    enabled: "true",
    headers: { Origin: `${embedOrigin}.other.test` },
    allowed: false,
  },
])("checks origin policy for $name", async ({ enabled, headers, allowed }) => {
  const { request, write } = setup(enabled)
  const result = await request("comment", "POST", "/entry/hold", {
    Cookie: cookie,
    ...headers,
  })
  expect(result.statusCode).toBe(allowed ? 200 : 403)
  expect(write).toHaveBeenCalledTimes(allowed ? 1 : 0)
})

test("uses the selected credential and leaves bearer-only clients usable", async () => {
  const { request, write } = setup("true")
  expect(
    (
      await request("comment", "POST", "/entry/hold", {
        Authorization: bearer,
        Origin: otherOrigin,
      })
    ).statusCode
  ).toBe(200)
  expect(write).toHaveBeenLastCalledWith("entry", "Fixture input", bearerUser)

  expect(
    (
      await request("comment", "POST", "/entry/hold", {
        Cookie: cookie,
        Authorization: bearer,
        Origin: otherOrigin,
      })
    ).statusCode
  ).toBe(403)
  expect(write).toHaveBeenCalledTimes(1)

  expect(
    (
      await request("comment", "POST", "/entry/hold", {
        Cookie: cookie,
        Authorization: bearer,
        Origin: embedOrigin,
      })
    ).statusCode
  ).toBe(200)
  expect(write).toHaveBeenLastCalledWith("entry", "Fixture input", cookieUser)
})

test("keeps public reads and preflight requests available", async () => {
  const { request, read, write } = setup("true")
  for (const headers of [
    { Origin: otherOrigin },
    { Cookie: cookie, Origin: otherOrigin },
  ]) {
    expect(
      (await request("comment", "GET", "/entry", headers)).statusCode
    ).toBe(200)
  }
  const preflight = await request("comment", "OPTIONS", "/entry/hold", {
    Origin: embedOrigin,
  })
  expect(preflight).toMatchObject({
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": embedOrigin },
  })
  expect(read).toHaveBeenNthCalledWith(1, "entry", undefined)
  expect(read).toHaveBeenNthCalledWith(2, "entry", cookieUser)
  expect(write).not.toHaveBeenCalled()
})
