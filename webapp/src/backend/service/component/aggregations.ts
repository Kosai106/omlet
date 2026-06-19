import { Types as MongooseTypes } from "mongoose";

import { AnalysisSubject } from "../../../common/models/AnalysisSubject";
import { type BreakdownType } from "../../../common/models/BreakdownType";
import { DataFrequencyOption } from "../../../common/models/DataFrequencyOption";
import { FilterOperation } from "../../../common/models/FilterOperation";
import { RESERVED_TAGS } from "../../../common/models/Tag";
import { type TagFilter } from "../../../common/models/TagFilter";
import { toISODateString, toISOMonthString, toISOWeekString } from "../date/date";
import { type DateFilterValue, type DateFilter, type EqualityFilter, type NumberFilter, type StringFilter, ReservedCustomPropertyValue } from "../models";
import { escapeRegex } from "../utils";

import { getAnalysisSubjectGroupKey } from "./dataTransformer";
import { type DataAnalysis, HistoricComponentIndexModel } from "./models";

export interface DataAnalysisFilter {
    name?: (StringFilter | EqualityFilter)[];
    path?: StringFilter[];
    tag?: EqualityFilter[];
    sourceProject?: EqualityFilter[];
    clientProject?: EqualityFilter[];
    usesRawElement?: EqualityFilter[];
    numOfUsages?: NumberFilter[];
    numOfDependencies?: NumberFilter[];
    createdAt?: DateFilter[];
    updatedAt?: DateFilter[];
    lastUsageChangedAt?: DateFilter[];
    metadata?: TagFilter[];
}

export interface TimeSeriesFilter {
    frequency?: DataFrequencyOption;
    timeWindow?: DateFilter;
}

export const TimeSeriesDataFrequencyGroupFunctionMap = {
    [DataFrequencyOption.Daily]: toISODateString,
    [DataFrequencyOption.Weekly]: toISOWeekString,
    [DataFrequencyOption.Monthly]: toISOMonthString,
};

interface DataAnalysisParams {
    analysisSubject: AnalysisSubject;
    customProperty?: string;
    filters: DataAnalysisFilter;
    breakdownType?: BreakdownType;
}

export function getGroupByMethod(frequency?: DataFrequencyOption) {
    return frequency ? TimeSeriesDataFrequencyGroupFunctionMap[frequency] : toISODateString;
}

export function getAnalyzedAtFilter(timeWindow?: DateFilter) {
    if (!timeWindow) {
        return {};
    }

    const analyzedAt: {
        $gte?: DateFilterValue;
        $lte?: DateFilterValue;
    } = {};

    const [start, end] = timeWindow.value;

    if (start) {
        analyzedAt.$gte = start;
    }

    if (end) {
        analyzedAt.$lte = end;
    }

    return { analyzedAt };
}

function convertEqualityFilterToMongoExpression(filter: EqualityFilter, field: string): unknown {
    switch (filter.operation) {
        case FilterOperation.Equals:
            return { $in: [field, filter.values] };
        case FilterOperation.IsNotEqual:
            return { $not: { $in: [field, filter.values] } };
        default:
            throw new Error(`Unsupported filter operation: ${filter.operation}`);
    }
}

function convertTagArrayEqualityFilterToMongoExpression(filter: EqualityFilter): unknown {
    switch (filter.operation) {
        case FilterOperation.Equals:
            return { $or: filter.values.map(value => ({ $in: [value, "$tags"] })) };
        case FilterOperation.IsNotEqual:
            return { $and: filter.values.map(value => ({ $not: { $in: [value, "$tags"] } })) };
        default:
            throw new Error(`Unsupported filter operation: ${filter.operation}`);
    }
}

function convertStringFilterToMongoExpression(filter: StringFilter, field: string): unknown {
    const escapedValue = escapeRegex(filter.value);

    switch (filter.operation) {
        case FilterOperation.StartsWith:
            return {
                $regexMatch: {
                    input: field,
                    regex: `^${escapedValue}`,
                    options: "i",
                },
            };
        case FilterOperation.DoesNotStartWith:
            return {
                $not: {
                    $regexMatch: {
                        input: field,
                        regex: `^${escapedValue}`,
                        options: "i",
                    },
                },
            };
        case FilterOperation.EndsWith:
            return {
                $regexMatch: {
                    input: field,
                    regex: `${escapedValue}$`,
                    options: "i",
                },
            };
        case FilterOperation.DoesNotEndWith:
            return {
                $not: {
                    $regexMatch: {
                        input: field,
                        regex: `${escapedValue}$`,
                        options: "i",
                    },
                },
            };
        case FilterOperation.Contains:
            return {
                $regexMatch: {
                    input: field,
                    regex: escapedValue,
                    options: "i",
                },
            };
        case FilterOperation.DoesNotContain:
            return {
                $not: {
                    $regexMatch: {
                        input: field,
                        regex: escapedValue,
                        options: "i",
                    },
                },
            };
        case FilterOperation.Regex:
            return {
                $regexMatch: {
                    input: field,
                    regex: filter.value,
                },
            };
        default:
            throw new Error(`Unsupported filter operation: ${filter.operation}`);
    }
}

