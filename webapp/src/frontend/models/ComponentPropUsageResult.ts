import { type Component } from "./Component";

export interface ComponentPropUsageResult {
    propName: string;
    sumOfUsages: number;
    numberOfUsages: number;
    component: Pick<Component, "id" | "name" | "definitionId" | "packageName">;
}
