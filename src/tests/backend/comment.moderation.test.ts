import type { APIGatewayEvent } from "aws-lambda"
import { Collection } from "mongodb"
import type { Db, FindOneAndUpdateOptions } from "mongodb"
import { getAuthToken } from "../../lib/crypt"
import { MongodbService } from "../../lib/MongodbService"
import { getBackendEnv } from "../../lib/env"
import type { Comment, Discussion, User } from "../../lib/simple-comment-types"
import { Privilege } from "../../lib/simple-comment-types"

declare const global: { __MONGO_URI__: string; __MONGO_DB_NAME__: string }

const account = (id: string, privilege = Privilege.User): User => ({
  id,
  name: id,
  email: `${id}@example.com`,
  privilege,
})

const author = account("comment-author")
const guest = account("guest-aa123-yay")
const outsider = account("outside-reader")
const moderator = account("review-moderator", Privilege.Moderator)
const admin = account("review-admin", Privilege.Admin)
const owner = account(getBackendEnv().moderatorId, Privilege.Admin)
const dateCreated = new Date("2026-01-01T12:00:00Z")
const discussion: Discussion = {
  id: "moderation-discussion",
  title: "Moderation tests",
  isLocked: false,
  dateCreated,
}

const comment = (id: string, changes: Partial<Comment> = {}): Comment => ({
  id,
  parentId: discussion.id,
  userId: author.id,
  text: `Text of ${id}`,
  dateCreated,
  ...changes,
})

const held = (id: string, changes: Partial<Comment> = {}) =>
  comment(id, { isApproved: false, heldReason: "Review required", ...changes })

