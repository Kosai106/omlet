import { type Component } from "./Component";

export interface RawHtmlUsageResult {
    element: string;
    numComponents: number;
    numProjects: number;
    numUsages: number;
    numA11yIssues: number;
    suggestedReplacement?: string;
    components: Pick<Component, "id" | "name" | "definitionId" | "packageName">[];
}
