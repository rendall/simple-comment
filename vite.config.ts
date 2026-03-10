import path from "path"
import { defineConfig } from "vite"
import sveltePreprocess from "svelte-preprocess"

const mode = process.env.NODE_ENV ?? "development"
const isProduction = mode === "production"

export default defineConfig(async () => {
  const { svelte } = await import("@sveltejs/vite-plugin-svelte")

  return {
    plugins: [
      svelte({
        preprocess: [sveltePreprocess()],
        compilerOptions: { dev: !isProduction },
      }),
    ],
    build: {
      outDir: "dist",
      emptyOutDir: false,
      sourcemap: true,
      rollupOptions: {
        input: {
          "simple-comment": path.resolve(__dirname, "src/simple-comment.ts"),
          "simple-comment-icebreakers": path.resolve(
            __dirname,
            "src/simple-comment-icebreakers.ts"
          ),
        },
        output: {
          entryFileNames: "js/[name].js",
        },
      },
    },
  }
})
