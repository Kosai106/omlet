import { FilterDataType } from "./FilterDataType";

export enum FilterOperation {
    Equals = "equals",
    IsNotEqual = "isNotEqual",
    StartsWith = "startsWith",
    DoesNotStartWith = "doesNotStartWith",
    EndsWith = "endsWith",
    DoesNotEndWith = "doesNotEndWith",
    Contains = "contains",
    DoesNotContain = "doesNotContain",
    Regex = "regex",
    LessThan = "lessThan",
    GreaterThan = "greaterThan",
    Between = "between",
}

export function getFilterOperationLabel(filterOperation: FilterOperation, dataType?: FilterDataType): string {
    switch (filterOperation) {
        case FilterOperation.Equals:
            return dataType === FilterDataType.Number ? "equals" : "is";
        case FilterOperation.IsNotEqual:
            return dataType === FilterDataType.Number ? "is not equal" : "is not";
        case FilterOperation.StartsWith:
            return "starts with";
        case FilterOperation.DoesNotStartWith:
            return "does not start with";
        case FilterOperation.EndsWith:
            return "ends with";
        case FilterOperation.DoesNotEndWith:
            return "does not end with";
        case FilterOperation.Contains:
            return "contains";
        case FilterOperation.DoesNotContain:
            return "does not contain";
        case FilterOperation.Regex:
            return "regex";
        case FilterOperation.LessThan:
            return "less than";
        case FilterOperation.GreaterThan:
            return "greater than";
        case FilterOperation.Between:
            return "between";
    }
}

export const equalityFilterOperations = [FilterOperation.Equals, FilterOperation.IsNotEqual] as const;
export const stringFilterOperations = [FilterOperation.Contains, FilterOperation.DoesNotContain, FilterOperation.StartsWith, FilterOperation.DoesNotStartWith, FilterOperation.EndsWith, FilterOperation.DoesNotEndWith, FilterOperation.Regex] as const;
export const dateFilterOperations = [FilterOperation.Between] as const;
export const numberFilterOperations = [FilterOperation.GreaterThan, FilterOperation.Equals, FilterOperation.LessThan] as const;

export type EqualityFilterOperation = typeof equalityFilterOperations[number];
export type StringFilterOperation = typeof stringFilterOperations[number];
export type DateFilterOperation = typeof dateFilterOperations[number];
export type NumberFilterOperation = typeof numberFilterOperations[number];

export function isEqualityFilterOperation(operation: FilterOperation): operation is EqualityFilterOperation {
    return equalityFilterOperations.includes(operation as EqualityFilterOperation);
}
