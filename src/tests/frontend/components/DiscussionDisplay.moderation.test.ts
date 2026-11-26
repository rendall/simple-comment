import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/svelte"
import { tick } from "svelte"
import { writable } from "svelte/store"
import { beforeEach, expect, test, vi } from "vitest"
import {
  approveComment,
  deleteComment,
  getOneDiscussion,
  postComment,
  putComment,
} from "../../../apiClient"
import DiscussionDisplay from "../../../components/DiscussionDisplay.svelte"
import SimpleComment from "../../../components/SimpleComment.svelte"
import * as auth from "../../../lib/auth-service"
import type {
  Comment,
  Discussion,
  ServerResponse,
  User,
} from "../../../lib/simple-comment-types"
import { Privilege } from "../../../lib/simple-comment-types"

vi.mock("../../../apiClient", () => ({
  approveComment: vi.fn(),
  createGuestUser: vi.fn(),
  createNewTopic: vi.fn(),
  createUser: vi.fn(),
  deleteAuth: vi.fn(),
  deleteComment: vi.fn(),
  getGuestToken: vi.fn(),
  getOneDiscussion: vi.fn(),
  getOneUser: vi.fn(),
  postAuth: vi.fn(),
  postComment: vi.fn(),
  putComment: vi.fn(),
  updateUser: vi.fn(),
  verifySelf: vi.fn(),
  verifyUser: vi.fn(),
}))

vi.mock("../../../frontend-utilities", async importOriginal => ({
  ...(await importOriginal<typeof import("../../../frontend-utilities")>()),
  idIconDataUrl: () => "data:image/png;base64,",
}))

const dateCreated = new Date()
const discussionId = "moderation-topic"
const author: User = {
  id: "author",
  name: "Comment author",
  email: "author@example.test",
}
const moderator: User = {
  id: "reviewer",
  name: "Reviewer",
  email: "reviewer@example.test",
  privilege: Privilege.Moderator,
  isModerator: true,
  isAdmin: false,
}
const comment: Comment = {
  id: "first-comment",
  parentId: discussionId,
  dateCreated,
  text: "Original published text",
  isApproved: true,
  user: author,
}
const held: Comment = {
  ...comment,
  text: "Private held text",
  isApproved: false,
  heldReason: "Contains a link.",
}
const child: Comment = {
  ...comment,
  id: "child-comment",
  parentId: comment.id,
  text: "Independently visible reply",
}
const success = <T>(body: T, status = 200): ServerResponse<T> => ({
  ok: true,
  status,
  statusText: "Success",
  body,
})
const discussion = (...replies: Comment[]): ServerResponse<Discussion> =>
  success({
    id: discussionId,
    title: "Moderation",
    isLocked: false,
    dateCreated,
    replies,
  })

const showDiscussion = (currentUser?: User) => {
  const authService = auth.createAuthService({ initialUser: currentUser })
  return render(DiscussionDisplay, {
    discussionId,
    authService,
    currentUser,
  })
}

const rowFor = (text: string) =>
  within(screen.getByText(text).closest("article")!)
const openMenu = (text: string) =>
  fireEvent.click(rowFor(text).getByRole("button", { name: /more options/ }))

beforeEach(() => {
  vi.resetAllMocks()
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Element.prototype.animate ??= vi.fn(
    () => ({ cancel: vi.fn(), finished: Promise.resolve() }) as never
  )
})

