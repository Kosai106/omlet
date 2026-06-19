import { type Component } from "./Component";

export interface RawHtmlUsageResult {
    element: string;
    numComponents: number;
    numProjects: number;
    components: Pick<Component, "id" | "name" | "definitionId" | "packageName">[];
}
