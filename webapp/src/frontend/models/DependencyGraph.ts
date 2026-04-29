import { type Component } from "./Component";


export interface DependencyGraph {
    components: Component[];
    dependencies: [string, string][];
}
