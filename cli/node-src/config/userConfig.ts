import Ajv, { type DefinedError, ValidationError as AjvValidationError } from "ajv";
import { cosmiconfig } from "cosmiconfig";
import fs from "fs/promises";
import upath from "upath";

import { pluralize } from "../stringUtils";

interface InputPackageConfig {
    tsconfigPath?: string;
    aliases?: Record<string, string | string[]>;
    exports?: string | string[] | Record<string, string | string[]>;
}

interface UserConfig extends InputPackageConfig {
    $schema?: string;
    include?: string[];
    ignore?: string[];
    workspaces?: Record<string, InputPackageConfig>;
    hookScript?: string;
}

const ajv = new Ajv();

// Copied from https://github.com/SchemaStore/schemastore/blob/d407be00d8784dadaa14a6df30b824c1499a9742/src/schemas/json/omletrc.json
// Please update the original schema if you need to make changes.
const userSchema = {
    "$async": true,
    "type": "object",
    "properties": {
        "$schema": {
            "type": "string",
            "description": "The schema that the configuration file uses.",
            "const": "https://json.schemastore.org/omletrc.json",
        },
        "include": {
            "type": "array",
            "description": "Filenames or glob patterns that will be included in the scan.",
            "items": { "type": "string" },
            "minItems": 1,
        },
        "ignore": {
            "type": "array",
            "description": "Filenames or glob patterns that will be excluded from the scan.",
            "items": { "type": "string" },
        },
        "tsconfigPath": { "$ref": "#/definitions/tsconfigPath" },
        "aliases": { "$ref": "#/definitions/aliases" },
        "exports": { "$ref": "#/definitions/exports" },
        "workspaces": {
            "type": "object",
            "description": "Package-specific configurations if you have a monorepo.",
            "additionalProperties": {
                "type": "object",
                "description": "Package-specific configuration.",
                "properties": {
                    "tsconfigPath": { "$ref": "#/definitions/tsconfigPath" },
                    "aliases": { "$ref": "#/definitions/aliases" },
                    "exports": { "$ref": "#/definitions/exports" },
                },
                "additionalProperties": false,
            },
        },
        "hookScript": { "type": "string" },
    },
    "additionalProperties": false,
    "definitions": {
        "tsconfigPath": {
            "type": "string",
            "description": "Path to your tsconfig file.",
        },
        "aliases": {
            "type": "object",
            "additionalProperties": {
                "oneOf": [
                    {
                        "type": "string",
                    },
                    {
                        "type": "array",
                        "items": {
                            "type": "string",
                        },
                    },
                ],
            },
        },
        "exports": {
            "oneOf": [
                {
                    "type": "string",
                },
                {
                    "type": "array",
                    "items": {
                        "type": "string",
                    },
                },
                {
                    "type": "object",
                    "additionalProperties": {
                        "oneOf": [
                            {
                                "type": "string",
                            },
                            {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                },
                            },
                        ],
                    },
                },
            ],
        },
    },
};

export type PackageConfig = Omit<InputPackageConfig, "aliases" | "exports"> & {
    aliases?: Record<string, string[]>;
    exports?: Record<string, string[]>;
};

export interface Config extends PackageConfig {
    configPath?: string;
    include: string[];
    ignore: string[];
    workspaces?: Record<string, PackageConfig>;
    hookScript?: string;
}

function transformAliases(aliases: UserConfig["aliases"]): Config["aliases"] {
    if (aliases === undefined) {
        return aliases;
    }

    return Object.fromEntries(
        Object.entries(aliases).map(([name, paths]) =>
            [name, Array.isArray(paths) ? paths : [paths]]
        )
    );

}

function transformExportsMap(exports: UserConfig["exports"]): Config["exports"] {
    if (exports === undefined) {
        return;
    }

    if (typeof exports === "string") {
        return {
            ".": [exports],
        };
    } else if (Array.isArray(exports)) {
        return {
            ".": exports,
        };
    }

    return Object.fromEntries(
        Object.entries(exports).map(([name, paths]) =>
            [name, Array.isArray(paths) ? paths : [paths]]
        )
    );
}

function transformPackageConfig(config: InputPackageConfig): PackageConfig {
    const {
        tsconfigPath,
        aliases,
        exports,
    } = config as UserConfig;

    return {
        tsconfigPath,
        aliases: transformAliases(aliases),
        exports: transformExportsMap(exports),
    };
}

