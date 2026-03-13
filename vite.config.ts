import path from "path"
import { defineConfig, loadEnv } from "vite"
import sveltePreprocess from "svelte-preprocess"

export default defineConfig(async ({ mode }) => {
  const isProduction = mode === "production"
  const { svelte } = await import("@sveltejs/vite-plugin-svelte")
  const env = loadEnv(mode, process.cwd(), "")
  const frontendApiUrl =
    env.VITE_SIMPLE_COMMENT_API_URL ?? env.SIMPLE_COMMENT_API_URL
  const frontendApiUrlDefine =
    frontendApiUrl === undefined ? "undefined" : JSON.stringify(frontendApiUrl)

  return {
    publicDir: "src/static",
    define: {
      "process.env.SIMPLE_COMMENT_API_URL": frontendApiUrlDefine,
    },
    plugins: [
      svelte({
        emitCss: false,
        preprocess: [sveltePreprocess()],
        compilerOptions: { dev: !isProduction },
      }),
    ],
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        input: {
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
          target: "http://localhost:7070",
          changeOrigin: true,
        },
      },
    },

  }
})
