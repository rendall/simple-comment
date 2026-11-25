import { Collection } from "mongodb"
import type { Db } from "mongodb"
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
})
