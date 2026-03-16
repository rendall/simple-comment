import path from "path"
import { defineConfig, loadEnv } from "vite"
import sveltePreprocess from "svelte-preprocess"

export default defineConfig(async ({ mode }) => {
  const isProduction = mode === "production"
  const { svelte } = await import("@sveltejs/vite-plugin-svelte")
  const env = loadEnv(mode, process.cwd(), "")
  const backendTarget = "http://localhost:9999"
  const viteRoot = path.resolve(__dirname, "src/entry")
  const publicDir = path.resolve(__dirname, "src/static")
  const distDir = path.resolve(__dirname, "dist")
  const sourceCssPath = path.resolve(
    __dirname,
    "src/scss/simple-comment-style.scss"
  )
  const frontendApiUrl =
    env.VITE_SIMPLE_COMMENT_API_URL ?? env.SIMPLE_COMMENT_API_URL
  const frontendApiUrlDefine =
    frontendApiUrl === undefined ? "undefined" : JSON.stringify(frontendApiUrl)
  const toFsPath = (targetPath: string) =>
    `/@fs/${targetPath.replace(/\\/g, "/")}`
  const sourceStyleLink = `<link rel="stylesheet" type="text/css" href="${toFsPath(
    sourceCssPath
  )}" />`
  const buildStyleLinkPattern =
    /<link[^>]+href="\/css\/simple-comment-style\.css"[^>]*>/m

  return {
    root: viteRoot,
    publicDir,
    define: {
      "process.env.SIMPLE_COMMENT_API_URL": frontendApiUrlDefine,
    },
    plugins: [
      svelte({
        emitCss: false,
        preprocess: [sveltePreprocess()],
        compilerOptions: { dev: !isProduction },
      }),
      {
        name: "simple-comment-dev-html-entries",
        transformIndexHtml(html, ctx) {
          if (!ctx?.server) return html

          const pathname = ctx.path.split("?")[0]

          if (pathname === "/" || pathname === "/index.html") {
            return html.replace(buildStyleLinkPattern, sourceStyleLink)
          }

          if (
            pathname === "/icebreakers/" ||
            pathname === "/icebreakers/index.html"
          ) {
            return html.replace(buildStyleLinkPattern, sourceStyleLink)
          }

          return html
        },
      },
    ],
    build: {
      outDir: distDir,
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        input: {
          index: path.resolve(viteRoot, "index.html"),
          icebreakers: path.resolve(viteRoot, "icebreakers/index.html"),
          "simple-comment": path.resolve(__dirname, "src/simple-comment.ts"),
          "simple-comment-icebreakers": path.resolve(
            __dirname,
            "src/simple-comment-icebreakers.ts"
          ),
          "simple-comment-style": path.resolve(
            __dirname,
            "src/scss/simple-comment-style.scss"
          ),
        },
        output: {
          entryFileNames: "js/[name].js",
          assetFileNames: assetInfo => {
            const name = assetInfo.name ?? ""
            if (name.endsWith(".css")) return "css/[name][extname]"
            return "assets/[name][extname]"
          },
        },
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5000,
      proxy: {
        "/.netlify/functions": {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 5000,
      proxy: {
        "/.netlify/functions": {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
