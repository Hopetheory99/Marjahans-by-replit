export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests", "<rootDir>/server", "<rootDir>/shared"],
  testMatch: ["**/__tests__/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^@shared/(.*)$": "<rootDir>/shared/$1",
    "^@/(.*)$": "<rootDir>/client/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: "tsconfig.test.json",
    }],
  },
  collectCoverageFrom: [
    "server/**/*.ts",
    "!server/index.ts",
    "!server/vite.ts",
    "!server/static.ts",
    "shared/**/*.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },
  testTimeout: 10000,
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
};
