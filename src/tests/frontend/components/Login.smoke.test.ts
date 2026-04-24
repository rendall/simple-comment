import { render, screen } from "@testing-library/svelte"
import { describe, expect, test, vi } from "vitest"
import { verifySelf } from "../../../apiClient"
import Login from "../../../components/Login.svelte"

vi.mock("../../../apiClient", () => ({
  createGuestUser: vi.fn(),
  createUser: vi.fn(),
  deleteAuth: vi.fn(),
  getGuestToken: vi.fn(),
  getOneUser: vi.fn(),
  postAuth: vi.fn(),
  updateUser: vi.fn(),
  verifySelf: vi.fn(),
  verifyUser: vi.fn(),
}))

const mockVerifySelf = vi.mocked(verifySelf)

describe("Login smoke", () => {
  test("renders the login, signup, and guest tabs", async () => {
    mockVerifySelf.mockRejectedValue({ status: 401 })

    render(Login)

    expect(
      await screen.findByRole("button", {
        name: "Login",
      })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Signup" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guest" })).toBeInTheDocument()
  })
})
