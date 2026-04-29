import { type SymbolWithSource } from "./SymbolWithSource";

export interface ComponentDependencyNode extends SymbolWithSource {
    id: string;
    name: string;
}
