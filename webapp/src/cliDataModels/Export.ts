import { type Declaration } from "./Declaration";
import { type ModuleId } from "./ModuleId";
import { type SymbolWithSource } from "./SymbolWithSource";

export interface Export {
    name: string;
    module_id: ModuleId;
    declaration: Declaration;
    is_component: unknown;
    trace_to_declaration: SymbolWithSource[];
}
