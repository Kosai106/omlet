import { fs, vol } from "memfs";

jest.mock("fs/promises", () => {
    return fs.promises;
});

jest.mock("fs", () => {
    return fs;
});

import { loadConfig, ConfigError, DEFAULT_INCLUDE_PARAM, DEFAULT_IGNORE_PARAM } from "./userConfig";

const CONFIG_CONTENT = {
    tsconfigPath: "./tsconfig.json",
    aliases: { "@app": "./src" },
    exports: { ".": "./index.ts" },
};

const createTestRepo = (config: unknown = CONFIG_CONTENT) => ({
    "/.omletrc": JSON.stringify(config),
    "/repo/project/package.json": "{ \"name\": \"root\" }",
    "/repo/project/tsconfig.json": "{}",
    "/repo/project/.omletrc": JSON.stringify(config),
    "/repo/project/src/index.ts": "console.log(1);",
    "/repo/project/config-dir/omlet-config": JSON.stringify(config),
});

describe("loadConfig", () => {
    const repoRoot = "/repo";
    const projectRoot = "/repo/project";
    const configFilePath = "/repo/project/config-dir/omlet-config";

    beforeEach(() => {
        vol.reset();
    });

    it("should find and transform a valid config file", async () => {
        vol.fromJSON(createTestRepo());

        const config = await loadConfig(repoRoot, projectRoot, {});

        expect(config).toEqual({
            "configPath": ".omletrc",
            include: DEFAULT_INCLUDE_PARAM,
            ignore: DEFAULT_IGNORE_PARAM,
            tsconfigPath: "./tsconfig.json",
            aliases: { "@app": ["./src"] },
            exports: { ".": ["./index.ts"] },
            workspaces: {},
        });
    });

    it("should load and transform a valid config file from a given location", async () => {
        vol.fromJSON(createTestRepo({
            tsconfigPath: "./tsconfig.json",
            aliases: { "@app": "./src" },
            exports: { ".": "./index.ts" },
        }));

        const config = await loadConfig(repoRoot, projectRoot, {}, configFilePath);

        expect(config).toEqual({
            "configPath": "config-dir/omlet-config",
            include: DEFAULT_INCLUDE_PARAM,
            ignore: DEFAULT_IGNORE_PARAM,
            tsconfigPath: "./tsconfig.json",
            aliases: { "@app": ["./src"] },
            exports: { ".": ["./index.ts"] },
            workspaces: {},
        });
    });

    it("should read hookScript parameter from config file", async () => {
        vol.fromJSON(createTestRepo({
            hookScript: "hook.js",
        }));

        const config = await loadConfig(repoRoot, projectRoot, {}, configFilePath);

        expect(config).toEqual({
            "configPath": "config-dir/omlet-config",
            include: DEFAULT_INCLUDE_PARAM,
            ignore: DEFAULT_IGNORE_PARAM,
            hookScript: "hook.js",
            workspaces: {},
        });
    });

    it("should handle config path that doesn't exist", async () => {
        await expect(loadConfig(repoRoot, projectRoot, {}, "/path/does/not/exist")).rejects.toThrow(
            ConfigError
        );
    });

    it("should handle input path is not a file", async () => {
        vol.fromJSON(createTestRepo());

        await expect(loadConfig(repoRoot, projectRoot, {}, projectRoot)).rejects.toThrow(
            ConfigError
        );
    });

    it("should not load config file outside of repository", async () => {
        vol.fromJSON(createTestRepo());

        const config = await loadConfig(repoRoot, repoRoot, {});

        expect(config).toEqual({
            include: DEFAULT_INCLUDE_PARAM,
            ignore: DEFAULT_IGNORE_PARAM,
            workspaces: {},
        });
    });

    describe("when CLI params provided", () => {
        it("should concatenate given ignore params with default ignore params", async () => {
            vol.fromJSON(createTestRepo());

            const config = await loadConfig(repoRoot, projectRoot, {
                ignore: ["ignore/this/path"],
            });

            expect(config).toEqual({
                "configPath": ".omletrc",
                include: DEFAULT_INCLUDE_PARAM,
                ignore: [
                    "ignore/this/path",
                    ...DEFAULT_IGNORE_PARAM,
                ],
                tsconfigPath: "./tsconfig.json",
                aliases: { "@app": ["./src"] },
                exports: { ".": ["./index.ts"] },
                workspaces: {},
            });
        });

        it("should override default include params with the given include patterns", async () => {
            vol.fromJSON(createTestRepo());

            const config = await loadConfig(repoRoot, projectRoot, {
                include: ["include/this/path"],
            });

            expect(config).toEqual({
                "configPath": ".omletrc",
                include: ["include/this/path"],
                ignore: DEFAULT_IGNORE_PARAM,
                "tsconfigPath": "./tsconfig.json",
                aliases: { "@app": ["./src"] },
                exports: { ".": ["./index.ts"] },
                workspaces: {},
            });
        });

        it("should override hookScript parameter", async () => {
            vol.fromJSON(createTestRepo({
                hookScript: "hook-in-config.js",
            }));

            const config = await loadConfig(repoRoot, projectRoot, {
                hookScript: "hook-in-cli-params.js",
            });

            expect(config).toEqual({
                "configPath": ".omletrc",
                include: DEFAULT_INCLUDE_PARAM,
                ignore: DEFAULT_IGNORE_PARAM,
                hookScript: "hook-in-cli-params.js",
                workspaces: {},
            });
        });
    });

    describe("invalid config file", () => {
        it("should throw an error when there is an invalid field at root", async () => {
            vol.fromJSON(createTestRepo({ "this": "is", "not": "valid" }));

            await expect(loadConfig(repoRoot, projectRoot, {}))
                .rejects
                .toThrowErrorMatchingInlineSnapshot("\"The field \"this\" is unknown.\"");
        });

        it("should throw an error when include is empty array", async () => {
            vol.fromJSON(createTestRepo({ include: [] }));

            await expect(loadConfig(repoRoot, projectRoot, {}))
                .rejects
                .toThrowErrorMatchingInlineSnapshot("\"The field \"include\" needs at least 1 item.\"");
        });

        it("should throw an error when an array field has a non-string value", async () => {
            vol.fromJSON(createTestRepo({ include: ["foo", "bar", 1] }));

            await expect(loadConfig(repoRoot, projectRoot, {}))
                .rejects
                .toThrowErrorMatchingInlineSnapshot("\"The field \"include/2\" must be of type \"string\".\"");
        });

        it("should throw an error when a string field has a non-string value", async () => {
            vol.fromJSON(createTestRepo({ hookScript: ["foo", "bar", 1] }));

            await expect(loadConfig(repoRoot, projectRoot, {}))
                .rejects
                .toThrowErrorMatchingInlineSnapshot("\"The field \"hookScript\" must be of type \"string\".\"");
        });

        it("should throw an error when a map field has a non-object value", async () => {
            vol.fromJSON(createTestRepo({ workspaces: ["foo", "bar", "hello"] }));

            await expect(loadConfig(repoRoot, projectRoot, {}))
                .rejects
                .toThrowErrorMatchingInlineSnapshot("\"The field \"workspaces\" must be of type \"object\".\"");
        });

        it("should throw an error when exports has an invalid type", async () => {
            vol.fromJSON(createTestRepo({ exports: false }));

            await expect(loadConfig(repoRoot, projectRoot, {}))
                .rejects
                .toThrowErrorMatchingInlineSnapshot("\"The field \"exports\" must be of type \"string\", \"array\", or \"object\".\"");
        });

        it("should throw an error when an alias has an invalid type", async () => {
            vol.fromJSON(createTestRepo({ aliases: { "path/for/alias": false } }));

            await expect(loadConfig(repoRoot, projectRoot, {}))
                .rejects
                .toThrowErrorMatchingInlineSnapshot("\"The field \"aliases/path~1for~1alias\" must be of type \"string\" or \"array\".\"");
        });

        it("should throw an error when an there is an invalid field for a workspace project", async () => {
            vol.fromJSON(createTestRepo({ workspaces: { "acme-design": { "ingore": "field" } } }));

            await expect(loadConfig(repoRoot, projectRoot, {}))
                .rejects
                .toThrowErrorMatchingInlineSnapshot("\"The field \"workspaces/acme-design/ingore\" is unknown.\"");
        });
    });

    describe("when package specific configuration specified", () => {
        it("should group package configurations under the workspaces section", async () => {
            const inputConfig = {
                ...CONFIG_CONTENT,
                workspaces: {
                    "@test-project/foo": {},
                    "@test-project/bar": {},
                },
            };

            vol.fromJSON(createTestRepo(inputConfig));

            const config = await loadConfig(repoRoot, projectRoot, {});

            expect(config.workspaces).toBeDefined();
            expect(Object.keys(config.workspaces!)).toEqual(Object.keys(inputConfig.workspaces));
        });

        it("should have separate configuration for each package", async () => {
            const inputConfig = {
                ...CONFIG_CONTENT,
                workspaces: {
                    "@test-project/foo": {
                        tsconfigPath: "./config/tsconfig-foo.json",
                        aliases: { "@lib": ["./src/common"] },
                    },
                    "@test-project/bar": {
                        tsconfigPath: "./config/tsconfig-bar.json",
                        aliases: { "@utils/*": ["./src/utils/*/index.js"] },
                        exports: {
                            "./lib/*:": ["./src/common/*.index.js", "./legacy/common/*.index.js"],
                        },
                    },
                },
            };

            vol.fromJSON(createTestRepo(inputConfig));

            const config = await loadConfig(repoRoot, projectRoot, {});

            expect(config).toEqual({
                "configPath": ".omletrc",
                "include": DEFAULT_INCLUDE_PARAM,
                "ignore": DEFAULT_IGNORE_PARAM,
                "tsconfigPath": "./tsconfig.json",
                "aliases": {
                    "@app": ["./src"],
                },
                "exports": {
                    ".": ["./index.ts"],
                },
                "workspaces": {
                    "@test-project/foo": {
                        "tsconfigPath": "./config/tsconfig-foo.json",
                        "aliases": {
                            "@lib": ["./src/common"],
                        },
                    },
                    "@test-project/bar": {
                        "tsconfigPath": "./config/tsconfig-bar.json",
                        "aliases": {
                            "@utils/*": ["./src/utils/*/index.js"],
                        },
                        "exports": {
                            "./lib/*:": ["./src/common/*.index.js", "./legacy/common/*.index.js"],
                        },
                    },
                },
            });
        });
    });
});
