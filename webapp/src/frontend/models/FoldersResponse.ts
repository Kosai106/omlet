import { type Package } from "./Package";

export interface FoldersResponse {
    packages: Package[];
    totalNumberOfUsages: number;
}