function convertNumericFilterToMongoExpression(filter: NumberFilter, field: string): unknown {
    switch (filter.operation) {
        case FilterOperation.Equals:
            return { $eq: [field, filter.value] };
        case FilterOperation.GreaterThan:
            return { $gt: [field, filter.value] };
        case FilterOperation.LessThan:
            return { $lt: [field, filter.value] };
        default:
            throw new Error(`Unsupported filter operation: ${filter.operation}`);
    }
}

function convertDateFilterToMongoExpression({ value: [start, end] }: DateFilter, field: string): unknown | undefined {
    if (start && end) {
        return {
            $and: [
                { $gte: [field, start] },
                { $lte: [field, end] },
            ],
        };
    }
    if (start) {
        return {
            $gte: [field, start],
        };
    }
    if (end) {
        return {
            $or: [
                { $eq: [field, null] },
                { $lte: [field, end] },
            ],
        };
    }
    return undefined;
}

function convertTagFilterToMongoQuery({ operation, values }: EqualityFilter) {
    const field = "$tags";
    const containsUntagged = values.some(v => v === RESERVED_TAGS.UNTAGGED.slug);
    const taggedValues = values.filter(v => v !== RESERVED_TAGS.UNTAGGED.slug);
    const taggedQuery = convertEqualityFilterToMongoExpression({ operation, values: taggedValues }, field);
    if (!containsUntagged) {
        return taggedQuery;
    }
    const untaggedQuery = (
        operation === FilterOperation.Equals
            ? { $eq: [{ $ifNull: [field, null] }, null] }
            : { $ne: [{ $ifNull: [field, null] }, null] }
    );
    if (taggedValues.length === 0) {
        return untaggedQuery;
    }
    return operation === FilterOperation.Equals ? { $or: [untaggedQuery, taggedQuery] } : { $and: [untaggedQuery, taggedQuery] };
}

function convertTagArrayFilterToMongoQuery({ operation, values }: EqualityFilter) {
    const containsUntagged = values.some(v => v === RESERVED_TAGS.UNTAGGED.slug);
    const taggedValues = values.filter(v => v !== RESERVED_TAGS.UNTAGGED.slug);
    const taggedQuery = convertTagArrayEqualityFilterToMongoExpression({ operation, values: taggedValues });
    if (!containsUntagged) {
        return taggedQuery;
    }
    const untaggedQuery = (
        operation === FilterOperation.Equals
            ? { $eq: ["$tags", []] }
            : { $ne: ["$tags", []] }
    );
    if (taggedValues.length === 0) {
        return untaggedQuery;
    }
    return operation === FilterOperation.Equals ? { $or: [untaggedQuery, taggedQuery] } : { $and: [untaggedQuery, taggedQuery] };
}

export const tagsQuery = {
    $cond: {
        if: { $eq: ["$component.isInternal", false] },
        then: {
            $concatArrays: ["$component.tags", [RESERVED_TAGS.EXTERNAL.slug]],
        },
        else: "$component.tags",
    },
};

function convertNullKeys(analysisSubject: AnalysisSubject) {
    switch (analysisSubject) {
        case AnalysisSubject.Tags:
            return [{
                $project: {
                    _id: {
                        $ifNull: ["$_id", RESERVED_TAGS.UNTAGGED.slug],
                    },
                    data: 1,
                },
            }];
        case AnalysisSubject.CustomProperties:
            return [{
                $project: {
                    _id: {
                        $cond: [
                            { $eq: [{ $ifNull: ["$_id", ""] }, ""] },
                            ReservedCustomPropertyValue.NotSet,
                            "$_id",
                        ],
                    },
                    data: 1,
                },
            }];
        default:
            return [];
    }
}

