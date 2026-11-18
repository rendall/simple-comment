import { expect, it } from "@jest/globals"
import { execFile } from "node:child_process"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

// Run webpack and the emitted CommonJS bundle in Node, outside Jest's module loader.
// Use the production configuration, changing only the entry and output directory.
const smokeScript = `
  const path = require("node:path")
  const webpack = require("webpack")
  const configuration = require("./webpack.netlify.functions.cjs")
  const outputDirectory = process.argv[1]
  const compiler = webpack({
    ...configuration,
    entry: { notification: "./src/lib/ResendNotificationService.ts" },
    output: { ...configuration.output, path: outputDirectory },
  })

  compiler.run(async (error, stats) => {
    try {
      if (error) throw error
      if (stats.hasErrors()) {
        throw new Error(stats.toString({ all: false, errors: true }))
      }

      const requestUrls = []
      globalThis.fetch = async url => {
        requestUrls.push(url)
        return new Response(JSON.stringify({ id: "synthetic-provider-id" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      const { ResendNotificationService } = require(
        path.join(outputDirectory, "notification.cjs")
      )
      const service = new ResendNotificationService({
        provider: "resend",
        apiKey: "re_synthetic_bundle_key",
        from: "sender@example.com",
        moderatorContactEmails: ["moderator@example.com"],
      })
      const result = await service.notifyModerators("Synthetic bundle smoke test")
      process.stdout.write(JSON.stringify({ result, requestUrls }))
    } catch (error) {
      console.error(error.message)
      process.exitCode = 1
    } finally {
      compiler.close(error => {
        if (error) {
          console.error(error.message)
          process.exitCode = 1
        }
      })
    }
  })
`

it("bundles Resend for Netlify and sends through the bundled default SDK client", async () => {
  const outputDirectory = await mkdtemp(
    join(tmpdir(), "simple-comment-resend-bundle-")
  )
  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      ["-e", smokeScript, outputDirectory],
      {
        cwd: resolve(__dirname, "../../.."),
        env: {
          ...process.env,
          NODE_ENV: "production",
          RESEND_DEBUG: "false",
        },
        timeout: 60000,
      }
    )

    expect(JSON.parse(stdout)).toEqual({
      result: { statusCode: 202, body: "Emails sent successfully" },
      requestUrls: ["https://api.resend.com/emails"],
    })
  } finally {
    await rm(outputDirectory, { recursive: true, force: true })
  }
}, 75000)
