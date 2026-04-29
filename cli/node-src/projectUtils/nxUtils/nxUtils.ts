import glob from "fast-glob";
import { promises as fs } from "fs";
import JSON5 from "json5";
import upath from "upath";

import { readIfExists } from "../../fileUtils";
import { type Package } from "../package";
import { type PackageJson } from "../packageJson";
import { PathResolutionEntryType, PathResolutionMap } from "../pathResolutionMap";
import { type TsConfigInfo } from "../tsConfigInfo";

import { type NxJsonConfiguration } from "./nxJsonConfiguration";
import { type NxProjectConfiguration } from "./nxProjectConfiguration";

// Nx finds project configurations using plugins: https://github.com/nrwl/nx/blob/master/packages/nx/src/project-graph/utils/retrieve-workspace-files.ts#L160-L163
// the first plugin figures out workspaces from package.json: https://github.com/nrwl/nx/blob/master/packages/nx/src/plugins/package-json-workspaces/create-nodes.ts#L19
// the second plugin figures out workspaces from project.json: https://github.com/nrwl/nx/blob/master/packages/nx/src/plugins/project-json/build-nodes/project-json.ts#L8
export async function findNxWorkspacePaths(cwd: string): Promise<string[]> {
    const paths = await glob("**/*/{package,project}.json", { cwd, ignore: ["**/node_modules/**"] });

    return [...new Set(paths.map(path => upath.dirname(path)))];
}

export async function readNxConfig(repoPath: string): Promise<NxJsonConfiguration | undefined> {
    const nxJsonConfigFile = await readIfExists(upath.join(repoPath, "nx.json"));

    if (nxJsonConfigFile) {
        return JSON5.parse<NxJsonConfiguration>(nxJsonConfigFile);
    }
}

function getScope(rootPackageName?: string): string {
    if (!rootPackageName) {
        return "";
    }

    if (rootPackageName.startsWith("@")) {
        return `${rootPackageName.split("/")[0]}/`;
    }

    return "";
}

function getProjectName(workspacePath: string, workspaceProjectName?: string): string {
    if (workspaceProjectName) {
        return workspaceProjectName;
    }

    const parts = workspacePath.split("/");

    return parts[parts.length - 1];
}

// From: https://github.com/nrwl/nx/blob/master/packages/workspace/src/utilities/get-import-path.ts#L4
function getPackageName(
    workspacePath: string,
    rootPackageJson: PackageJson,
    workspacePackageJson: PackageJson | undefined,
    workspaceProjectJson: NxProjectConfiguration | undefined
): string {
    if (workspacePackageJson?.name) {
        return workspacePackageJson.name;
    }

    const scope = getScope(rootPackageJson.name);
    const projectName = getProjectName(workspacePath, workspaceProjectJson?.name);

    return `${scope}${projectName}`;
}

function getPackageVersion(rootPackageJson: PackageJson, workspacePackageJson: PackageJson | undefined): string {
    return workspacePackageJson?.version ?? rootPackageJson.version ?? "0.0.0";
}

export async function readNxProject(rootPath: string, workspacePath: string, tsconfig?: TsConfigInfo): Promise<Package> {
    const rootPackageJsonPath = upath.join(rootPath, "package.json");
    const rootPackageJsonContent = await fs.readFile(rootPackageJsonPath, "utf8");
    const rootPackageJson = JSON5.parse<PackageJson>(rootPackageJsonContent);

    const workspacePackageJsonPath = upath.join(workspacePath, "package.json");
    const workspacePackageJsonContent = await readIfExists(workspacePackageJsonPath);
    const workspacePackageJson = workspacePackageJsonContent ? JSON5.parse<PackageJson>(workspacePackageJsonContent) : undefined;

    const workspaceProjectJsonPath = upath.join(workspacePath, "project.json");
    const workspaceProjectJsonContent = await readIfExists(workspaceProjectJsonPath);
    const workspaceProjectJson = workspaceProjectJsonContent ? JSON5.parse<NxProjectConfiguration>(workspaceProjectJsonContent) : undefined;

    return {
        name: getPackageName(workspacePath, rootPackageJson, workspacePackageJson, workspaceProjectJson),
        version: getPackageVersion(rootPackageJson, workspacePackageJson),
        path: workspacePath,
        info: workspacePackageJson ?? rootPackageJson,
        tsconfig,
        aliases: new PathResolutionMap(PathResolutionEntryType.Alias),
        importMap: new PathResolutionMap(PathResolutionEntryType.Import),
        exportMap: new PathResolutionMap(PathResolutionEntryType.Export),
        dependencies: new Set(),
    };
}
