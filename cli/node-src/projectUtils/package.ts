import { type PackageJson } from "./packageJson";
import { type PathResolutionMap } from "./pathResolutionMap";
import { type TsConfigInfo } from "./tsConfigInfo";

export interface Package {
    name: string;
    path: string;
    version: string;
    info: PackageJson;
    tsconfig?: TsConfigInfo;
    aliases: PathResolutionMap;
    importMap: PathResolutionMap;
    exportMap: PathResolutionMap;
    dependencies: Set<string>;
}
