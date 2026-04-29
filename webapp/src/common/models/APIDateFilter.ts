import { type DateFilterOperation } from "./FilterOperation";

export interface APIDateFilter {
    operation: DateFilterOperation;
    value: [Date | undefined, Date | undefined];
}
