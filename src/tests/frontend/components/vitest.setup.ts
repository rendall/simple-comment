import { cleanup } from "@testing-library/svelte"
import "@testing-library/jest-dom/vitest"
import { afterEach, beforeEach } from "vitest"

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})
