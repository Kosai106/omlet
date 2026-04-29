const commonConfig = {
    root: true,
    env: {
        node: true,
        jest: true
    },
    parser: "@typescript-eslint/parser",
    plugins: [
        "@stylistic",
        "@typescript-eslint",
        "import"
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    rules: {
        // @stylistic
        "@stylistic/keyword-spacing": "error",
        "@stylistic/indent": ["error", 4],
        "@stylistic/quotes": ["error", "double", { "allowTemplateLiterals": "avoidEscape", "avoidEscape": true }],
        "@stylistic/semi": ["error", "always"],
        "@stylistic/space-before-function-paren": ["error", {
            "anonymous": "always",
            "named": "never",
            "asyncArrow": "always"
        }],
        "@stylistic/member-delimiter-style": ["error", {
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
        "@stylistic/comma-dangle": ["error", "always-multiline"],
        "@stylistic/no-trailing-spaces": "error",
        "@stylistic/eol-last": "error",
        "@stylistic/object-curly-spacing": ["error", "always"],
        "@stylistic/comma-spacing": ["error", { "before": false, "after": true }],
        "@stylistic/space-infix-ops": "error",
        "@stylistic/no-multi-spaces": "error",
        "@stylistic/space-in-parens": ["error", "never"],
        "@stylistic/key-spacing": "error",

        // @typescript-eslint
        "@typescript-eslint/no-empty-function": "off",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["error", {
            "ignoreRestSiblings": true,
            "argsIgnorePattern": "^_"
        }],
        "@typescript-eslint/unbound-method": "error",
        "@typescript-eslint/no-unnecessary-type-assertion": "error",
        "@typescript-eslint/no-unsafe-argument": "error",
        "@typescript-eslint/no-unsafe-assignment": "error",
        "@typescript-eslint/no-unsafe-call": "error",
        "@typescript-eslint/no-unsafe-member-access": "error",
        "@typescript-eslint/no-unsafe-return": "error",
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/consistent-type-imports": "error",

        // eslint
        "no-undef": "error",
        "eqeqeq": ["error", "always"],
        "no-restricted-globals": ["error", {
            "name": "isFinite",
            "message": "Please use Number.isFinite instead",
        }, {
            "name": "isNaN",
            "message": "Please use Number.isNaN instead",
        }, {
            "name": "parseInt",
            "message": "Please use Number.parseInt instead",
        }],
        "no-restricted-imports": ["error", {
            "patterns": [
                {
                    "group": ["**/frontend/**"]
                },
                {
                    "group": ["**/backend/**"]
                }
            ]
        }],
        "no-duplicate-imports": "error",

        // import
        "import/order": ["error", {
            "newlines-between": "always",
            "groups": [
                ["builtin", "external"],
                "parent",
                "sibling",
                "unknown",
            ],
            "pathGroups": [
                {
                    "pattern": "*.css",
                    "patternOptions": {
                        "matchBase": true
                    },
                    "group": "unknown",
                    "position": "after"
                },
                {
                    "pattern": "react",
                    "group": "builtin",
                    "position": "before"
                }
            ],
            "pathGroupsExcludedImportTypes": ["react"],
            "distinctGroup": true,
            "alphabetize": {
                "order": "asc",
                "caseInsensitive": true,
            },
        }],
        "import/no-default-export": "error",
        "import/no-duplicates": ["error", {"prefer-inline": true}],
        "import/consistent-type-specifier-style": ["error", "prefer-inline"],
        "import/no-extraneous-dependencies": ["error", {
            "devDependencies": ["**/frontend/**", "**/tests/**"]
        }],
    },
};

module.exports = {
    ...commonConfig,
    env: {
        browser: true,
        node: true,
        jest: true
    },
    extends: [
        ...commonConfig.extends,
        "plugin:@tanstack/eslint-plugin-query/recommended"
    ],
    plugins: [
        ...commonConfig.plugins,
        "@tanstack/query"
    ],
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["tsconfig.json", "tsconfig.backend.json"]
    },
    rules: {
        ...commonConfig.rules,
        // @stylistic
        "@stylistic/jsx-indent": ["error", 4, { "checkAttributes": true, "indentLogicalExpressions": true }],

        // eslint
        "no-console": "error",
    },
    ignorePatterns: ["db-migrations/**/*", ".eslintrc.js", "jest.config.js"],
    overrides: [
        {
            "files": ["tests/**"],
            "rules": {
                "@typescript-eslint/no-unsafe-member-access": "off",
                "@typescript-eslint/no-unsafe-call": "off",
                "@typescript-eslint/no-unsafe-assignment": "off",
                "@typescript-eslint/no-unsafe-return": "off",
                "@typescript-eslint/no-explicit-any": "off",
                "no-restricted-imports": "off"
            }
        }
    ]
};