function transformConfig(userConfig: UserConfig, configPath?: string): Config {
    const {
        include = DEFAULT_INCLUDE_PARAM,
        ignore = DEFAULT_IGNORE_PARAM,
        workspaces = {},
        hookScript,
        ...rootPackageConfig
    } = userConfig;

    return {
        configPath: configPath,
        include: [...new Set(include)],
        ignore: [...new Set(ignore.concat(DEFAULT_IGNORE_PARAM))],
        hookScript,
        ...transformPackageConfig(rootPackageConfig),
        workspaces: Object.fromEntries(
            Object.entries(workspaces).map(
                ([key, packageConfig]) => [key, transformPackageConfig(packageConfig)]
            )
        ),
    };
}

export class ConfigError<R extends Error> extends Error {
    public readonly reason?: R;
    constructor(message: string, { reason }: { reason?: R; } = {}) {
        super(message);
        this.name = this.constructor.name;
        this.reason = reason;
    }
}

function formatFieldPath(path: string): string {
    return path.replace(/^\//, "");
}

function getExpectedTypes(errors: DefinedError[]): string {
    const types = errors.map((error) => {
        if (error.keyword === "type") {
            return `"${error.params.type}"`;
        }
        return undefined;
    }).filter((type) => type !== undefined);

    if (types.length < 3) {
        return types.join(" or ");
    }
    return `${types.slice(0, -1).join(", ")}, or ${types[types.length - 1]}`;
}

export class ConfigValidationError<R extends Error> extends Error {
    public readonly reason: R;
    constructor(reason: R) {
        super(ConfigValidationError.getErrorMessage(reason));
        this.name = this.constructor.name;
        this.reason = reason;
    }

    static getErrorMessage<R extends Error>(reason: R): string {
        if (!(reason instanceof AjvValidationError) || !reason.errors[0]) {
            return "Unexpected error while validating config file";
        }

        const definedErrors = reason.errors as DefinedError[];

        const firstError = definedErrors[0];
        switch (firstError.keyword) {
            case "additionalProperties":
                return `The field "${formatFieldPath(`${firstError.instancePath}/${firstError.params.additionalProperty}`)}" is unknown.`;
            case "minItems":
                return `The field "${formatFieldPath(firstError.instancePath)}" needs at least ${pluralize("item", firstError.params.limit)}.`;
            case "oneOf":
            case "type":
                return `The field "${formatFieldPath(firstError.instancePath)}" must be of type ${getExpectedTypes(definedErrors)}.`;
            default:
                return "Unexpected error while validating config file";
        }
    }
}

async function readConfigFile(repoRoot: string, projectRoot: string, configPath?: string): Promise<{ config: UserConfig; path: string; } | null> {
    const explorer = cosmiconfig("omlet", { stopDir: repoRoot });
    let explorerResult: { config: unknown; filepath: string; } | null;

    if (configPath) {
        let isFile = false;
        try {
            isFile = (await fs.lstat(configPath)).isFile();
        } catch (error) {
            throw new ConfigError(`Cannot locate config file at ${configPath}`, { reason: error as Error });
        }

        if (!isFile) {
            throw new ConfigError(`Config file path is a directory: ${configPath}`);
        }

        explorerResult = await explorer.load(configPath);
    } else {
        explorerResult = await explorer.search(projectRoot);
    }

    if (!explorerResult) {
        return null;
    }

    const { config, filepath } = explorerResult;
    const validate = ajv.compile(userSchema);
    try {
        await validate(config);
    } catch (error) {
        throw new ConfigValidationError(error as Error);
    }

    return { config, path: filepath } as { config: UserConfig; path: string; };
}

export const DEFAULT_INCLUDE_PARAM = [
    "**/*.{js,jsx,ts,tsx}",
];

export const DEFAULT_IGNORE_PARAM = [
    "**/node_modules/**",
    "**/*.d.ts",
    "**/stories/**/*",
    "**/.storybook/**/*",
    "**/*.stories.{jsx,tsx,js,ts}",
    "**/*.{spec,test}.{jsx,tsx,js,ts}",
    "**/{__test__,tests}/**/*.{jsx,tsx,js,ts}",
];

export interface CliConfigParams {
    include?: string[];
    ignore?: string[];
    tsconfigPath?: string;
    hookScript?: string;
}

export async function loadConfig(repoRoot: string, projectRoot: string, cliParams: CliConfigParams, configPath?: string): Promise<Config> {
    let config: UserConfig = Object.fromEntries(
        Object.entries(cliParams).filter(([, value]) => value !== undefined)
    );
    let userConfigPath;

    const result = await readConfigFile(repoRoot, projectRoot, configPath);
    if (result) {
        // Override user-defined config with CLI parameters
        config = Object.assign(result.config, config);
        userConfigPath = upath.relative(projectRoot, result.path);
    }

    return transformConfig(config, userConfigPath);
}
