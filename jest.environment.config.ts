export default {
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests/environment/"],
  // Load real settings only: backend setup-env.ts supplies test fixtures.
  setupFiles: ["dotenv/config"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.netlify.functions.json" }],
  },
}
