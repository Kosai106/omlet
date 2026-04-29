import { type ComponentDependencyNode } from "./ComponentDependencyNode";
import { type ComponentDependencyReference } from "./ComponentDependencyReference";

export interface ComponentDependency {
    from: ComponentDependencyNode;
    to: ComponentDependencyNode;
    references: ComponentDependencyReference[];
}
