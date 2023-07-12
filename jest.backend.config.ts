export default {
  clearMocks: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  preset: "./jest.preset.ts",
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.netlify.functions.json',
    },
  },
  roots: ['<rootDir>/src/tests/backend/'],
  testPathIgnorePatterns: ["\\\\node_modules\\\\", "RAW", ".js$"],
  resetMocks: true
}