test("shows the saved publication state of a create and a nested edit", async () => {
  vi.mocked(getOneDiscussion).mockResolvedValue(discussion(comment, child))
  vi.mocked(postComment).mockResolvedValue(
    success({ ...held, id: "new-held" }, 201)
  )
  const updated = {
    ...child,
    text: "The saved edit from the server",
    isApproved: false,
    heldReason: "Contains a private term.",
  }
  vi.mocked(putComment).mockResolvedValue(success(updated))
  showDiscussion(author)
  await screen.findByText(child.text!)

  await fireEvent.input(screen.getByPlaceholderText("Your comment"), {
    target: { value: "Submitted draft" },
  })
  await fireEvent.click(screen.getByRole("button", { name: "Add comment" }))
  await screen.findByText(held.text!)
  expect(postComment).toHaveBeenCalledWith(discussionId, "Submitted draft")
  expect(rowFor(held.text!).getByRole("status")).toHaveTextContent(
    held.heldReason!
  )
  expect(
    rowFor(held.text!).queryByRole("button", { name: "Reply" })
  ).not.toBeInTheDocument()
  await openMenu(held.text!)
  expect(
    rowFor(held.text!).queryByRole("button", { name: "Approve" })
  ).not.toBeInTheDocument()

  await openMenu(child.text!)
  await fireEvent.click(
    rowFor(child.text!).getByRole("button", { name: "Edit" })
  )
  await fireEvent.input(screen.getByPlaceholderText("Your edit"), {
    target: { value: "Submitted edit" },
  })
  await fireEvent.click(screen.getByRole("button", { name: "Update comment" }))
  await screen.findByText(updated.text)
  expect(putComment).toHaveBeenCalledWith(child.id, "Submitted edit")
  expect(rowFor(updated.text).getByRole("status")).toHaveTextContent(
    updated.heldReason
  )
  expect(
    rowFor(updated.text).queryByRole("button", { name: "Reply" })
  ).not.toBeInTheDocument()
  expect(screen.queryByText(child.text!)).not.toBeInTheDocument()
})

test("lets a level-one moderator re-review changed text after a stale approval", async () => {
  const revised = { ...held, text: "New held text after moderator review" }
  const published = { ...revised, isApproved: true, heldReason: undefined }
  vi.mocked(getOneDiscussion)
    .mockResolvedValueOnce(discussion(held))
    .mockResolvedValueOnce(discussion(revised))
    .mockResolvedValue(discussion(published))
  vi.mocked(approveComment)
    .mockRejectedValueOnce({ status: 409 })
    .mockResolvedValueOnce(success("Comment approved"))
  showDiscussion(moderator)
  await screen.findByText(held.text!)

  await openMenu(held.text!)
  await fireEvent.click(
    rowFor(held.text!).getByRole("button", { name: "Approve" })
  )
  expect(approveComment).toHaveBeenNthCalledWith(1, held.id, held.text)
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Review the updated text"
  )
  await screen.findByText(revised.text)
  const revisedRow = rowFor(revised.text)
  if (!revisedRow.queryByRole("button", { name: "Approve" }))
    await openMenu(revised.text)
  await fireEvent.click(revisedRow.getByRole("button", { name: "Approve" }))
  expect(approveComment).toHaveBeenNthCalledWith(2, revised.id, revised.text)
  expect(
    await revisedRow.findByRole("button", { name: "Reply" })
  ).toBeInTheDocument()
  expect(revisedRow.queryByRole("status")).not.toBeInTheDocument()
})

test("requires a moderator removal reason and refreshes the remaining thread", async () => {
  const reason = "Reason shown only to authorized readers"
  const tombstone: Comment = {
    id: comment.id,
    parentId: discussionId,
    dateCreated,
    dateDeleted: dateCreated,
    text: null,
    deletedReason: reason,
  }
  vi.mocked(getOneDiscussion)
    .mockResolvedValueOnce(discussion(held, child))
    .mockResolvedValue(discussion(tombstone, child))
  vi.mocked(deleteComment).mockResolvedValue(success("Comment deleted", 202))
  showDiscussion(moderator)
  await screen.findByText(held.text!)
  await openMenu(held.text!)
  await fireEvent.click(
    rowFor(held.text!).getByRole("button", { name: "Delete" })
  )
  const remove = screen.getByRole("button", { name: "Remove comment" })
  expect(remove).toBeDisabled()
  await fireEvent.input(screen.getByLabelText("Reason for removal"), {
    target: { value: ` ${reason} ` },
  })
  await fireEvent.click(remove)

  expect(deleteComment).toHaveBeenCalledWith(held.id, reason)
  await screen.findByText(reason)
  expect(screen.queryByText(held.text!)).not.toBeInTheDocument()
  expect(screen.getByText(child.text!)).toBeInTheDocument()
})

