// From https://github.com/nrwl/nx/blob/master/packages/nx/src/config/workspace-json-project-json.ts#L38
type NxProjectType = "library" | "application";

// From https://github.com/nrwl/nx/blob/master/packages/nx/src/config/workspace-json-project-json.ts#L45
export interface NxProjectConfiguration {
    name?: string;
    targets?: unknown; // { [targetName: string]: NxTargetConfiguration; };
    root: string;
    sourceRoot?: string;
    projectType?: NxProjectType;
    generators: { [collectionName: string]: { [generatorName: string]: unknown; }; };
    implicitDependencies?: string[];
    namedInputs?: unknown; // { [inputName: string]: (string | InputDefinition)[]; };
    tags?: string[];
    release?: unknown; // { version?: Pick<NxReleaseVersionConfiguration, "generator" | "generatorOptions">; };
}
