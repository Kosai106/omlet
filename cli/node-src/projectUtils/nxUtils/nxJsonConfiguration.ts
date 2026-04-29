type PackageManager = "yarn" | "pnpm" | "npm";

// From https://github.com/nrwl/nx/blob/master/packages/nx/src/config/nx-json.ts#L255
export interface NxJsonConfiguration {
    extends?: string;
    implicitDependencies?: unknown; // ImplicitDependencyEntry<T>;
    namedInputs?: unknown; // { [inputName: string]: (string | InputDefinition)[]; };
    targetDefaults?: unknown; // TargetDefaults;
    affected?: unknown; // NxAffectedConfig;
    workspaceLayout?: {
        libsDir?: string;
        appsDir?: string;
    };
    tasksRunnerOptions?: {
        [tasksRunnerName: string]: {
            runner?: string;
            options?: unknown;
        };
    };
    generators?: { [collectionName: string]: { [generatorName: string]: unknown; }; };
    cli?: {
        packageManager?: PackageManager;
        defaultProjectName?: string;
    };
    plugins?: unknown; // PluginConfiguration[];
    pluginsConfig?: Record<string, Record<string, unknown>>;
    defaultProject?: string;
    installation?: unknown; // NxInstallationConfiguration;
    release?: unknown; // NxReleaseConfiguration;
    nxCloudAccessToken?: string;
    nxCloudUrl?: string;
    nxCloudEncryptionKey?: string;
    parallel?: number;
    cacheDirectory?: string;
    useDaemonProcess?: boolean;
}
