import { type Component } from "./Component";

export interface UnusedComponentPropResult {
    propName: string;
    sumOfUsages: number;
    component: Pick<Component, "id" | "name" | "definitionId" | "packageName">;
}
