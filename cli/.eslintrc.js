// @ts-ignore
const commonConfig = require("../.eslintrc");

module.exports = {
    ...commonConfig,
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["tsconfig.json"]
    },
    ignorePatterns: ["node-src/binding.js", "node-src/binding.d.ts", ".eslintrc.js"],
    rules: {
        ...commonConfig.rules,
        "@typescript-eslint/no-restricted-imports": ["error", {
            "paths": ["path", "node:path"],
            "message": "Please use upath unless you specifically need the native path module."
        }]
    }
};
