import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, test } from "vitest"

const readComponentSource = (componentPath: string) =>
  readFileSync(resolve(process.cwd(), componentPath), "utf8")

describe("SimpleComment auth cleanup source guards", () => {
  test("SimpleComment no longer installs the temporary auth store bridge", () => {
    const simpleCommentSource = readComponentSource(
      "src/components/SimpleComment.svelte"
    )

    expect(simpleCommentSource).not.toMatch(/\bcreateAuthStoreBridge\b/)
    expect(simpleCommentSource).not.toMatch(/\bcurrentUserStore\b/)
  })
})
