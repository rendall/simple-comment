import { spawnSync } from "node:child_process"
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"

describe("the Netlify moderation terms fetch", () => {
  let workspace: string

  beforeEach(() => {
    workspace = mkdtempSync(join(tmpdir(), "simple-comment-fetch-terms-"))
  })

  afterEach(() => {
    rmSync(workspace, { recursive: true, force: true })
  })

  const runFetch = (env: NodeJS.ProcessEnv, mockFetch: string) =>
    spawnSync(
      process.execPath,
      [
        "--import",
        `data:text/javascript,${encodeURIComponent(`globalThis.fetch = ${mockFetch}`)}`,
        resolve("scripts/fetch-moderation-terms.mjs"),
      ],
      { cwd: workspace, encoding: "utf8", env }
    )

  const enabled = {
    SIMPLE_COMMENT_FETCH_MODERATION_TERMS: "true",
    SIMPLE_COMMENT_MODERATION_BLOBS_TOKEN: "test-token",
    SITE_ID: "test-site",
  }

  test("skips the fetch by default and preserves a local list", () => {
    const file = join(workspace, "moderation-terms.txt")
    writeFileSync(file, "local fixture")
    const result = runFetch({}, "() => { throw new Error('Unexpected fetch') }")

    expect(result.error).toBeUndefined()
    expect(result.status).toBe(0)
    expect(readFileSync(file, "utf8")).toBe("local fixture")
  })

  test.each(["head", "download"])(
    "removes an old local list when the Blob is missing at %s",
    missingAt => {
      const file = join(workspace, "moderation-terms.txt")
      writeFileSync(file, "old fixture")
      const result = runFetch(
        enabled,
        `async (url, options) => {
          if (url === "https://blob.invalid/fixture") {
            return new Response(null, { status: 404 })
          }
          if (options.method === "head") {
            return new Response(null, { status: ${missingAt === "head" ? 404 : 200} })
          }
          return Response.json({ url: "https://blob.invalid/fixture" })
        }`
      )

      expect(result.error).toBeUndefined()
      expect(result.status).toBe(0)
      expect(() => readFileSync(file)).toThrow("ENOENT")
    }
  )

  test.each([
    { status: 404, exitCode: 0 },
    { status: 403, exitCode: 1 },
  ])(
    "handles a $status response from the Blob existence check",
    ({ status, exitCode }) => {
      const result = runFetch(
        enabled,
        `async (url, options) => {
        if (!url.endsWith("/test-site/site:moderation/moderation-terms.txt") || options.method !== "head") {
          throw new Error("Unexpected Blob request")
        }
        return new Response(null, { status: ${status} })
      }`
      )

      expect(result.error).toBeUndefined()
      expect(result.status).toBe(exitCode)
      expect(result.stderr).toEqual(
        exitCode ? expect.stringContaining("Could not update") : ""
      )
      expect(() =>
        readFileSync(join(workspace, "moderation-terms.txt"))
      ).toThrow("ENOENT")
    }
  )

  test.each([Buffer.from([0xff, 0x0a]), Buffer.alloc(0)])(
    "replaces an old local list with the exact Blob bytes (%j)",
    bytes => {
      const file = join(workspace, "moderation-terms.txt")
      writeFileSync(file, "old fixture")
      const result = runFetch(
        enabled,
        `async (url, options) => {
          if (url === "https://blob.invalid/fixture") {
            return new Response(new Uint8Array(${JSON.stringify([...bytes])}))
          }
          if (options.method === "head") return new Response(null)
          return Response.json({ url: "https://blob.invalid/fixture" })
        }`
      )

      expect(result.error).toBeUndefined()
      expect(result.status).toBe(0)
      expect(readFileSync(file)).toEqual(bytes)
    }
  )
})

test("the Netlify build preflight rejects a supplied invalid terms file", () => {
  const workspace = mkdtempSync(join(tmpdir(), "simple-comment-build-terms-"))
  try {
    for (const filename of ["package.json", "src/lib/moderation-terms.ts"]) {
      const path = join(workspace, filename)
      mkdirSync(dirname(path), { recursive: true })
      copyFileSync(filename, path)
    }

    writeFileSync(join(workspace, "moderation-terms.txt"), Buffer.from([0xff]))
    const build = spawnSync("yarn", ["run", "build:netlify"], {
      cwd: workspace,
      encoding: "utf8",
    })
    expect(build.error).toBeUndefined()
    expect(build.status).not.toBe(0)
    expect(build.stderr).toContain(
      "The moderation terms file must be readable UTF-8 plain text."
    )
    expect(build.stdout).not.toContain("webpack --config")
  } finally {
    rmSync(workspace, { recursive: true })
  }
})
