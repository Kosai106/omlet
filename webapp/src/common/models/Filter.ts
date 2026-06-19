
import { type PartialExcept } from "../utilityTypes";

import { type APIDateFilter } from "./APIDateFilter";
import { type APIEqualityFilter } from "./APIEqualityFilter";
import { type APINumberFilter } from "./APINumberFilter";
import { type APIStringFilter } from "./APIStringFilter";
import { type DataAnalysisFilter } from "./DataAnalysisFilter";
import { dateOptionIntoDate, isDateOption } from "./DateOption";
import { FilterDataType } from "./FilterDataType";
import {
    type DateFilterOperation,
    type EqualityFilterOperation,
    FilterOperation,
    type NumberFilterOperation,
    type StringFilterOperation,
    dateFilterOperations,
    equalityFilterOperations,
    numberFilterOperations,
    stringFilterOperations,
    isEqualityFilterOperation,
} from "./FilterOperation";
import {
    type ArrayFilterType,
    type DateFilterType,
    type NumberFilterType,
    type StringFilterType,
    fieldIntoFilterType,
    FilterType,
} from "./FilterType";
import { type MetadataFilter } from "./MetadataFilter";
import { type TagFilter } from "./TagFilter";

export interface BaseFilter {
    type: FilterType;
    operation: FilterOperation;
    value: string[];
}

export interface ArrayFilter extends BaseFilter {
    type: ArrayFilterType;
    operation: EqualityFilterOperation;
}

export interface StringFilter extends BaseFilter {
    type: StringFilterType;
    operation: StringFilterOperation;
}

export interface DateFilter extends BaseFilter {
    type: DateFilterType;
    operation: DateFilterOperation;
}

export interface NumberFilter extends BaseFilter {
    type: NumberFilterType;
    operation: NumberFilterOperation;
}

export type RegularFilter = ArrayFilter | StringFilter | DateFilter | NumberFilter;

export interface CustomPropertyFilter extends BaseFilter {
    type: FilterType.CustomProperty;
    field: TagFilter["field"];
    dataType: TagFilter["dataType"];
}

export type Filter = RegularFilter | CustomPropertyFilter;

export function isFilterComplete(filter: Partial<Filter>): filter is Filter {
    return filter.type !== undefined &&
        filter.operation !== undefined &&
        filter.value !== undefined &&
        filter.value.length !== 0 &&
        filter.value.some(value => value) &&
        (
            filter.type !== FilterType.CustomProperty ||
            (
                filter.field !== undefined &&
                filter.dataType !== undefined
            )
        );
}

export function areFiltersSameType(filter: Filter, otherFilter: Filter): boolean {
    if (filter.type !== otherFilter.type) {
        return false;
    }

    if (filter.type === FilterType.CustomProperty && otherFilter.type === FilterType.CustomProperty) {
        return filter.field === otherFilter.field;
    }

    return true;
}

export function areFiltersComplete(filters: Partial<Filter>[]): filters is Filter[] {
    return filters.every(filter => isFilterComplete(filter));
}

export function getCompleteFilters(filters: Partial<Filter>[]): Filter[] {
    return filters.filter((f): f is Filter => isFilterComplete(f));
}

export function hasSameFilters(filters: Filter[], otherFilters: Filter[]): boolean {
    return filters.length === otherFilters.length &&
        filters.every(filter => otherFilters.some(otherFilter =>
            otherFilter.type === filter.type &&
            otherFilter.operation === filter.operation &&
            otherFilter.value.length === filter.value.length &&
            filter.value.every(value => otherFilter.value.includes(value))
        ));
}

export function getKey(filter: Partial<Filter>): string {
    return `${filter.type}-${filter.operation}-${filter.value?.join(",")}`;
}

export function valueIntoString(value?: string[]): string | undefined {
    return value?.[0];
}

export function valueIntoNumber(value?: string[]): number | undefined {
    const firstValue = value?.[0];

    if (firstValue === undefined) {
        return undefined;
    }

    const numberValue = Number.parseInt(firstValue, 10);

    return Number.isNaN(numberValue) ? undefined : numberValue;
}

export function valueIntoBoolean(value?: string[]): boolean | undefined {
    const firstValue = value?.[0];

    if (firstValue === undefined) {
        return undefined;
    }

    return firstValue === "true";
}

