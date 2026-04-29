module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/tests/e2e"],
    globalSetup: "<rootDir>/tests/e2e/globalSetup.ts",
    globalTeardown: "<rootDir>/tests/e2e/globalTeardown.ts",
    setupFilesAfterEnv: ["<rootDir>/tests/e2e/setupFramework.ts"],
};
