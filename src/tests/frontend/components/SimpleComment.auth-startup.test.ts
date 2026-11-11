import { render, screen, waitFor } from "@testing-library/svelte"
import { describe, expect, test, vi } from "vitest"
import { verifySelf } from "../../../apiClient"
import SimpleComment from "../../../components/SimpleComment.svelte"

vi.mock("../../../apiClient", () => ({
  verifySelf: vi.fn(),
}))

// Keep the discussion and its Login components absent during auth startup.
vi.mock("../../../components/DiscussionDisplay.svelte", () => ({
  default: () => {},
}))

vi.mock("../../../frontend-utilities", async importOriginal => {
  const actual =
    await importOriginal<typeof import("../../../frontend-utilities")>()

  return {
    ...actual,
    idIconDataUrl: vi.fn(() => "data:image/png;base64,"),
  }
})

describe("SimpleComment auth startup", () => {
  test("verifies and displays the current user without a mounted Login", async () => {
    Element.prototype.animate =
      Element.prototype.animate ??
      vi.fn(() => ({ cancel: vi.fn(), finished: Promise.resolve() }) as never)
    vi.mocked(verifySelf).mockResolvedValue({
      id: "alice-user",
      name: "Alice Example",
      email: "alice@example.com",
    })

    render(
      SimpleComment as never,
      { discussionId: "topic-1", title: "Test discussion" } as never
    )

    await waitFor(() => {
      expect(screen.getByText("Alice Example")).toBeInTheDocument()
    })
    expect(verifySelf).toHaveBeenCalledTimes(1)
    expect(document.querySelector("section.simple-comment-login")).toBeNull()
  })
})
