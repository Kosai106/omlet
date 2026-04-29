import { type NumberFilterOperation } from "./FilterOperation";

export interface APINumberFilter {
    operation: NumberFilterOperation;
    value: number;
}
