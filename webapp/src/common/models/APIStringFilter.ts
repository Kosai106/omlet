import { type StringFilterOperation } from "./FilterOperation";

export interface APIStringFilter {
    operation: StringFilterOperation;
    value: string;
}
