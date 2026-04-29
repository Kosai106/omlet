const backend = {
    globals: {
        "ts-jest": {
            tsconfig: "tsconfig.backend.json"
        }
    },
    preset: "ts-jest",
    roots: ["<rootDir>/src/backend", "<rootDir>/tests/backend/"],
    testEnvironment: "node",
    setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
    globalSetup: "<rootDir>/tests/globalSetup.ts",
    globalTeardown: "<rootDir>/tests/globalTeardown.ts",
}

const frontend = {
    preset: "ts-jest",
    roots: ["<rootDir>/src/frontend"],
    testEnvironment: "jsdom"
}

module.exports = {
    projects: [
        backend,
        frontend
    ],
}
