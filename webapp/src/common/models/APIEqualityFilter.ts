import { type EqualityFilterOperation } from "./FilterOperation";

export interface APIEqualityFilter {
    operation: EqualityFilterOperation;
    values: string[];
}
