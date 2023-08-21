import { defineConfig } from "cypress"

export default defineConfig({
  defaultCommandTimeout: 15000,
  video: false,
  viewportHeight: 1024,
  viewportWidth: 1536,

  e2e: {
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config)
    },
    baseUrl: "http://localhost:7070",
    // baseUrl: "https://simple-comment.netlify.app",
    excludeSpecPattern: "**/examples/*.spec.js",
    experimentalRunAllSpecs: true,
  },
})
