const path = require("path");

module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: [
        "@typescript-eslint",
    ],
    parserOptions: {
        project: path.join(__dirname, "tsconfig.json")
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    rules: {
        "@typescript-eslint/indent": ["error", 4],
        "@typescript-eslint/quotes": ["error", "double"],
        "@typescript-eslint/semi": ["error", "always"],
        "@typescript-eslint/space-before-function-paren": "off",
        "@typescript-eslint/member-delimiter-style": ["error", {
            "multiline": {
                "delimiter": "semi",
                "requireLast": true
            },
            "singleline": {
                "delimiter": "semi",
                "requireLast": true
            },
            "multilineDetection": "brackets"
        }],
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "no-inner-declarations": "off"
    }
};