export async function runDataAnalysis(
    lastAnalysis: string,
    {
        analysisSubject,
        customProperty,
        filters: {
            clientProject = [],
            name = [],
            path = [],
            sourceProject = [],
            numOfDependencies = [],
            numOfUsages = [],
            createdAt = [],
            updatedAt = [],
            lastUsageChangedAt = [],
            tag = [],
        },
    }: DataAnalysisParams): Promise<Record<string, DataAnalysis[]>> {

    const queryToPipelineStages = <T>(queryFilters: Array<T>, operator: "$and" | "$or") => {
        return queryFilters.length ? [{ $match: { $expr: { [operator]: queryFilters } } }] : [];
    };

    const pipeline = [
        // Stage 1
        // Fetch HistoricComponentIndex docs to get a complete list of components at each analysis time
        // If `analysisId` is provided, then fetches the single document created for that analysis
        {
            $match: {
                lastAnalysis: new MongooseTypes.ObjectId(lastAnalysis),
            },
        },

        {
            $unwind: {
                path: "$entries",
            },
        },

        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        "$entries",
                        {
                            analysisDate: "$analyzedAt",
                            analysisIds: "$analysisIds",
                        },
                    ],
                },
            },
        },
        {
            $set: {
                usingComponents: (
                    clientProject.length
                        ? {
                            $filter: {
                                input: "$usingComponents",
                                as: "usingComponent",
                                cond: {
                                    $and: clientProject.map(f => convertEqualityFilterToMongoExpression(f, "$$usingComponent.packageName")),
                                },
                            },
                        }
                        : "$usingComponents"
                ),
            },
        },
        {
            $addFields: {
                component: {
                    numOfUsages: {
                        $size: "$usingComponents",
                    },
                    tags: "$tags",
                },
            },
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: ["$$ROOT", {
                        component: {
                            $mergeObjects: ["$component", { tags: tagsQuery }],
                        },
                    }],
                },
            },
        },
        ...queryToPipelineStages([
            ...name.map(f => "values" in f ? convertEqualityFilterToMongoExpression(f, "$component.name") : convertStringFilterToMongoExpression(f, "$component.name")),
            ...path.map(f => convertStringFilterToMongoExpression(f, "$component.path")),
            ...sourceProject.map(f => convertEqualityFilterToMongoExpression(f, "$component.packageName")),
            ...numOfDependencies.map(f => convertNumericFilterToMongoExpression(f, "$component.numOfDependencies")),
            ...numOfUsages.map(f => convertNumericFilterToMongoExpression(f, "$component.numOfUsages")),
            ...createdAt.map(f => convertDateFilterToMongoExpression(f, "$component.createdAt")).filter(Boolean),
            ...updatedAt.map(f => convertDateFilterToMongoExpression(f, "$component.updatedAt")).filter(Boolean),
            ...lastUsageChangedAt.map(f => convertDateFilterToMongoExpression(f, "$lastUsageChangedAt")).filter(Boolean),
        ], "$and"),

        // Flatten using components on the root document
        {
            $unwind: {
                path: "$usingComponents",
                preserveNullAndEmptyArrays: analysisSubject === AnalysisSubject.Components,
            },
        },

        // Group data with respect to the grouping key and breakdown configuration
        {
            $group: {
                // Grouping configuration is the same for all analysis types (project, tag, component)
                // Main grouping and breakdown config results in the same compound grouping key:
                _id: {
                    analysisDate: "$analysisDate",
                    parentPackageName: "$usingComponents.packageName",
                    ...(customProperty !== undefined ? { parentCustomProperty: `$usingComponents.metadata.${customProperty}` } : {}),
                    childDefinitionId: "$component.definitionId",
                    childPackageName: "$component.packageName",
                    childName: "$component.name",
                },
                // Find unique components in each group
                uniqueComponents: {
                    $addToSet: "$component.definitionId",
                },
                tags: {
                    $first: "$component.tags",
                },
                // Count total number of component usages in each group
                sumOfUsages: {
                    $count: { },
                },
            },
        },

        ...queryToPipelineStages(tag.map(f => convertTagArrayFilterToMongoQuery(f)), "$and"),
        {
            $unwind: {
                path: "$tags",
                preserveNullAndEmptyArrays: true,
            },
        },
        ...queryToPipelineStages(tag.map(f => convertTagFilterToMongoQuery(f)), "$or"),

        {
            $project: {
                _id: 0,
                analysisDate: "$_id.analysisDate",
                parentPackageName: "$_id.parentPackageName",
                ...(customProperty !== undefined ? { parentCustomProperty: "$_id.parentCustomProperty" } : {}),
                childDefinitionId: "$_id.childDefinitionId",
                childPackageName: "$_id.childPackageName",
                childName: "$_id.childName",
                childTag: "$tags",
                sumOfUsages: {
                    $cond: {
                        if: { $ifNull: ["$_id.parentPackageName", false] },
                        then: "$sumOfUsages",
                        else: 0,
                    },
                },
            },
        },
        {
            $group: {
                _id: `$${getAnalysisSubjectGroupKey(analysisSubject)}`,
                data: {
                    $push: "$$ROOT",
                },
            },
        },
        ...convertNullKeys(analysisSubject),
    ];

    const result = await HistoricComponentIndexModel.aggregate<{ _id: string; data: DataAnalysis[]; }>(pipeline).exec();

    return Object.fromEntries(result.map(({ _id, data }) => [_id, data]));
}