test("keeps visible replies beneath a redacted held ancestor", async () => {
  const placeholder: Comment = {
    id: held.id,
    parentId: discussionId,
    dateCreated,
    isApproved: false,
    text: null,
  }
  vi.mocked(getOneDiscussion).mockResolvedValue(discussion(placeholder, child))
  showDiscussion()
  const label = "This comment is awaiting moderation."
  await screen.findByText(label)
  expect(screen.queryByText(held.heldReason!)).not.toBeInTheDocument()
  expect(screen.getByText(label).closest("li")?.id).toBe(held.id)
  expect(
    rowFor(label).queryByRole("button", { name: "Reply" })
  ).not.toBeInTheDocument()
  expect(
    rowFor(child.text!).getByRole("button", { name: "Reply" })
  ).toBeInTheDocument()
})

test("discards private content on logout and ignores requests from older identities", async () => {
  const currentUser = writable<User | undefined>(moderator)
  const authService = auth.createAuthService({ initialUser: moderator })
  vi.spyOn(auth, "createAuthService").mockReturnValueOnce({
    ...authService,
    currentUser,
    init: vi.fn().mockResolvedValue(undefined),
  })
  const staleRead = Promise.withResolvers<ServerResponse<Discussion>>()
  const stalePost = Promise.withResolvers<ServerResponse<Comment>>()
  const outsider: User = {
    id: "outsider",
    name: "Another reader",
    email: "outsider@example.test",
  }
  const publicComment = {
    ...comment,
    id: "public-comment",
    text: "Visible to the next account",
  }
  const removed: Comment = {
    ...comment,
    id: "removed-comment",
    dateDeleted: dateCreated,
    text: null,
    deletedReason: "Private removal reason from the previous identity",
  }
  vi.mocked(getOneDiscussion)
    .mockResolvedValueOnce(discussion(held, removed))
    .mockReturnValueOnce(staleRead.promise)
    .mockResolvedValue(discussion(publicComment))
  vi.mocked(postComment).mockReturnValueOnce(stalePost.promise)

  render(SimpleComment, {
    discussionId,
    title: "Moderation",
    currentUser: moderator,
  })
  await screen.findByText(held.text!)
  expect(screen.getByText(removed.deletedReason!)).toBeInTheDocument()
  await fireEvent.input(screen.getByPlaceholderText("Your comment"), {
    target: { value: "Old session draft" },
  })
  await fireEvent.click(screen.getByRole("button", { name: "Add comment" }))
  expect(postComment).toHaveBeenCalledWith(discussionId, "Old session draft")

  currentUser.set(undefined)
  await waitFor(() => expect(getOneDiscussion).toHaveBeenCalledTimes(2))
  expect(screen.queryByText(held.text!)).not.toBeInTheDocument()
  expect(screen.queryByText(removed.deletedReason!)).not.toBeInTheDocument()

  currentUser.set(outsider)
  await screen.findByText(publicComment.text)
  const lateText = "Private mutation response from the previous identity"
  stalePost.resolve(
    success({ ...held, id: "old-session-post", text: lateText }, 201)
  )
  staleRead.resolve(discussion(held, removed))
  await Promise.all([staleRead.promise, stalePost.promise])
  await tick()
  expect(screen.getByText(publicComment.text)).toBeInTheDocument()
  expect(screen.queryByText(held.text!)).not.toBeInTheDocument()
  expect(screen.queryByText(removed.deletedReason!)).not.toBeInTheDocument()
  expect(screen.queryByText(lateText)).not.toBeInTheDocument()
})
