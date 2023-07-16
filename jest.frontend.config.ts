const merge = require("merge")
const ts_preset = require("ts-jest/jest-preset")

const mergedConfig = merge.recursive(
  ts_preset /** placeholder for other presets */
)
export default {
  ...mergedConfig,
  clearMocks: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  resetMocks: true,
  roots: ["<rootDir>/src/tests/frontend/"],
  testPathIgnorePatterns: ["\\\\node_modules\\\\", "RAW", ".js$"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.frontend.json",
        isolatedModules: true,
        useESM: true
      }
    ]
  }
}
