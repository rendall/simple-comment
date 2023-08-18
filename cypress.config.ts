import { defineConfig } from "cypress"

export default defineConfig({
  defaultCommandTimeout: 15000,
  video: false,
  viewportHeight: 1024,
  viewportWidth: 1536,

  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config)
    },
    baseUrl: "http://localhost:7070",
    excludeSpecPattern: "**/examples/*.spec.js",
    experimentalRunAllSpecs: true,
  },

  component: {
    devServer: {
      framework: "svelte",
      bundler: "webpack",
    },
  },
})
