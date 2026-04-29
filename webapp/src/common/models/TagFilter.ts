import { type FilterDataType } from "./FilterDataType";
import { type FilterOperation } from "./FilterOperation";

export interface TagFilter {
    field: string;
    dataType: FilterDataType;
    operation: FilterOperation;
    value: string[];
}
