import { svelte } from "@sveltejs/vite-plugin-svelte"
import sveltePreprocess from "svelte-preprocess"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [
    svelte({
      emitCss: false,
      preprocess: [
        sveltePreprocess({
          typescript: { tsconfigFile: "tsconfig.frontend.json" },
        }),
      ],
      compilerOptions: { dev: true },
    }),
  ],
  test: {
    clearMocks: true,
    css: true,
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    include: ["src/tests/frontend/components/**/*.test.ts"],
    restoreMocks: true,
    setupFiles: ["src/tests/frontend/components/vitest.setup.ts"],
  },
})