describe("Comment moderation", () => {
  const service = new MongodbService(
    global.__MONGO_URI__,
    `${global.__MONGO_DB_NAME__}-comment-moderation`
  )
  let db: Db
  let comments: Collection<Comment | Discussion>

  beforeAll(async () => {
    db = await service.getDb()
    comments = db.collection("comments")
  })

  beforeEach(async () => {
    const users = db.collection<User>("users")
    await users.deleteMany({})
    await comments.deleteMany({})
    await users.insertMany(
      [author, outsider, guest, moderator, admin, owner].map(user => ({
        ...user,
      }))
    )
    await comments.insertOne({ ...discussion })
  })

  afterAll(async () => {
    await db.dropDatabase()
    await service.close()
  })

  const readDiscussion = async (viewer?: User) => {
    const response = await service.topicGET(discussion.id, viewer?.id)
    expect(response.statusCode).toBe(200)
    return (response.body as Discussion).replies ?? []
  }

  test("serves the documented account, comment, and discussion responses", async () => {
    const loadHandlers = () => {
      let handlers!: {
        comment: typeof import("../../functions/comment").handler
        topic: typeof import("../../functions/topic").handler
        user: typeof import("../../functions/user").handler
      }
      jest.isolateModules(() => {
        jest.doMock("../../lib/MongodbService", () => ({
          MongodbService: jest.fn(() => service),
        }))
        handlers = {
          comment: jest.requireActual("../../functions/comment").handler,
          topic: jest.requireActual("../../functions/topic").handler,
          user: jest.requireActual("../../functions/user").handler,
        }
      })
      jest.dontMock("../../lib/MongodbService")
      return handlers
    }

    const handlers = loadHandlers()
    const request = (
      route: keyof typeof handlers,
      httpMethod: string,
      path: string,
      user?: User,
      body: string | null = null
    ) =>
      handlers[route]({
        httpMethod,
        path: `/.netlify/functions/${route}/${path}`,
        headers: user
          ? { Authorization: `Bearer ${getAuthToken(user.id)}` }
          : {},
        body,
      } as APIGatewayEvent)

    expect(
      await request("user", "PUT", author.id, author, "isAdmin=true")
    ).toMatchObject({ statusCode: 403 })

    const created = await request(
      "comment",
      "POST",
      discussion.id,
      author,
      "Plain comment"
    )
    expect(created).toMatchObject({
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
    })
    const published = JSON.parse(String(created.body))
    expect(published).toMatchObject({ text: "Plain comment", isApproved: true })
    expect(published).not.toHaveProperty("heldReason")

    const heldText = "See https://example.org for the announcement"
    const submitted = await request(
      "comment",
      "POST",
      discussion.id,
      author,
      heldText
    )
    expect(submitted.statusCode).toBe(201)
    const pending = JSON.parse(String(submitted.body))
    expect(pending).toMatchObject({
      text: heldText,
      isApproved: false,
      heldReason: expect.any(String),
    })

    const edited = await request(
      "comment",
      "PUT",
      published.id,
      author,
      "Try example.org instead"
    )
    expect(edited).toMatchObject({
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
    })
    expect(JSON.parse(String(edited.body))).toMatchObject({
      id: published.id,
      text: "Try example.org instead",
      isApproved: false,
      heldReason: expect.any(String),
    })
    const released = await request(
      "comment",
      "PUT",
      published.id,
      author,
      "Edited plain comment"
    )
    expect(released.statusCode).toBe(200)
    const releasedComment = JSON.parse(String(released.body))
    expect(releasedComment).toMatchObject({
      id: published.id,
      text: "Edited plain comment",
      isApproved: true,
    })
    expect(releasedComment).not.toHaveProperty("heldReason")

    expect(await request("comment", "GET", pending.id)).toMatchObject({
      statusCode: 404,
      headers: { "Cache-Control": "private, no-store" },
    })
    const publicTopic = await request("topic", "GET", discussion.id)
    expect(publicTopic).toMatchObject({
      statusCode: 200,
      headers: { "Cache-Control": "private, no-store" },
    })
    expect(JSON.parse(String(publicTopic.body)).replies).toEqual([
      expect.objectContaining({ id: published.id, isApproved: true }),
    ])
    const authorizedTopic = await request(
      "topic",
      "GET",
      discussion.id,
      moderator
    )
    expect(JSON.parse(String(authorizedTopic.body)).replies).toContainEqual(
      expect.objectContaining({
        id: pending.id,
        text: heldText,
        heldReason: pending.heldReason,
      })
    )

    const approvalPath = `${pending.id}/approve`
    expect(
      await request("comment", "POST", approvalPath, moderator, "Stale text")
    ).toMatchObject({ statusCode: 409 })
    expect(
      await request("comment", "POST", approvalPath, moderator, heldText)
    ).toMatchObject({ statusCode: 200, body: "Comment approved" })
    expect(
      await request("comment", "DELETE", pending.id, moderator)
    ).toMatchObject({ statusCode: 400 })
    expect(
      await request(
        "comment",
        "DELETE",
        pending.id,
        moderator,
        "Private removal reason"
      )
    ).toMatchObject({ statusCode: 202 })
    expect(
      await request("comment", "POST", approvalPath, moderator, heldText)
    ).toMatchObject({ statusCode: 404 })
    const deleted = await request("comment", "GET", pending.id, author)
    expect(deleted.statusCode).toBe(200)
    expect(JSON.parse(String(deleted.body))).toMatchObject({
      text: null,
      deletedReason: "Private removal reason",
    })
    expect(await request("comment", "GET", pending.id, outsider)).toMatchObject(
      { statusCode: 404 }
    )
  })

  test("redacts held ancestors and retains independently visible descendants", async () => {
    const root = comment("root")
    const first = held("held-root", { parentId: root.id })
    const nested = held("held-child", { parentId: first.id })
    const leaf = held("held-leaf")
    const visible = comment("visible-reply", { parentId: nested.id })
    await comments.insertMany([root, first, nested, leaf, visible])

    const expected = [
      { id: first.id, parentId: root.id, text: null, isApproved: false },
      { id: nested.id, parentId: first.id, text: null, isApproved: false },
      {
        id: visible.id,
        parentId: nested.id,
        text: visible.text,
        isApproved: true,
      },
    ]
    for (const viewer of [undefined, outsider]) {
      const replies = await readDiscussion(viewer)
      expect(replies).toEqual(
        expect.arrayContaining(
          expected.map(value => expect.objectContaining(value))
        )
      )
      expect(replies.some(reply => reply.id === leaf.id)).toBe(false)
      for (const reply of replies.filter(reply => reply.isApproved === false)) {
        expect(reply).not.toHaveProperty("user")
        expect(reply).not.toHaveProperty("heldReason")
        expect(reply).not.toHaveProperty("userId")
      }
      expect(await service.commentGET(root.id, viewer?.id)).toMatchObject({
        body: {
          replies: expect.arrayContaining(
            expected.map(value => expect.objectContaining(value))
          ),
        },
      })
      expect(await service.commentGET(first.id, viewer?.id)).toMatchObject({
        body: {
          text: null,
          replies: expect.arrayContaining([
            expect.objectContaining({ id: visible.id }),
          ]),
        },
      })
      expect((await service.commentGET(leaf.id, viewer?.id)).statusCode).toBe(
        404
      )
    }
  })

  test("shows held content and reasons to its recognized guest author and moderators", async () => {
    const submitted = held("guest-held", { userId: guest.id })
    await comments.insertOne(submitted)

    for (const viewer of [guest, moderator, admin, owner]) {
      const authorized = {
        id: submitted.id,
        text: submitted.text,
        heldReason: submitted.heldReason,
        isApproved: false,
      }
      expect(await readDiscussion(viewer)).toEqual(
        expect.arrayContaining([expect.objectContaining(authorized)])
      )
      expect(await service.commentGET(submitted.id, viewer.id)).toMatchObject({
        body: authorized,
      })
    }
    expect(await readDiscussion(author)).toEqual([])
    expect((await service.commentGET(submitted.id)).statusCode).toBe(404)
  })

  test("accepts replies to a visible descendant and rejects replies to unavailable parents", async () => {
    const heldParent = held("held-parent")
    const published = comment("approved-child", { parentId: heldParent.id })
    const deleted = comment("deleted-parent", {
      text: null,
      dateDeleted: dateCreated,
    })
    await comments.insertMany([heldParent, published, deleted])

    for (const viewer of [author, outsider, moderator, owner]) {
      expect(
        (await service.commentPOST(heldParent.id, "Direct reply", viewer.id))
          .statusCode
      ).toBe(404)
      expect(
        (await service.commentPOST(deleted.id, "Direct reply", viewer.id))
          .statusCode
      ).toBe(404)
    }
    expect(
      (
        await service.commentPOST(
          published.id,
          "Independent reply",
          outsider.id
        )
      ).statusCode
    ).toBe(201)
    expect(
      (
        await service.commentPUT(
          heldParent.id,
          "Cross-author edit",
          moderator.id
        )
      ).statusCode
    ).toBe(403)
    expect(
      (await service.commentPUT(heldParent.id, "Own edit", author.id))
        .statusCode
    ).toBe(200)
  })

  test.each([
    [outsider, 403],
    [moderator, 202],
    [admin, 202],
    [owner, 202],
  ] as const)("enforces removal authority for $id", async (viewer, status) => {
    const submitted = held("held-for-removal")
    await comments.insertOne(submitted)
    const response = await service.commentDELETE(
      submitted.id,
      viewer.id,
      "Removal reason"
    )
    expect(response.statusCode).toBe(status)
    const record = await comments.findOne<Comment>({ id: submitted.id })
    if (status === 403) {
      expect(record).toMatchObject(submitted)
    } else {
      expect(record).toMatchObject({
        text: null,
        dateDeleted: expect.any(Date),
        deletedBy: viewer.id,
        deletedReason: "Removal reason",
        userId: author.id,
      })
      expect(record).not.toHaveProperty("heldReason")
    }
  })

  test("requires a removal reason and keeps it private after deletion", async () => {
    const submitted = held("remove-with-reason")
    await comments.insertOne(submitted)
    expect(
      (await service.commentDELETE(submitted.id, moderator.id, "  ")).statusCode
    ).toBe(400)
    expect(await comments.findOne({ id: submitted.id })).toMatchObject(
      submitted
    )
    expect(
      (
        await service.commentDELETE(
          submitted.id,
          moderator.id,
          "  Private reason  "
        )
      ).statusCode
    ).toBe(202)

    for (const viewer of [author, moderator]) {
      expect(await service.commentGET(submitted.id, viewer.id)).toMatchObject({
        body: { text: null, deletedReason: "Private reason" },
      })
    }
    for (const viewer of [undefined, outsider]) {
      const tombstone = (await readDiscussion(viewer)).find(
        reply => reply.id === submitted.id
      )
      expect(tombstone).toMatchObject({
        text: null,
        dateDeleted: expect.any(Date),
      })
      for (const field of [
        "deletedReason",
        "heldReason",
        "deletedBy",
        "userId",
        "user",
      ]) {
        expect(tombstone).not.toHaveProperty(field)
      }
      expect(
        (await service.commentGET(submitted.id, viewer?.id)).statusCode
      ).toBe(404)
    }
  })

  test("approves exact text once and preserves record fields on retries", async () => {
    const reviewedText = "$Reviewed text"
    const submitted = held("reviewed", {
      text: reviewedText,
      heldBy: moderator.id,
    })
    await comments.insertOne(submitted)
    expect(
      (
        await service.commentAPPROVE(
          submitted.id,
          "$reviewed text",
          moderator.id
        )
      ).statusCode
    ).toBe(409)
    expect(await comments.findOne({ id: submitted.id })).toMatchObject(
      submitted
    )
    expect(
      (await service.commentAPPROVE(submitted.id, reviewedText, moderator.id))
        .statusCode
    ).toBe(200)
    const approved = await comments.findOne({ id: submitted.id })
    expect(approved).toMatchObject({
      isApproved: true,
      text: reviewedText,
      dateCreated,
    })
    expect(approved).not.toHaveProperty("heldReason")
    expect(approved).not.toHaveProperty("heldBy")

    for (const text of [reviewedText, "An obsolete version"]) {
      expect(
        (await service.commentAPPROVE(submitted.id, text, moderator.id))
          .statusCode
      ).toBe(200)
    }
    expect(await comments.findOne({ id: submitted.id })).toEqual(approved)
  })

  test.each([
    {
      state: "published by an edit",
      replacement: "No link now",
      result: 200,
      approved: true,
    },
    {
      state: "held after an edit",
      replacement: "Changed link example.org",
      result: 409,
      approved: false,
    },
    {
      state: "held with the original text restored",
      replacement: "Original link example.com",
      result: 200,
      approved: true,
    },
    { state: "deleted", replacement: null, result: 404, approved: undefined },
  ])(
    "uses the state at the approval write when $state",
    async ({ state, replacement, result, approved }) => {
      const reviewedText = "Original link example.com"
      const submitted = held("review-in-flight", { text: reviewedText })
      await comments.insertOne(submitted)
      const update = jest
        .spyOn(Collection.prototype, "findOneAndUpdate")
        .mockImplementationOnce(
          async (filter, change, options?: FindOneAndUpdateOptions) => {
            update.mockRestore()
            if (replacement === null) {
              expect(
                (await service.commentDELETE(submitted.id, author.id))
                  .statusCode
              ).toBe(202)
            } else {
              if (state === "held with the original text restored") {
                await service.commentPUT(
                  submitted.id,
                  "Another link example.net",
                  author.id
                )
              }
              expect(
                (await service.commentPUT(submitted.id, replacement, author.id))
                  .statusCode
              ).toBe(200)
            }
            return db
              .collection("comments")
              .findOneAndUpdate(filter, change, { ...options })
          }
        )

      try {
        expect(
          (
            await service.commentAPPROVE(
              submitted.id,
              reviewedText,
              moderator.id
            )
          ).statusCode
        ).toBe(result)
        const record = await comments.findOne<Comment>({ id: submitted.id })
        expect(record?.text).toBe(replacement)
        expect(record?.isApproved).toBe(approved)
      } finally {
        update.mockRestore()
      }
    }
  )

  test("preserves the first moderator removal across repeated and concurrent deletes", async () => {
    const submitted = held("concurrent-removal")
    await comments.insertOne(submitted)
    let firstDeletion: Comment | null = null
    const update = jest
      .spyOn(Collection.prototype, "updateOne")
      .mockImplementationOnce(async (filter, change) => {
        update.mockRestore()
        expect(
          (
            await service.commentDELETE(
              submitted.id,
              moderator.id,
              "First removal"
            )
          ).statusCode
        ).toBe(202)
        firstDeletion = await comments.findOne<Comment>({ id: submitted.id })
        return db.collection("comments").updateOne(filter, change)
      })

    try {
      expect(
        (await service.commentDELETE(submitted.id, admin.id, "Later removal"))
          .statusCode
      ).toBe(202)
      expect(
        (await service.commentDELETE(submitted.id, owner.id)).statusCode
      ).toBe(202)
      expect(firstDeletion).toMatchObject({
        dateDeleted: expect.any(Date),
        deletedBy: moderator.id,
        deletedReason: "First removal",
      })
      expect(await comments.findOne({ id: submitted.id })).toEqual(
        firstDeletion
      )
    } finally {
      update.mockRestore()
    }
  })

  test.each(["held", "deleted"])(
    "keeps a reply that passed eligibility before its parent was %s",
    async state => {
      const parent = comment("parent-in-flight")
      await comments.insertOne(parent)
      const insertion = jest
        .spyOn(Collection.prototype, "insertOne")
        .mockImplementationOnce(async reply => {
          insertion.mockRestore()
          if (state === "held") {
            expect(
              (
                await service.commentPUT(
                  parent.id,
                  "A new link example.com",
                  author.id
                )
              ).statusCode
            ).toBe(200)
          } else {
            expect(
              (await service.commentDELETE(parent.id, author.id)).statusCode
            ).toBe(202)
          }
          return db.collection("comments").insertOne(reply)
        })

      try {
        expect(
          (await service.commentPOST(parent.id, "Reply in flight", outsider.id))
            .statusCode
        ).toBe(201)
        expect(
          (await service.commentPOST(parent.id, "Later reply", outsider.id))
            .statusCode
        ).toBe(404)
        expect(await readDiscussion(outsider)).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: parent.id, text: null }),
            expect.objectContaining({
              parentId: parent.id,
              text: "Reply in flight",
            }),
          ])
        )
      } finally {
        insertion.mockRestore()
      }
    }
  )
})
