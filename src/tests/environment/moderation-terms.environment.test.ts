import { spawnSync } from "node:child_process"
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

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
