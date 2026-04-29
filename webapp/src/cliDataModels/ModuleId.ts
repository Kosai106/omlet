import { type ModuleType } from "./ModuleType";

export interface ModuleId {
    hash: number;
    path: string;
    mtype: ModuleType;
    package_name: string;
}
