const merge = require("merge")
const ts_preset = require("ts-jest/jest-preset")
const jest_mongodb_preset = require("@shelf/jest-mongodb/jest-preset")

const mergedConfig = merge.recursive(ts_preset, jest_mongodb_preset)
const presetSetupFiles = Array.isArray(mergedConfig.setupFiles)
  ? mergedConfig.setupFiles
  : mergedConfig.setupFiles
    ? [mergedConfig.setupFiles]
    : []
export default {
  ...mergedConfig,
  clearMocks: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  resetMocks: true,
  setupFiles: [...presetSetupFiles, "<rootDir>/src/tests/backend/setup-env.ts"],
  roots: ["<rootDir>/src/tests/backend/"],
  testPathIgnorePatterns: ["\\\\node_modules\\\\", "RAW", ".js$"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.netlify.functions.json" }],
    "^.+\\.js$": "babel-jest",
  },
  transformIgnorePatterns: ["/node_modules/(?!normalize-url)"],
}
