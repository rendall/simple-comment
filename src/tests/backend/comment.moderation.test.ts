import type { APIGatewayEvent } from "aws-lambda"
import { Collection } from "mongodb"
import type { Db, FindOneAndUpdateOptions } from "mongodb"
import { getAuthToken } from "../../lib/crypt"
import { MongodbService } from "../../lib/MongodbService"
import { getBackendEnv } from "../../lib/env"
import type { Comment, Discussion, User } from "../../lib/simple-comment-types"
import { Privilege } from "../../lib/simple-comment-types"
import policy from "../../policy.json"

jest.mock("../../lib/moderation-terms", () => ({
  ...jest.requireActual("../../lib/moderation-terms"),
  readModerationTerms: () => ["paper crane", "(a+b)"],
}))

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

  const linkReason = "This comment contains a link and requires review."
  const termReason =
    "This comment contains a word or phrase that requires review."

  test.each([
    ["Read the [article](HTTPS://example.org/article).", linkReason],
    ["Visit example.org for the announcement.", linkReason],
    ["A PAPER CRANE and a literal (A+B).", termReason],
    ["A paper crane from example.org.", `${linkReason} ${termReason}`],
  ])("automatically holds %s", async (text, heldReason) => {
    expect(
      await service.commentPOST(discussion.id, text, author.id)
    ).toMatchObject({
      statusCode: 201,
      body: { text, isApproved: false, heldReason },
    })
  })

  test.each([
    ["https://visitor@example.org", false],
    ["https://visitor:sample@example.org", false],
    ["//visitor@example.org", false],
    ["visitor@example.org", true],
  ])(
    "applies the link rule to %s on create and edit",
    async (address, isApproved) => {
      const text = `See ${address} for details.`
      const publication = isApproved
        ? { isApproved }
        : { isApproved, heldReason: linkReason }
      const existing = comment("edit-link")
      await comments.insertOne(existing)

      expect(
        await service.commentPOST(discussion.id, text, author.id)
      ).toMatchObject({
        statusCode: 201,
        body: { text, ...publication },
      })
      expect(
        await service.commentPUT(existing.id, text, author.id)
      ).toMatchObject({
        statusCode: 200,
        body: { text, ...publication },
      })
    }
  )

  test("publishes a cleaned-up comment and clears the stored reason", async () => {
    const submitted = held("automatic-release", {
      text: "A paper crane",
      heldReason: termReason,
    })
    await comments.insertOne(submitted)
    const text = "A paper boat and a+b"
    const result = await service.commentPUT(submitted.id, text, author.id)
    expect(result).toMatchObject({
      statusCode: 200,
      body: { id: submitted.id, text, isApproved: true },
    })
    expect(result.body).not.toHaveProperty("heldReason")
    const stored = await comments.findOne({ id: submitted.id })
    expect(stored).toMatchObject({ text, isApproved: true })
    expect(stored).not.toHaveProperty("heldReason")
  })

  test.each([moderator, admin, owner])(
    "limits $id's bypass to automatic moderation",
    async reviewer => {
      const submitted = held("held-for-reviewer", {
        text: "A paper crane at example.org",
      })
      const ownComment = held("reviewers-held-comment", { userId: reviewer.id })
      await comments.insertMany([submitted, ownComment])
      const text = "A paper crane from example.org"
      expect(
        await service.commentPOST(discussion.id, text, reviewer.id)
      ).toMatchObject({
        statusCode: 201,
        body: { text, isApproved: true },
      })
      const edited = await service.commentPUT(
        ownComment.id,
        `Edited: ${text}`,
        reviewer.id
      )
      expect(edited).toMatchObject({
        statusCode: 200,
        body: { isApproved: true },
      })
      expect(edited.body).not.toHaveProperty("heldReason")

      const overlength = "a".repeat(policy.maxCommentLengthChars + 1)
      expect(
        (await service.commentPOST(discussion.id, overlength, reviewer.id))
          .statusCode
      ).toBe(413)
      expect(
        (await service.commentPOST(submitted.id, text, reviewer.id)).statusCode
      ).toBe(404)
      expect(
        (await service.commentPUT(submitted.id, text, reviewer.id)).statusCode
      ).toBe(403)
    }
  )

  test("allows moderators to approve others' held comments and their own", async () => {
    const submitted = held("ordinary-held", {
      text: "A paper crane from example.org",
    })
    const ownComment = held("moderators-held", { userId: moderator.id })
    await comments.insertMany([submitted, ownComment])
    expect(
      (await service.commentAPPROVE(submitted.id, submitted.text!, author.id))
        .statusCode
    ).toBe(403)
    for (const pending of [submitted, ownComment]) {
      expect(
        (await service.commentAPPROVE(pending.id, pending.text!, moderator.id))
          .statusCode
      ).toBe(200)
      const approved = await comments.findOne({ id: pending.id })
      expect(approved).toMatchObject({ text: pending.text, isApproved: true })
      expect(approved).not.toHaveProperty("heldReason")
    }
  })

  const createRequest = () => {
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
    return (
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
  }

  test("serves the documented account, comment, and discussion responses", async () => {
    const request = createRequest()

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
    for (const viewer of [undefined, outsider]) {
      const response = await request("comment", "GET", pending.id, viewer)
      expect(response).toMatchObject({
        statusCode: 200,
        headers: { "Cache-Control": "private, no-store" },
      })
      const placeholder = JSON.parse(String(response.body))
      expect(placeholder).toMatchObject({
        id: pending.id,
        text: null,
        dateDeleted: expect.any(String),
        replies: [],
      })
      expect(placeholder).not.toHaveProperty("deletedReason")
    }
  })

  test("places holds through the API only for eligible moderators and targets", async () => {
    const request = createRequest()
    const ownerComment = comment("owner-published", {
      userId: owner.id,
      isApproved: true,
    })
    const legacyComment = comment("legacy-published")
    const published = comment("another-published", { isApproved: true })
    const automatic = held("automatically-held")
    const manual = held("manually-held", { heldBy: admin.id })
    const deleted = comment("deleted", { dateDeleted: dateCreated, text: null })
    await comments.insertMany([
      ownerComment,
      legacyComment,
      published,
      automatic,
      manual,
      deleted,
    ])
    const saved = await comments.find().sort({ id: 1 }).toArray()

    for (const [id, viewer, reason, status] of [
      [ownerComment.id, undefined, "Reason", 401],
      [ownerComment.id, outsider, "Reason", 403],
      [ownerComment.id, guest, "Reason", 403],
      [ownerComment.id, moderator, null, 400],
      [ownerComment.id, moderator, "  ", 400],
      [automatic.id, moderator, "Another reason", 409],
      [manual.id, moderator, "Another reason", 409],
      [deleted.id, moderator, "Reason", 404],
      [discussion.id, moderator, "Reason", 404],
      ["missing", moderator, "Reason", 404],
    ] as const) {
      expect(
        await request("comment", "POST", `${id}/hold`, viewer, reason)
      ).toMatchObject({ statusCode: status })
    }
    expect(await comments.find().sort({ id: 1 }).toArray()).toEqual(saved)
    expect(
      await request("comment", "GET", `${ownerComment.id}/hold`, moderator)
    ).toMatchObject({ statusCode: 405 })

    for (const [target, viewer] of [
      [ownerComment, moderator],
      [legacyComment, admin],
      [published, owner],
    ] as const) {
      const savedHold = await request(
        "comment",
        "POST",
        `${target.id}/hold`,
        viewer,
        " Private reason "
      )
      expect(savedHold).toMatchObject({
        statusCode: 200,
        body: "Comment hidden",
        headers: { "Content-Type": "text/plain" },
      })
      const heldComment = {
        ...target,
        isApproved: false,
        heldBy: viewer.id,
        heldReason: "Private reason",
      }
      expect(await comments.findOne({ id: target.id })).toEqual(heldComment)
      expect(
        await request(
          "comment",
          "POST",
          `${target.id}/hold`,
          moderator,
          "Replacement reason"
        )
      ).toMatchObject({ statusCode: 409 })
      expect(await comments.findOne({ id: target.id })).toEqual(heldComment)
    }
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

  test("keeps nested manual placeholders and independently visible replies", async () => {
    const root = comment("published-root")
    const automatic = held("automatic-ancestor", { parentId: root.id })
    const hiddenLeaf = comment("hidden-leaf", {
      parentId: automatic.id,
      userId: guest.id,
    })
    const hiddenParent = comment("hidden-parent")
    const reply = comment("published-reply", { parentId: hiddenParent.id })
    const unrelated = held("automatic-leaf")
    const deleted = comment("deleted-leaf", {
      text: null,
      dateDeleted: dateCreated,
    })
    await comments.insertMany([
      root,
      automatic,
      hiddenLeaf,
      hiddenParent,
      reply,
      unrelated,
      deleted,
    ])
    for (const target of [hiddenLeaf, hiddenParent]) {
      expect(
        (
          await service.commentHOLD(
            target.id,
            "Keep this private",
            moderator.id
          )
        ).statusCode
      ).toBe(200)
    }

    const automaticPlaceholder = {
      id: automatic.id,
      parentId: root.id,
      isApproved: false,
      text: null,
    }
    const manualPlaceholder = {
      id: hiddenLeaf.id,
      parentId: automatic.id,
      isApproved: false,
      isManuallyHeld: true,
      text: null,
    }
    for (const viewer of [undefined, outsider]) {
      const visible = await readDiscussion(viewer)
      const ancestor = visible.find(value => value.id === automatic.id)
      const leaf = visible.find(value => value.id === hiddenLeaf.id)
      expect(ancestor).toMatchObject(automaticPlaceholder)
      expect(ancestor).not.toHaveProperty("isManuallyHeld")
      expect(leaf).toMatchObject(manualPlaceholder)
      for (const placeholder of [ancestor, leaf]) {
        for (const privateField of ["heldBy", "heldReason", "user", "userId"]) {
          expect(placeholder).not.toHaveProperty(privateField)
        }
      }
      expect(visible).toContainEqual(
        expect.objectContaining({
          id: reply.id,
          parentId: hiddenParent.id,
          text: reply.text,
        })
      )
      expect(visible.find(value => value.id === unrelated.id)).toBeUndefined()

      expect(await service.commentGET(automatic.id, viewer?.id)).toMatchObject({
        statusCode: 200,
        body: {
          ...automaticPlaceholder,
          replies: [expect.objectContaining(manualPlaceholder)],
        },
      })
      const directLeaf = await service.commentGET(hiddenLeaf.id, viewer?.id)
      expect(directLeaf).toMatchObject({
        statusCode: 200,
        body: { ...manualPlaceholder, replies: [] },
      })
      expect(directLeaf.body).not.toHaveProperty("heldReason")
      expect(directLeaf.body).not.toHaveProperty("heldBy")
      expect(
        (await service.commentGET(unrelated.id, viewer?.id)).statusCode
      ).toBe(404)
      expect(await service.commentGET(deleted.id, viewer?.id)).toMatchObject({
        statusCode: 200,
        body: {
          id: deleted.id,
          text: null,
          dateDeleted: dateCreated,
          replies: [],
        },
      })
    }

    for (const viewer of [guest, moderator]) {
      const privateLeaf = {
        id: hiddenLeaf.id,
        text: hiddenLeaf.text,
        isApproved: false,
        isManuallyHeld: true,
        heldReason: "Keep this private",
      }
      const direct = await service.commentGET(hiddenLeaf.id, viewer.id)
      expect(direct).toMatchObject({ statusCode: 200, body: privateLeaf })
      expect(direct.body).not.toHaveProperty("heldBy")
      expect(await readDiscussion(viewer)).toContainEqual(
        expect.objectContaining(privateLeaf)
      )
      expect(
        (await service.commentPOST(hiddenLeaf.id, "Blocked reply", viewer.id))
          .statusCode
      ).toBe(404)
    }

    expect(
      (await service.commentPOST(hiddenParent.id, "Blocked reply", outsider.id))
        .statusCode
    ).toBe(404)
    expect(
      (await service.commentPOST(reply.id, "Visible continuation", outsider.id))
        .statusCode
    ).toBe(201)
    expect(
      (
        await service.commentAPPROVE(
          hiddenParent.id,
          hiddenParent.text!,
          moderator.id
        )
      ).statusCode
    ).toBe(200)
    expect(
      (
        await service.commentPOST(
          hiddenParent.id,
          "Reply after approval",
          outsider.id
        )
      ).statusCode
    ).toBe(201)
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

    for (const viewer of [author, moderator, admin, owner, outsider, undefined]) {
      const response = await service.commentGET(submitted.id, viewer?.id)
      expect(response).toMatchObject({
        statusCode: 200,
        body: {
          id: submitted.id,
          parentId: submitted.parentId,
          text: null,
          dateDeleted: expect.any(Date),
          replies: [],
        },
      })
      if (viewer && viewer !== outsider) {
        expect(response.body).toHaveProperty("deletedReason", "Private reason")
      } else {
        expect(response.body).not.toHaveProperty("deletedReason")
      }
      for (const field of [
        "heldReason",
        "heldBy",
        "isApproved",
        "isManuallyHeld",
        "deletedBy",
        "userId",
        "user",
      ]) {
        expect(response.body).not.toHaveProperty(field)
      }
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
    }
  })

  test("returns a self-deleted leaf without a removal reason to every viewer", async () => {
    const leaf = comment("self-deleted-leaf")
    await comments.insertOne(leaf)
    expect(await service.commentDELETE(leaf.id, author.id)).toMatchObject({
      statusCode: 202,
    })
    for (const viewer of [undefined, outsider, author, moderator]) {
      const response = await service.commentGET(leaf.id, viewer?.id)
      expect(response).toMatchObject({
        statusCode: 200,
        body: {
          id: leaf.id,
          parentId: leaf.parentId,
          text: null,
          dateDeleted: expect.any(Date),
          replies: [],
        },
      })
      for (const field of ["deletedReason", "deletedBy", "userId", "user"]) {
        expect(response.body).not.toHaveProperty(field)
      }
    }
  })

  test("returns a deleted parent and only the viewer's visible replies", async () => {
    const parent = comment("deleted-parent")
    const reply = comment("surviving-reply", { parentId: parent.id })
    const privateReply = held("private-reply", { parentId: parent.id })
    await comments.insertMany([parent, reply, privateReply])
    expect(
      await service.commentDELETE(parent.id, moderator.id, "Removal reason")
    ).toMatchObject({ statusCode: 202 })

    for (const viewer of [undefined, outsider, author, moderator]) {
      const response = await service.commentGET(parent.id, viewer?.id)
      expect(response).toMatchObject({
        statusCode: 200,
        body: {
          id: parent.id,
          parentId: parent.parentId,
          text: null,
          dateDeleted: expect.any(Date),
          replies: expect.arrayContaining([
            expect.objectContaining({
              id: reply.id,
              parentId: parent.id,
              text: reply.text,
            }),
          ]),
        },
      })
      const body = response.body as Comment
      if (viewer === author || viewer === moderator) {
        expect(body.deletedReason).toBe("Removal reason")
        expect(body.replies).toHaveLength(2)
        expect(body.replies).toContainEqual(
          expect.objectContaining({
            id: privateReply.id,
            parentId: parent.id,
            text: privateReply.text,
          })
        )
      } else {
        expect(body).not.toHaveProperty("deletedReason")
        expect(body.replies).toHaveLength(1)
        expect(
          (await service.commentGET(privateReply.id, viewer?.id)).statusCode
        ).toBe(404)
      }
      for (const field of ["deletedBy", "userId", "user"]) {
        expect(body).not.toHaveProperty(field)
      }
      expect(
        (await service.commentGET("missing-comment-id", viewer?.id)).statusCode
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

  test.each([
    {
      action: "hide",
      text: "$A clean edited comment",
      expectedApproved: false,
      expectedReason: "Moderator reason",
    },
    {
      action: "approve",
      text: "$A clean edited comment",
      expectedApproved: true,
      expectedReason: undefined,
    },
    {
      action: "approve",
      text: "See example.org for details",
      expectedApproved: false,
      expectedReason: linkReason,
    },
  ])(
    "uses the hold state at the edit write after $action for $text",
    async ({ action, text, expectedApproved, expectedReason }) => {
      const target = comment("edit-in-flight")
      await comments.insertOne(target)
      const placeHold = () =>
        service.commentHOLD(target.id, "Moderator reason", moderator.id)
      if (action === "approve") expect((await placeHold()).statusCode).toBe(200)

      const update = jest
        .spyOn(Collection.prototype, "findOneAndUpdate")
        .mockImplementationOnce(
          async (filter, change, options?: FindOneAndUpdateOptions) => {
            update.mockRestore()
            const moderation =
              action === "hide"
                ? await placeHold()
                : await service.commentAPPROVE(
                    target.id,
                    target.text!,
                    moderator.id
                  )
            expect(moderation.statusCode).toBe(200)
            return db
              .collection("comments")
              .findOneAndUpdate(filter, change, { ...options })
          }
        )

      try {
        const edited = await service.commentPUT(target.id, text, author.id)
        expect(edited).toMatchObject({
          statusCode: 200,
          body: { text, isApproved: expectedApproved },
        })
        expect(edited.body).not.toHaveProperty("heldBy")
        const stored = await comments.findOne<Comment>({ id: target.id })
        expect(stored).toMatchObject({ text, isApproved: expectedApproved })
        expect(stored?.heldReason).toBe(expectedReason)
        expect((edited.body as Comment).heldReason).toBe(expectedReason)
        if (action === "hide") {
          expect(stored?.heldBy).toBe(moderator.id)
          expect(edited.body).toHaveProperty("isManuallyHeld", true)
        } else {
          expect(stored).not.toHaveProperty("heldBy")
          expect(edited.body).not.toHaveProperty("isManuallyHeld")
        }
      } finally {
        update.mockRestore()
      }
    }
  )

  test("keeps the first actor and reason when two moderators try to hide the same comment", async () => {
    const target = comment("competing-holds")
    await comments.insertOne(target)
    const pendingWrite = jest
      .spyOn(Collection.prototype, "updateOne")
      .mockImplementationOnce(async (filter, change) => {
        pendingWrite.mockRestore()
        expect(
          (await service.commentHOLD(target.id, "Winning reason", admin.id))
            .statusCode
        ).toBe(200)
        return db.collection("comments").updateOne(filter, change)
      })
    try {
      expect(
        (await service.commentHOLD(target.id, "Losing reason", moderator.id))
          .statusCode
      ).toBe(409)
      expect(await comments.findOne({ id: target.id })).toMatchObject({
        text: target.text,
        isApproved: false,
        heldBy: admin.id,
        heldReason: "Winning reason",
      })
    } finally {
      pendingWrite.mockRestore()
    }
  })

  test("requires explicit approval of a moderator's edited text and clears the hold", async () => {
    const target = comment("moderator-own", { userId: moderator.id })
    await comments.insertOne(target)
    expect(
      (await service.commentHOLD(target.id, "Initial reason", admin.id))
        .statusCode
    ).toBe(200)
    const text = "Moderator edit with a link to example.org"
    expect(
      await service.commentPUT(target.id, text, moderator.id)
    ).toMatchObject({
      statusCode: 200,
      body: {
        text,
        isApproved: false,
        isManuallyHeld: true,
        heldReason: "Initial reason",
      },
    })
    expect(
      (await service.commentAPPROVE(target.id, target.text!, moderator.id))
        .statusCode
    ).toBe(409)
    expect(await comments.findOne({ id: target.id })).toMatchObject({
      heldBy: admin.id,
      heldReason: "Initial reason",
    })
    const approve = () => service.commentAPPROVE(target.id, text, moderator.id)
    expect((await approve()).statusCode).toBe(200)
    expect(
      (await service.commentHOLD(target.id, "Second reason", admin.id))
        .statusCode
    ).toBe(200)
    expect((await approve()).statusCode).toBe(200)
    const saved = await comments.findOne({ id: target.id })
    expect(saved).toMatchObject({ text, isApproved: true })
    expect(saved).not.toHaveProperty("heldBy")
    expect(saved).not.toHaveProperty("heldReason")
  })

  test.each(["hold", "approval"])(
    "keeps deletion terminal when it wins a race against %s",
    async action => {
      const target = comment("delete-race")
      await comments.insertOne(target)
      const placeHold = () =>
        service.commentHOLD(target.id, "Removed hold reason", moderator.id)
      const approve = () =>
        service.commentAPPROVE(target.id, target.text!, moderator.id)
      const remove = async () => {
        expect(
          (await service.commentDELETE(target.id, author.id)).statusCode
        ).toBe(202)
      }

      if (action === "hold") {
        const write = jest
          .spyOn(Collection.prototype, "updateOne")
          .mockImplementationOnce(async (filter, change) => {
            write.mockRestore()
            await remove()
            return db.collection("comments").updateOne(filter, change)
          })
        try {
          expect((await placeHold()).statusCode).toBe(404)
        } finally {
          write.mockRestore()
        }
      } else {
        expect((await placeHold()).statusCode).toBe(200)
        const write = jest
          .spyOn(Collection.prototype, "findOneAndUpdate")
          .mockImplementationOnce(
            async (filter, change, options?: FindOneAndUpdateOptions) => {
              write.mockRestore()
              await remove()
              return db
                .collection("comments")
                .findOneAndUpdate(filter, change, { ...options })
            }
          )
        try {
          expect((await approve()).statusCode).toBe(404)
        } finally {
          write.mockRestore()
        }
      }

      expect((await placeHold()).statusCode).toBe(404)
      expect((await approve()).statusCode).toBe(404)
      expect(
        (await service.commentPUT(target.id, "New text", author.id)).statusCode
      ).toBe(404)
      const deleted = await comments.findOne({ id: target.id })
      expect(deleted).toMatchObject({
        text: null,
        dateDeleted: expect.any(Date),
      })
      expect(deleted).not.toHaveProperty("heldBy")
      expect(deleted).not.toHaveProperty("heldReason")
    }
  )

  test.each(["held", "manually held", "deleted"])(
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
          } else if (state === "manually held") {
            expect(
              (
                await service.commentHOLD(
                  parent.id,
                  "Review reason",
                  moderator.id
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
