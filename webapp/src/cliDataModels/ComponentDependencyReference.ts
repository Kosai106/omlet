import { type ComponentUsage } from "./ComponentUsage";
import { type SymbolWithSource } from "./SymbolWithSource";

export interface ComponentDependencyReference {
    trace: SymbolWithSource[];
    usages: ComponentUsage[];
}
