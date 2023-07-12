export default {
  clearMocks: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  globals: { 'ts-jest': { tsconfig: 'tsconfig.frontend.json', }, },
  preset: "./jest.preset.ts",
  resetMocks: true,
  roots: ['<rootDir>/src/tests/frontend/'],
  testPathIgnorePatterns: ["\\\\node_modules\\\\", "RAW", ".js$"],
}
