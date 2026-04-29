const EXPORT_CONDITIONS = [
    "node-addons",
    "node",
    "import",
    "require",
    "module-sync",
    "default",
    // community addons
    "development",
    "production",
    "browser",
    "types",
] as const;

type ExportCondition = typeof EXPORT_CONDITIONS[number];

export function isExportCondition(key: string): key is ExportCondition {
    return (EXPORT_CONDITIONS as readonly string[]).includes(key);
}

export const ES_MODULE_CONDITIONS = [
    "import",
    "module-sync",
    "default",
] as const;

type EsModuleCondition = typeof ES_MODULE_CONDITIONS[number];

export function isEsModuleCondition(key: string): key is EsModuleCondition {
    return (ES_MODULE_CONDITIONS as readonly string[]).includes(key);
}

type ExportsObject = {
    [K in ExportCondition]?: string;
};

export type ExportsValue = string | string[] | ExportsObject;

export interface PackageJson {
    name?: string;
    version?: string;
    main?: string;
    exports?: ExportsValue | Record<string, ExportsValue>;
    types?: string;
    workspaces?: string[] | { packages: string[]; };
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    [key: string]: unknown;
}
