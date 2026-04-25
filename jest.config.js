/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testMatch: [
    "<rootDir>/tests/unit/**/*.test.ts",
    "<rootDir>/tests/integration/**/*.test.ts",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "<rootDir>/tests/__mocks__/fileMock.js",
    "\\.(jpg|jpeg|png|gif|svg|webp|ico)$": "<rootDir>/tests/__mocks__/fileMock.js",
  },
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/tests/e2e/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};

module.exports = config;
