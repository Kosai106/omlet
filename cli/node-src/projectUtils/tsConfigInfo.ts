import { type TsConfigJsonResolved } from "get-tsconfig";

export interface TsConfigInfo {
    config: TsConfigJsonResolved;
    path: string;
}
