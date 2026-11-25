import { expect, jest, test } from "@jest/globals"
import { Privilege } from "../../lib/simple-comment-types"

test("submits writable profile fields from an account response", async () => {
  const env = jest.replaceProperty(process, "env", {
    ...process.env,
    SIMPLE_COMMENT_API_URL: "https://comments.example.com/api",
  })
  const fetch = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(null, { status: 204 }))

  try {
    const { updateUser } = await import("../../apiClient")
    const account = {
      id: "regular-account",
      name: "New Name",
      email: "reader+comments@example.com",
      privilege: Privilege.User,
      isAdmin: false,
      isModerator: false,
      isOwner: false,
      isVerified: true,
      challenge: "guest-challenge",
    }

    await expect(updateUser(account)).resolves.toMatchObject({
      status: 204,
      ok: true,
    })
    expect(fetch).toHaveBeenCalledWith(
      "https://comments.example.com/api/user/regular-account",
      {
        body: "name=New%20Name&email=reader%2Bcomments%40example.com",
        method: "PUT",
        credentials: "include",
      }
    )
  } finally {
    fetch.mockRestore()
    env.restore()
  }
})
