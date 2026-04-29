import { type ModuleId } from "./ModuleId";

export interface SymbolWithSource {
    source: ModuleId;
    symbol: string;
}