function valueItemIntoDate(value: string): Date {
    if (isDateOption(value)) {
        return dateOptionIntoDate(value);
    }
    return new Date(value);
}

function valueIntoDates(value: string[]): [Date | undefined, Date] {
    const start = valueItemIntoDate(value[0]);
    start.setHours(0, 0, 0, 0);
    const end = valueItemIntoDate(value[1]);
    end.setHours(23, 59, 59, 999);
    return [
        Number.isFinite(start.getTime()) ? start : undefined,
        Number.isFinite(end.getTime()) ? end : new Date(),
    ];
}

export function intoAnalysisFilter(filter: CustomPropertyFilter): MetadataFilter {
    const { type, dataType, value, ...metadataFilter } = filter;

    let convertedValue = value;
    if (dataType === FilterDataType.Date) {
        const [start, end] = valueIntoDates(value);

        convertedValue = [start?.toISOString() ?? "", end.toISOString()];
    }

    return {
        dataType,
        value: convertedValue,
        ...metadataFilter,
    };
}

export function intoDataAnalysisFilter(filters: Partial<Filter>[] = []): DataAnalysisFilter | undefined {
    if (filters.length === 0) {
        return undefined;
    }

    const result: DataAnalysisFilter = {};

    for (const filter of filters) {
        if (!isFilterComplete(filter)) {
            continue;
        }

        const validOperations = getValidFilterTypeOperations(filter.type);
        if (filter.type === FilterType.Tag) {
            if (validOperations.includes(filter.operation)) {
                result.tag ??= [];
                result.tag.push({
                    operation: filter.operation,
                    values: filter.value,
                } as APIEqualityFilter);
            }
        }

        if (filter.type === FilterType.ProjectDefined) {
            if (validOperations.includes(filter.operation)) {
                result.sourceProject ??= [];
                result.sourceProject.push({
                    operation: filter.operation,
                    values: filter.value,
                } as APIEqualityFilter);
            }
        }

        if (filter.type === FilterType.ProjectUsedIn) {
            if (validOperations.includes(filter.operation)) {
                result.clientProject ??= [];
                result.clientProject.push({
                    operation: filter.operation,
                    values: filter.value,
                } as APIEqualityFilter);
            }
        }

        if (filter.type === FilterType.UsesRawElement) {
            if (validOperations.includes(filter.operation)) {
                result.usesRawElement ??= [];
                result.usesRawElement.push({
                    operation: filter.operation,
                    values: filter.value,
                } as APIEqualityFilter);
            }
        }

        if (filter.type === FilterType.NumberOfUsages) {
            if (validOperations.includes(filter.operation)) {
                result.numOfUsages ??= [];
                result.numOfUsages.push({
                    operation: filter.operation,
                    value: valueIntoNumber(filter.value),
                } as APINumberFilter);
            }
        }

        if (filter.type === FilterType.NumberOfDependencies) {
            if (validOperations.includes(filter.operation)) {
                result.numOfDependencies ??= [];
                result.numOfDependencies.push({
                    operation: filter.operation,
                    value: valueIntoNumber(filter.value),
                } as APINumberFilter);
            }
        }

        if (filter.type === FilterType.CreatedDate) {
            if (validOperations.includes(filter.operation)) {
                result.createdAt ??= [];
                result.createdAt.push({
                    operation: filter.operation,
                    value: valueIntoDates(filter.value),
                } as APIDateFilter);
            }
        }

        if (filter.type === FilterType.LastUpdatedDate) {
            if (validOperations.includes(filter.operation)) {
                result.updatedAt ??= [];
                result.updatedAt.push({
                    operation: filter.operation,
                    value: valueIntoDates(filter.value),
                } as APIDateFilter);
            }
        }

        if (filter.type === FilterType.LastUsageChangedDate) {
            if (validOperations.includes(filter.operation)) {
                result.lastUsageChangedAt ??= [];
                result.lastUsageChangedAt.push({
                    operation: filter.operation,
                    value: valueIntoDates(filter.value),
                } as APIDateFilter);
            }
        }

        if (filter.type === FilterType.Name) {
            if (isEqualityFilterOperation(filter.operation)) {
                result.name ??= [];
                result.name.push({
                    operation: filter.operation,
                    values: filter.value,
                } as APIEqualityFilter);
            } else if (validOperations.includes(filter.operation)) {
                result.name ??= [];
                result.name.push({
                    operation: filter.operation,
                    value: valueIntoString(filter.value),
                } as APIStringFilter);
            }
        }

        if (filter.type === FilterType.FilePath) {
            if (validOperations.includes(filter.operation)) {
                result.path ??= [];
                result.path.push({
                    operation: filter.operation,
                    value: valueIntoString(filter.value),
                } as APIStringFilter);
            }
        }

        if (filter.type === FilterType.CustomProperty) {
            if (validOperations.includes(filter.operation)) {
                result.metadata ??= [];
                result.metadata.push(intoAnalysisFilter(filter));
            }
        }
    }

    if (Object.values(result).length === 0) {
        return undefined;
    }

    return result;
}

export function getCustomFilterFieldName(filter: PartialExcept<CustomPropertyFilter, "field">): string {
    const { name = "Custom property" } = filter.field.match(/metadata\.(?<name>.+)$/)?.groups ?? {};

    return name;
}

export function intoTagFilterField(filter: Filter): string {
    switch (filter.type) {
        case FilterType.ProjectDefined:
            return "component.packageName";
        case FilterType.ProjectUsedIn:
            return "usingComponents.packageName";
        case FilterType.Tag:
            return "component.tags";
        case FilterType.Name:
            return "component.name";
        case FilterType.FilePath:
            return "component.path";
        case FilterType.CreatedDate:
            return "component.createdAt";
        case FilterType.LastUpdatedDate:
            return "component.updatedAt";
        case FilterType.LastUsageChangedDate:
            return "lastUsageChangedAt";
        case FilterType.NumberOfUsages:
            return "usingComponents.length";
        case FilterType.NumberOfDependencies:
            return "component.numOfDependencies";
        case FilterType.UsesRawElement:
            return "component.htmlElements";
        case FilterType.CustomProperty:
            return `component.${filter.field}`;
    }
}

export function getFilterDataType(filter: Filter): FilterDataType {
    switch (filter.type) {
        case FilterType.ProjectDefined:
        case FilterType.ProjectUsedIn:
        case FilterType.Tag:
        case FilterType.UsesRawElement:
        case FilterType.Name:
        case FilterType.FilePath:
            return FilterDataType.String;
        case FilterType.CreatedDate:
        case FilterType.LastUpdatedDate:
        case FilterType.LastUsageChangedDate:
            return FilterDataType.Date;
        case FilterType.NumberOfUsages:
        case FilterType.NumberOfDependencies:
            return FilterDataType.Number;
        case FilterType.CustomProperty:
            return filter.dataType;
    }
}

export function intoTagFilter(filter: Filter): TagFilter | undefined {
    if (!isFilterComplete(filter)) {
        return undefined;
    }

    return {
        field: intoTagFilterField(filter),
        dataType: getFilterDataType(filter),
        operation: filter.operation,
        value: filter.value,
    };
}

export function intoTagFilters(filters: Filter[]): TagFilter[] | undefined {
    return filters.map(filter => intoTagFilter(filter))
        .filter((filter): filter is TagFilter => filter !== undefined);
}

export function fromTagFilter(filter: TagFilter): Filter {
    const type = fieldIntoFilterType(filter.field);

    if (type === FilterType.CustomProperty) {
        return {
            type,
            ...filter,
            field: `metadata.${getCustomFilterFieldName(filter)}`,
        };
    }

    return {
        type,
        operation: filter.operation,
        value: filter.value,
    } as Filter;
}

export function getValidFilterTypeOperations(type: FilterType): ReadonlyArray<FilterOperation> {
    switch (type) {
        case FilterType.ProjectDefined:
        case FilterType.ProjectUsedIn:
        case FilterType.Tag:
        case FilterType.UsesRawElement:
            return equalityFilterOperations;
        case FilterType.FilePath:
            return stringFilterOperations;
        case FilterType.Name:
            return [...equalityFilterOperations, ...stringFilterOperations];
        case FilterType.CreatedDate:
        case FilterType.LastUpdatedDate:
        case FilterType.LastUsageChangedDate:
            return dateFilterOperations;
        case FilterType.NumberOfUsages:
        case FilterType.NumberOfDependencies:
            return numberFilterOperations;
        case FilterType.CustomProperty:
            return Object.values(FilterOperation);
    }
}
