import MongoPaging, {
    type PaginationParams as MongoPaginationParams,
    type PaginationResult as MongoPaginationResult,
} from "mongo-cursor-pagination";
import { type Expression, type FilterQuery, type Model, model, Schema, Types } from "mongoose";

import { type CharacterPosition } from "../../../cliDataModels/CharacterPosition";
import { type Component as ComponentData } from "../../../cliDataModels/Component";
import { type ComponentDependencyNode } from "../../../cliDataModels/ComponentDependencyNode";
import { type ComponentDependencyReference } from "../../../cliDataModels/ComponentDependencyReference";
import { type ComponentUsage } from "../../../cliDataModels/ComponentUsage";
import { type ObjectProp, ObjectPropType, type PropValue } from "../../../cliDataModels/PropValue";
import { PropValueType } from "../../../cliDataModels/PropValueType";
import { DateOption } from "../../../common/models/DateOption";
import { FilterDataType } from "../../../common/models/FilterDataType";
import { FilterOperation } from "../../../common/models/FilterOperation";
import { BaseError } from "../../error";
import { ANALYSIS_COLLECTION_NAME } from "../analysis/models";
import { logException } from "../logger";

const HISTORIC_COMPONENT_INDEX_COLLECTION_NAME = "historicComponentIndex";
export const COMPONENT_COLLECTION_NAME = "components";
const COMPONENT_EXPORT_IDS_COLLECTION_NAME = "componentExportIds";
// TODO: Change collection name
export const COMPONENT_DEPENDENCY_COLLECTION_NAME = "componentUsages";
const DEPENDENCY_GRAPH_COLLECTION_NAME = "dependencygraphs";

export interface ExportId {
    module: number;
    name: string;
}

export interface DependencyDoc {
    packageName: string;
    definitionId: string;
    trace: ExportId[];
}

export interface ComponentPropDoc {
    name: string;
    defaultValue?: PropValue;
    span?: {
        start: CharacterPosition;
        end: CharacterPosition;
    };
}

export interface ComponentDoc {
    _id: Types.ObjectId;
    definitionId: string;
    name: string;
    packageName: string;
    path: string;
    isInternal: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    numOfDependencies: number;
    props: ComponentPropDoc[];
    htmlElements: string[];
    span?: {
        start: CharacterPosition;
        end: CharacterPosition;
    };
    analysis: Types.ObjectId;
    workspace: Types.ObjectId;
    metadata: Record<string, string | boolean | number | Date>;
}

function validatePropValue(propValue: unknown): propValue is PropValue {
    if (!(propValue instanceof Object) || !("type" in propValue)) {
        return false;
    }
    switch (propValue["type"]) {
        case PropValueType.String:
        case PropValueType.Identifier:
            return "value" in propValue && typeof propValue["value"] === "string";
        case PropValueType.Number:
            return "value" in propValue && typeof propValue["value"] === "number";
        case PropValueType.Bool:
            return "value" in propValue && typeof propValue["value"] === "boolean";
        case PropValueType.Regex:
            return "value" in propValue && typeof propValue["value"] === "string" && "flags" in propValue && typeof propValue["flags"] === "string";
        case PropValueType.Array:
            return "values" in propValue
                && Array.isArray((propValue as { values: unknown; }).values)
                && (propValue as { values: unknown[]; }).values.every(validatePropValue);
        case PropValueType.Spread:
            return "value" in propValue && validatePropValue(propValue["value"]);
        case PropValueType.Member:
            return "value" in propValue && validatePropValue(propValue["value"]) && "property" in propValue && validatePropValue(propValue["property"]);
        case PropValueType.Object:
            return "props" in propValue && (propValue["props"] === undefined ||
                (
                    Array.isArray(propValue["props"]) &&
                    (propValue as { props: Array<ObjectProp>; }).props.every((objectProp) => {
                        if (objectProp.type === ObjectPropType.KeyValue) {
                            return (
                                typeof objectProp.key === "string" &&
                                validatePropValue(objectProp.value)
                            );
                        } else if (objectProp.type === ObjectPropType.Shorthand) {
                            return (typeof objectProp.key === "string");
                        } else if (objectProp.type === ObjectPropType.Spread) {
                            return validatePropValue(objectProp.value);
                        }
                        return false;
                    }))
            );
        case PropValueType.Null:
        case PropValueType.Function:
        case PropValueType.Getter:
        case PropValueType.Setter:
        case PropValueType.JSXElement:
        case PropValueType.This:
        case PropValueType.Super:
        case PropValueType.TemplateLiteral:
        case PropValueType.Expression:
            return true;
        default:
            return false;
    }
}

function castPropValue(propValue: PropValue): PropValue {
    switch (propValue.type) {
        case PropValueType.String:
        case PropValueType.Identifier:
            return {
                type: propValue.type,
                value: propValue.value,
            };
        case PropValueType.Number:
            return {
                type: propValue.type,
                value: propValue.value,
            };
        case PropValueType.Bool:
            return {
                type: propValue.type,
                value: propValue.value,
            };
        case PropValueType.Regex:
            return {
                type: propValue.type,
                value: propValue.value,
                flags: propValue.flags,
            };
        case PropValueType.Array:
            return {
                type: propValue.type,
                values: propValue.values.map(castPropValue),
            };
        case PropValueType.Spread:
            return {
                type: propValue.type,
                value: castPropValue(propValue.value),
            };
        case PropValueType.Member:
            return {
                type: propValue.type,
                value: castPropValue(propValue.value),
                property: castPropValue(propValue.property),
            };
        case PropValueType.Object:
            return {
                type: propValue.type,
                props: propValue.props?.map(objectProp => {
                    if (objectProp.type === ObjectPropType.KeyValue) {
                        return {
                            type: ObjectPropType.KeyValue,
                            key: objectProp.key,
                            value: castPropValue(objectProp.value),
                        };
                    }
                    else if (objectProp.type === ObjectPropType.Shorthand) {
                        return {
                            type: ObjectPropType.Shorthand,
                            key: objectProp.key,
                        };
                    } else {
                        return {
                            type: ObjectPropType.Spread,
                            value: castPropValue(objectProp.value),
                        };
                    }
                }),
            };
        case PropValueType.Null:
        case PropValueType.Function:
        case PropValueType.Getter:
        case PropValueType.Setter:
        case PropValueType.JSXElement:
        case PropValueType.This:
        case PropValueType.Super:
        case PropValueType.TemplateLiteral:
        case PropValueType.Expression:
            return { type: propValue.type };
        default:
            throw new Error("Unreachable Code");
    }
}


const CharacterPositionSchema = new Schema<CharacterPosition>({
    line: { type: Number, required: true },
    column: { type: Number, required: true },
}, { _id: false });

const ComponentSchema = new Schema<ComponentDoc>({
    definitionId: { type: String, required: true },
    name: { type: String, required: true },
    packageName: { type: String, required: true },
    path: { type: String, default: "" },
    isInternal: { type: Boolean, required: true },
    createdAt: { type: Date, required: false },
    updatedAt: { type: Date, required: false },
    // tags: [String],
    numOfDependencies: { type: Number, required: true },
    props: [{
        _id: false,
        name: { type: String, required: true },
        defaultValue: {
            type: Schema.Types.Mixed,
            required: false,
            validate: validatePropValue,
            set: (propValue: PropValue | undefined) => propValue === undefined ? propValue : castPropValue(propValue),
        },
        span: {
            start: CharacterPositionSchema,
            end: CharacterPositionSchema,
        },
    }],
    htmlElements: { type: [String], default: [] },
    span: {
        start: CharacterPositionSchema,
        end: CharacterPositionSchema,
    },
    analysis: { type: Schema.Types.ObjectId, ref: "Analysis", required: true },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    metadata: Schema.Types.Mixed,
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

ComponentSchema.plugin(MongoPaging.mongoosePlugin, { name: "__paginate" });

ComponentSchema.static("paginate", async function (params: PaginationParams): Promise<PaginationResult> {
    const page = await ComponentModel.__paginate({
        query: params.query,
        limit: params.limit,
        paginatedField: params.paginatedField,
        sortAscending: params.sortAscending,
        next: params.next,
        prev: params.prev,
    });

    return {
        ...page,
        results: page.results.map(doc => ComponentModel.hydrate(doc)),
    };
});

export type PaginationParams = MongoPaginationParams<ComponentDoc>;
export type PaginationResult = MongoPaginationResult<ComponentDoc>;

interface CreateWorkspaceIndexParams {
    workspaceId: string;
    analysisIdsByPackage: Record<string, Types.ObjectId>;
    lastAnalysis: Types.ObjectId;
    analyzedAt: Date;
}

function truncateDateDown(date: object) {
    return {
        $dateTrunc: {
            date,
            unit: "day",
        },
    };
}

function truncateDateUp(date: object) {
    return {
        $dateTrunc: {
            date: {
                $dateAdd: {
                    startDate: date,
                    unit: "day",
                    amount: 1,
                },
            },
            unit: "day",
        },
    };
}

function convertDate(input: object) {
    return {
        $switch: {
            branches: [
                {
                    case: { $eq: [input, DateOption.Today] },
                    then: "$$NOW",
                },
                {
                    case: { $eq: [input, DateOption.Yesterday] },
                    then: {
                        $dateSubtract: {
                            startDate: "$$NOW",
                            unit: "day",
                            amount: 1,
                        },
                    },
                },
                {
                    case: { $eq: [input, DateOption.OneWeekAgo] },
                    then: {
                        $dateSubtract: {
                            startDate: "$$NOW",
                            unit: "week",
                            amount: 1,
                        },
                    },
                },
                {
                    case: { $eq: [input, DateOption.TwoWeeksAgo] },
                    then: {
                        $dateSubtract: {
                            startDate: "$$NOW",
                            unit: "week",
                            amount: 2,
                        },
                    },
                },
                {
                    case: { $eq: [input, DateOption.OneMonthAgo] },
                    then: {
                        $dateSubtract: {
                            startDate: "$$NOW",
                            unit: "month",
                            amount: 1,
                        },
                    },
                },
                {
                    case: { $eq: [input, DateOption.ThreeMonthsAgo] },
                    then: {
                        $dateSubtract: {
                            startDate: "$$NOW",
                            unit: "month",
                            amount: 3,
                        },
                    },
                },
                {
                    case: { $eq: [input, ""] },
                    then: "$$NOW",
                },
            ],
            default: {
                $convert: {
                    input,
                    to: "date",
                    onError: "$$NOW",
                    onNull: "$$NOW",
                },
            },
        },
    };
}

function createMongoExpressionForTagFilters(currentDoc: string): Expression {
    const equalsQuery = {
        $switch: {
            branches: [
                {
                    case: { $eq: ["$$tagFilter.dataType", FilterDataType.Boolean] },
                    then: {
                        $eq: [{ $ifNull: ["$$fieldValue", false] }, "$$tagFilterValue"],
                    },
                },
                {
                    case: { $eq: ["$$tagFilter.dataType", FilterDataType.Number] },
                    then: {
                        $eq: ["$$fieldValue", "$$tagFilterValue"],
                    },
                },
                {
                    case: { $eq: ["$$tagFilter.dataType", FilterDataType.Date] },
                    then: {
                        $and: [
                            { $gt: ["$$fieldValue", { $first: "$$tagFilterValue" }] },
                            { $lt: ["$$fieldValue", { $last: "$$tagFilterValue" }] },
                        ],
                    },
                },
            ],
            default: { $in: ["$$fieldValue", "$$tagFilterValue"] },
        },
    };

    return {
        $let: {
            vars: {
                tagFilter: "$$this",
                tagFilterValue: {
                    $switch: {
                        branches: [
                            {
                                case: { $eq: ["$$this.dataType", FilterDataType.Boolean] },
                                then: { $eq: [{ $first: "$$this.value" }, "true"] },
                            },
                            {
                                case: { $eq: ["$$this.dataType", FilterDataType.Number] },
                                then: {
                                    $convert: {
                                        input: { $first: "$$this.value" },
                                        to: "int",
                                        onError: 0,
                                        onNull: 0,
                                    },
                                },
                            },
                            {
                                case: { $eq: ["$$this.dataType", FilterDataType.Date] },
                                then: [
                                    truncateDateDown(convertDate({ $first: "$$this.value" })),
                                    truncateDateUp(convertDate({ $arrayElemAt: ["$$this.value", 1 ] })),
                                ],
                            },
                            {
                                case: { $eq: ["$$this.field", "component.packageName"] },
                                then: "$$this.value",
                            },
                            {
                                case: { $eq: ["$$this.field", "usingComponents.packageName"] },
                                then: "$$this.value",
                            },
                            {
                                case: { $eq: ["$$this.field", "component.tags"] },
                                then: "$$this.value",
                            },
                            {
                                case: {
                                    $and: [
                                        { $regexMatch: { input: "$$this.field", regex: "metadata" } },
                                        { $eq: ["$$this.dataType", FilterDataType.String] },
                                    ],
                                },
                                then: "$$this.value",
                            },
                        ],
                        default: { $first: "$$this.value" },
                    },
                },
                /*
                 Tag filters have a property called `field` that specifies the field of the input object to filter on.
                 In this context, the input object is the entry field of HCI entries.
                 The field property is a dot-separated path such as `component.metadata.code_owner`.

                 Accessing a field of objects dynamically is not possible in MongoDB aggregations.
                 To work around this, the following function is used to get the value of a field if it exists.
                */
                fieldValue: {
                    $function: {
                        body: `function (currentDoc, fieldPath) {
                            if (fieldPath === "usingComponents.packageName") {
                                return currentDoc.usingComponents.map(comp => comp.packageName);
                            }

                            let value = currentDoc;
                            const fields = fieldPath.split(".");
                            for (const field of fields) {
                                value = value[field];
                                if (!value) {
                                    return value;
                                }
                            }

                            return value;
                        }`,
                        args: [currentDoc, "$$this.field"],
                        lang: "js",
                    },
                },
            },
            in: {
                $switch: {
                    branches: [
                        {
                            case: { $eq: ["$$tagFilter.operation", FilterOperation.Equals] },
                            then: equalsQuery,
                        },
                        {
                            case: { $eq: ["$$tagFilter.operation", FilterOperation.IsNotEqual] },
                            then: { $not: equalsQuery },
                        },
                        {
                            case: { $eq: ["$$tagFilter.operation", FilterOperation.StartsWith] },
                            then: {
                                $regexMatch: {
                                    input: "$$fieldValue",
                                    regex: {
                                        $concat: [
                                            "^",
                                            "$$tagFilterValue",
                                        ],
                                    },
                                    options: "i",
                                },
                            },
                        },
                        {
                            case: { $eq: ["$$tagFilter.operation", FilterOperation.DoesNotStartWith] },
                            then: {
                                $not: {
                                    $regexMatch: {
                                        input: "$$fieldValue",
                                        regex: {
                                            $concat: [
                                                "^",
                                                "$$tagFilterValue",
                                            ],
                                        },
                                        options: "i",
                                    },
                                },
                            },
                        },
                        {
                            case: { $eq: ["$$tagFilter.operation", FilterOperation.EndsWith] },
                            then: {
                                $regexMatch: {
                                    input: "$$fieldValue",
                                    regex: {
                                        $concat: [
                                            "$$tagFilterValue",
                                            { $literal: "$" },
                                        ],
                                    },
                                    options: "i",
                                },
                            },
                        },
                        {
                            case: { $eq: ["$$tagFilter.operation", FilterOperation.DoesNotEndWith] },
                            then: {
                                $not: {
                                    $regexMatch: {
                                        input: "$$fieldValue",
                                        regex: {
                                            $concat: [
                                                "$$tagFilterValue",
                                                { $literal: "$" },
                                            ],
                                        },
                                        options: "i",
                                    },
                                },
                            },
                        },
                        {
                            case: { $eq: ["$$tagFilter.operation", FilterOperation.Contains] },
                            then: {
                                $regexMatch: {
                                    input: "$$fieldValue",
                                    regex: "$$tagFilterValue",
                                    options: "i",
                                },
                            },
                        },
                        {
                            case: { $eq: ["$$tagFilter.operation", FilterOperation.DoesNotContain] },
                            then: {
                                $not: {
                                    $regexMatch: {
                                        input: "$$fieldValue",
                                        regex: "$$tagFilterValue",
                                        options: "i",
                                    },
                                },
                            },
                        },
                        {
                            case: { $eq: ["$$tagFilter.operation", FilterOperation.Regex] },
                            then: {
                                $regexMatch: {
                                    input: "$$fieldValue",
                                    regex: "$$tagFilterValue",
                                    options: "i",
                                },
                            },
                        },
                        {
                            case: { $eq: ["$$tagFilter.operation", FilterOperation.GreaterThan] },
                            then: { $gt: ["$$fieldValue", "$$tagFilterValue"] },
                        },
                        {
                            case: { $eq: ["$$tagFilter.operation", FilterOperation.LessThan] },
                            then: { $lt: ["$$fieldValue", "$$tagFilterValue"] },
                        },
                        {
                            case: { $eq: ["$$tagFilter.operation", FilterOperation.Between] },
                            then: {
                                $and: [
                                    { $gt: ["$$fieldValue", { $first: "$$tagFilterValue" }] },
                                    { $lt: ["$$fieldValue", { $last: "$$tagFilterValue" }] },
                                ],
                            },
                        },
                    ],
                    default: false,
                },
            },
        },
    };
}

function createMongoQueryForTagCalculation(currentDoc: string) {
    const reduceForMatchedTreeNode = {
        $cond: {
            if: {
                $and: [
                    { $eq: ["$$this.packageName", `${currentDoc}.component.packageName`] },
                    {
                        $or: [
                            { $eq: ["$$this.path", ""] },
                            {
                                $regexMatch: {
                                    input: `${currentDoc}.component.path`,
                                    regex: {
                                        $concat: [
                                            "^",
                                            "$$this.path",
                                        ],
                                    },
                                },
                            },
                        ],
                    },
                    { $gte: [{ $strLenCP: "$$this.path" }, { $strLenCP: { $ifNull: ["$$value", ""] } }] },
                ],
            },
            then: "$$this.path",
            else: "$$value",
        },
    };

    return {
        $map: {
            input: {
                $filter: {
                    input: "$allTags",
                    as: "tag",
                    cond: {
                        $and: [
                            {
                                $or: [
                                    { $eq: [{ $size: "$$tag.searchTerm" }, 0] },
                                    {
                                        $or: ["name", "path", "packageName"].map(field => (
                                            {
                                                $reduce: {
                                                    input: "$$tag.searchTerm",
                                                    initialValue: false,
                                                    in: {
                                                        $or: [
                                                            "$$value",
                                                            { $regexMatch: { input: `${currentDoc}.component.${field}`, regex: "$$this", options: "i" } },
                                                        ],
                                                    },
                                                },
                                            }
                                        )),
                                    },
                                ],
                            },
                            {
                                $or: [
                                    { $eq: [{ $size: "$$tag.selectedTreeNodes" }, 0] },
                                    {
                                        $let: {
                                            vars: {
                                                matchedSelectedTreeNodePath: {
                                                    $reduce: {
                                                        input: "$$tag.selectedTreeNodes",
                                                        initialValue: null,
                                                        in: reduceForMatchedTreeNode,
                                                    },
                                                },
                                                matchedDeselectedTreeNodePath: {
                                                    $reduce: {
                                                        input: "$$tag.deselectedTreeNodes",
                                                        initialValue: null,
                                                        in: reduceForMatchedTreeNode,
                                                    },
                                                },
                                            },
                                            in: {
                                                $and: [
                                                    { $ne: ["$$matchedSelectedTreeNodePath", null] },
                                                    {
                                                        $or: [
                                                            { $eq: ["$$matchedDeselectedTreeNodePath", null] },
                                                            {
                                                                $gt: [
                                                                    { $strLenCP: "$$matchedSelectedTreeNodePath" },
                                                                    { $strLenCP: "$$matchedDeselectedTreeNodePath" },
                                                                ],
                                                            },
                                                        ],
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                ],
                            },
                            {
                                $or: [
                                    { $eq: [{ $size: "$$tag.filters" }, 0] },
                                    {
                                        $reduce: {
                                            input: "$$tag.filters",
                                            initialValue: true,
                                            in: {
                                                $and: [
                                                    "$$value",
                                                    createMongoExpressionForTagFilters(currentDoc),
                                                ],
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
            as: "tag",
            in: "$$tag.slug",
        },
    };
}

function hasSameUsages(currentEntry: HistoricComponentIndexEntry, previousEntry: HistoricComponentIndexEntry): boolean {
    const previousEntryDefinitionIds: string[] = previousEntry.usingComponents
        .map(component => component.definitionId);

    const currentEntryDefinitionIds: string[] = currentEntry.usingComponents
        .map((component) => component.definitionId);

    if (previousEntryDefinitionIds.length !== currentEntryDefinitionIds.length) {
        return false;
    }

    const currentDefinitionIdSet: Set<string> = new Set(currentEntryDefinitionIds);
    const previousDefinitionIdSet: Set<string> = new Set(previousEntryDefinitionIds);

    for (const item of currentDefinitionIdSet) {
        if (!previousDefinitionIdSet.has(item)) {
            return false;
        }
    }

    return true;
}

ComponentSchema.static("createWorkspaceIndex", async function ({
    analysisIdsByPackage,
    lastAnalysis,
    workspaceId,
    analyzedAt,
}: CreateWorkspaceIndexParams): Promise<void> {
    const workspace = new Types.ObjectId(workspaceId);

    const analysisIds = [...new Set(Object.values(
        analysisIdsByPackage
    ).map(oid => oid.toString()))].map(id => new Types.ObjectId(id));

    const now = new Date();
    const HISTORIC_COMPONENT_CHUNK_SIZE = 5000;

    const packagesByAnalysisId = Object.entries(analysisIdsByPackage).reduce((acc, [packageName, analysisId]) => {
        const analysisIdStr = analysisId.toHexString();
        if (!acc[analysisIdStr]) {
            acc[analysisIdStr] = { analysisId, packageNames: [] };
        }
        acc[analysisIdStr].packageNames.push(packageName);
        return acc;
    }, {} as Record<string, { analysisId: Types.ObjectId; packageNames: string[]; }>);

    const packageAnalysisConditions = [
        ...Object.values(packagesByAnalysisId).map(({ analysisId, packageNames }) => ({
            analysis: analysisId,
            packageName: { $in: packageNames },
        })),
        {
            isInternal: false,
            analysis: { $in: analysisIds },
        },
    ];

    const indexDocuments: HistoricComponentIndexDoc[] = await ComponentModel.aggregate([
        {
            $match: {
                workspace,
                $or: packageAnalysisConditions,
            },
        },
        {
            $facet: {
                externalComponents: [{ $match: { isInternal: false } }, { $set: { originalDefinitionId: "$definitionId" } }, {
                    $lookup: {
                        from: COMPONENT_EXPORT_IDS_COLLECTION_NAME,
                        localField: "definitionId",
                        foreignField: "exportId",
                        pipeline: [{
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$workspace", workspace] },
                                        { $in: ["$analysis", analysisIds] },
                                    ],
                                },
                            },
                        }, {
                            $project: {
                                definitionId: 1,
                                component: 1,
                            },
                        }, {
                            $group: {
                                _id: null,
                                latestComponent: { $last: "$$ROOT" },
                            },
                        }, { $replaceRoot: { newRoot: "$latestComponent" } }],
                        as: "sourceComponent",
                    },
                }, {
                    $project: {
                        sourceComponentId: {
                            $cond: {
                                if: { $gt: [{ $size: "$sourceComponent" }, 0] },
                                then: {
                                    $getField: {
                                        input: { $arrayElemAt: ["$sourceComponent", 0] },
                                        field: "component",
                                    },
                                },
                                else: undefined,
                            },
                        },
                        originalDefinitionId: 1,
                        definitionId: {
                            $cond: {
                                if: { $gt: [{ $size: "$sourceComponent" }, 0] },
                                then: {
                                    $getField: {
                                        input: { $arrayElemAt: ["$sourceComponent", 0] },
                                        field: "definitionId",
                                    },
                                },
                                else: "$definitionId",
                            },
                        },
                        analysis: 1,
                        workspace: 1,
                    },
                }],
                localComponents: [{ $match: { isInternal: true } }, {
                    $project: {
                        originalDefinitionId: "$definitionId",
                        definitionId: 1,
                        analysis: 1,
                        workspace: 1,
                    },
                }],
            },
        },
        { $project: { all: { $concatArrays: ["$externalComponents", "$localComponents"] } } },
        {
            $addFields: {
                workspace,
                lastAnalysis,
            },
        },
        {
            $lookup: {
                from: ANALYSIS_COLLECTION_NAME,
                localField: "lastAnalysis",
                foreignField: "_id",
                pipeline: [{ $project: { tags: 1 } }],
                as: "allTags",
            },
        },
        { $unwind: { path: "$all" } },
        {
            $addFields: {
                all: {
                    allTags: {
                        $ifNull: [
                            {
                                $getField: {
                                    input: { $first: "$allTags" },
                                    field: "tags",
                                },
                            },
                            [],
                        ],
                    },
                },
            },
        },
        { $replaceRoot: { newRoot: "$all" } },
        {
            $group: {
                _id: "$definitionId",
                originalDefinitionIds: { $addToSet: "$originalDefinitionId" },
                workspace: { $first: "$workspace" },
                analysis: { $max: "$analysis" },
                component: { $max: "$_id" },
                sourceComponentId: { $max: "$sourceComponentId" },
                allTags: { $first: "$allTags" },
            },
        },
        { $set: { component: { $ifNull: ["$sourceComponentId", "$component"] } } },
        {
            $lookup: {
                from: COMPONENT_COLLECTION_NAME,
                localField: "component",
                foreignField: "_id",
                pipeline: [{
                    $project: {
                        _id: 1,
                        definitionId: 1,
                        name: 1,
                        packageName: 1,
                        path: 1,
                        isInternal: 1,
                        tags: 1,
                        numOfDependencies: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        metadata: 1,
                    },
                }],
                as: "component",
            },
        },
        { $unwind: { path: "$component" } },
        {
            $lookup: {
                from: COMPONENT_DEPENDENCY_COLLECTION_NAME,
                localField: "originalDefinitionIds",
                foreignField: "childDefinitionId",
                pipeline: [
                    { $match: { $expr: { $in: ["$analysis", analysisIds] } } },
                    {
                        $group: {
                            _id: "$parentDefinitionId",
                            parentId: { $max: "$parentId" },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            parentId: 1,
                        },
                    },
                ],
                as: "usingComponents",
            },
        },
        {
            $lookup: {
                from: COMPONENT_COLLECTION_NAME,
                localField: "usingComponents.parentId",
                foreignField: "_id",
                pipeline: [{
                    $project: {
                        _id: 1,
                        definitionId: 1,
                        packageName: 1,
                        metadata: 1,
                    },
                }],
                as: "usingComponents",
            },
        },
        { $addFields: { tags: createMongoQueryForTagCalculation("$$ROOT") } },
        {
            $group: {
                _id: null,
                entries: {
                    $push: {
                        definitionId: "$_id",
                        originalDefinitionIds: "$originalDefinitionIds",
                        analysis: "$analysis",
                        component: "$component",
                        usingComponents: "$usingComponents",
                        tags: "$tags",
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                entries: 1,
                lastAnalysis,
                analysisIds,
                workspace,
                analyzedAt,
                createdAt: now,
                updatedAt: now,
            },
        },
        {
            $unwind: {
                path: "$entries",
                includeArrayIndex: "arrayIndex",
            },
        },
        {
            $group: {
                _id: { $floor: { $divide: ["$arrayIndex", HISTORIC_COMPONENT_CHUNK_SIZE] } },
                entries: { $push: "$entries" },
                lastAnalysis: { $first: "$lastAnalysis" },
                analysisIds: { $first: "$analysisIds" },
                workspace: { $first: "$workspace" },
                analyzedAt: { $first: "$analyzedAt" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
            },
        },
        {
            $project: {
                _id: 0,
                entries: 1,
                lastAnalysis,
                analysisIds,
                workspace,
                analyzedAt,
                createdAt: now,
                updatedAt: now,
            },
        },
    ]);
    const [previousIndexDocument] = await HistoricComponentIndexModel
        .find({ workspace: workspaceId, analyzedAt: { $lt: analyzedAt } },
            { lastAnalysis: 1, analyzedAt: 1 })
        .sort({ analyzedAt: -1 })
        .limit(1)
        .lean()
        .exec();

    const previousAnalysisId = previousIndexDocument?.lastAnalysis?.toHexString();
    let previousIndexDocuments: HistoricComponentIndexDoc[] = [];
    if (previousAnalysisId) {
        previousIndexDocuments = await HistoricComponentIndexModel
            .find({ workspace: workspaceId, lastAnalysis: previousAnalysisId })
            .lean().exec();
    }
    const previousEntries = previousIndexDocuments.flatMap(doc => doc.entries);
    const previousEntriesMap = Object.fromEntries(previousEntries.map(entry => [entry.definitionId, entry]));

    for (const indexDoc of indexDocuments) {
        const currentEntries = indexDoc.entries;
        for (const currentEntry of currentEntries) {
            const previousEntry = previousEntriesMap[currentEntry.definitionId];
            if (previousEntry && hasSameUsages(previousEntry, currentEntry)) {
                currentEntry.lastUsageChangedAt = previousEntry.lastUsageChangedAt;
            } else {
                currentEntry.lastUsageChangedAt = analyzedAt;
            }
        }
    }

    await HistoricComponentIndexModel.insertMany(indexDocuments, { lean: true });
});

ComponentSchema.static("softDeleteMany", async function <T>(query: FilterQuery<T>): Promise<void> {
    try {
        await ComponentModel.aggregate([
            { $match: query },
            {
                $merge: {
                    into: `${COMPONENT_COLLECTION_NAME}.deleted`,
                    on: "_id",
                    whenMatched: "replace",
                },
            },
        ]);
    } catch (e) {
        logException(new BaseError("Failed to soft delete", true, { reason: e as Error, details: { query } }));
    }

    await ComponentModel.deleteMany(query);
});

interface ComponentModelInterface extends Model<ComponentDoc> {
    __paginate: (params: PaginationParams) => Promise<MongoPaginationResult<unknown>>;
    paginate: (params: PaginationParams) => Promise<PaginationResult>;
    createWorkspaceIndex: (params: CreateWorkspaceIndexParams) => Promise<void>;
    softDeleteMany: <T>(query: FilterQuery<T>) => Promise<void>;
}

export const ComponentModel = model<ComponentDoc, ComponentModelInterface>("Component", ComponentSchema, COMPONENT_COLLECTION_NAME);

export interface ComponentDependency {
    from: Pick<ComponentDependencyNode, "id" | "name">;
    to: Pick<ComponentDependencyNode, "id" | "name">;
    references: ComponentDependencyReference[];
}

export interface ComponentViewModel extends Omit<ComponentData, "id" | "dependencies" | "reverse_dependencies" | "created_at" | "updated_at"> {
    definitionId: string;
    export_ids: string[];
    dependencies: ComponentDependency[];
    created_at?: Date;
    updated_at?: Date;
}

type ComponentExportIdsDoc = {
    id: string;
    exportId: string;
    definitionId: string;
    workspace: Types.ObjectId;
    analysis: Types.ObjectId;
    component: Types.ObjectId;
};

const ComponentExportIdsSchema = new Schema<ComponentExportIdsDoc>({
    exportId: { type: Schema.Types.String, required: true },
    definitionId: { type: Schema.Types.String, required: true },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    analysis: { type: Schema.Types.ObjectId, ref: "Analysis", required: true },
    component: { type: Schema.Types.ObjectId, ref: "Component", required: true },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

ComponentExportIdsSchema.static("softDeleteMany", async function <T>(query: FilterQuery<T>): Promise<void> {
    try {
        await ComponentExportIdsModel.aggregate([
            { $match: query },
            {
                $merge: {
                    into: `${COMPONENT_EXPORT_IDS_COLLECTION_NAME}.deleted`,
                    on: "_id",
                    whenMatched: "replace",
                },
            },
        ]);
    } catch (e) {
        logException(new BaseError("Failed to soft delete", true, { reason: e as Error, details: { query } }));
    }

    await ComponentExportIdsModel.deleteMany(query);
});

interface ComponentExportIdsInterface extends Model<ComponentExportIdsDoc> {
    softDeleteMany: <T>(query: FilterQuery<T>) => Promise<void>;
}

export const ComponentExportIdsModel = model<ComponentExportIdsDoc, ComponentExportIdsInterface>("ComponentExportIds", ComponentExportIdsSchema, COMPONENT_EXPORT_IDS_COLLECTION_NAME);

type HistoricComponentIndexEntry = {
    definitionId: string;
    originalDefinitionIds: string[];
    component: Pick<ComponentDoc, "definitionId" | "name" | "path" | "packageName" | "isInternal" | "numOfDependencies" | "createdAt" | "updatedAt" | "metadata"> & {
        _id: Types.ObjectId;
        tags: string[];
    };
    tags: string[];
    usingComponents: (Pick<ComponentDoc, "definitionId" | "packageName"> & { _id: Types.ObjectId; })[];
    lastUsageChangedAt: Date;
};
export type HistoricComponentIndexDoc = {
    id: string;
    workspace: Types.ObjectId;
    lastAnalysis: Types.ObjectId;
    analysisIds: Types.ObjectId[];
    entries: HistoricComponentIndexEntry[];
    analyzedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    metadata: ComponentDoc["metadata"];
};

/*
A unique index on (workspace, lastAnalysis) key needed so that
$merge stage can identify documents in this collection
*/
const HistoricComponentIndexSchema = new Schema<HistoricComponentIndexDoc>({
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    lastAnalysis: { type: Schema.Types.ObjectId, ref: "Analysis", required: true },
    analysisIds: [{ type: Schema.Types.ObjectId, ref: "Analysis", required: true }],
    entries: [{
        type: new Schema({
            definitionId: { type: String, required: true },
            originalDefinitionIds: { type: [String], required: true },
            component: {
                _id: { type: Schema.Types.ObjectId, ref: "Component", required: true },
                definitionId: { type: String, required: true },
                name: { type: String, required: true },
                path: { type: String, default: "" },
                packageName: { type: String, required: true },
                isInternal: { type: Boolean, required: true },
                tags: [String],
                numOfDependencies: { type: Number, required: true },
                createdAt: { type: Date, required: false },
                updatedAt: { type: Date, required: false },
                metadata: Schema.Types.Mixed,
            },
            tags: [String],
            usingComponents: [{
                _id: { type: Schema.Types.ObjectId, ref: "Component", required: true },
                definitionId: { type: String, required: true },
                packageName: { type: String, required: true },
            }],
            lastUsageChangedAt: { type: Date, required: true },
        }),
    }],
    analyzedAt: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

interface IndexKey {
    lastAnalysis: Types.ObjectId;
    workspace: Types.ObjectId;
}

HistoricComponentIndexSchema.static("softDeleteMany", async function <T>(query: FilterQuery<T>): Promise<void> {
    try {
        await HistoricComponentIndexModel.aggregate([
            { $match: query },
            {
                $merge: {
                    into: `${HISTORIC_COMPONENT_INDEX_COLLECTION_NAME}.deleted`,
                    on: "_id",
                    whenMatched: "replace",
                },
            },
        ]);
    } catch (e) {
        logException(new BaseError("Failed to soft delete", true, { reason: e as Error, details: { query } }));
    }

    await HistoricComponentIndexModel.deleteMany(query);
});

HistoricComponentIndexSchema.static("recalculateTags", async function (key: IndexKey): Promise<void> {
    await HistoricComponentIndexModel.aggregate([
        {
            $match: {
                workspace: key.workspace,
                lastAnalysis: key.lastAnalysis,
            },
        },
        {
            $lookup: {
                from: ANALYSIS_COLLECTION_NAME,
                localField: "lastAnalysis",
                foreignField: "_id",
                pipeline: [{ $project: { tags: 1 } }],
                as: "allTags",
            },
        },
        {
            $addFields: {
                allTags: {
                    $ifNull: [
                        {
                            $getField: {
                                input: { $first: "$allTags" },
                                field: "tags",
                            },
                        },
                        [],
                    ],
                },
            },
        },
        {
            $addFields: {
                entries: {
                    $map: {
                        input: "$entries",
                        as: "entry",
                        in: {
                            $mergeObjects: [
                                "$$entry",
                                { tags: createMongoQueryForTagCalculation("$$entry") },
                            ],
                        },
                    },
                },
                updatedAt: new Date(),
            },
        },
        { $project: { allTags: 0 } },
        {
            $merge: {
                into: HISTORIC_COMPONENT_INDEX_COLLECTION_NAME,
                on: ["_id"],
                whenMatched: "replace",
            },
        },
    ]);
});

interface HistoricComponentModelInterface extends Model<HistoricComponentIndexDoc> {
    softDelete: (key: IndexKey) => Promise<void>;
    softDeleteMany: <T>(query: FilterQuery<T>) => Promise<void>;
    recalculateTags: (key: IndexKey) => Promise<void>;
}

export const HistoricComponentIndexModel = model<HistoricComponentIndexDoc, HistoricComponentModelInterface>("HistoricComponentIndex", HistoricComponentIndexSchema, HISTORIC_COMPONENT_INDEX_COLLECTION_NAME);

export interface ComponentDependencyDoc {
    id: string;
    parentId: Types.ObjectId;
    childId: Types.ObjectId;
    parentDefinitionId: string;
    childDefinitionId: string;
    analysis: Types.ObjectId;
    workspace: Types.ObjectId;
    usages: ComponentUsage[];
}

// This is a minimal representation of dependencies between components.
// We might need to denormalize the component doc here in order to improve performance for analytics queries.
const ComponentDependencySchema = new Schema<ComponentDependencyDoc>({
    parentId: { type: Schema.Types.ObjectId, ref: "Component", required: true },
    childId: { type: Schema.Types.ObjectId, ref: "Component", required: true },
    parentDefinitionId: { type: String, required: true },
    childDefinitionId: { type: String, required: true },
    analysis: { type: Schema.Types.ObjectId, ref: "Analysis", required: true },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    usages: [{
        _id: false,
        start: CharacterPositionSchema,
        end: CharacterPositionSchema,
        props: [{
            _id: false,
            name: { type: String, default: "" },
            value: {
                type: Schema.Types.Mixed,
                required: false,
                validate: validatePropValue,
                set: castPropValue,
            },
        }],
    }],
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    versionKey: false,
});

ComponentDependencySchema.static("softDeleteMany", async function <T>(query: FilterQuery<T>): Promise<void> {
    try {
        await ComponentDependencyModel.aggregate([
            { $match: query },
            {
                $merge: {
                    into: `${COMPONENT_DEPENDENCY_COLLECTION_NAME}.deleted`,
                    on: "_id",
                    whenMatched: "replace",
                },
            },
        ]);
    } catch (e) {
        logException(new BaseError("Failed to soft delete", true, { reason: e as Error, details: { query } }));
    }

    await ComponentDependencyModel.deleteMany(query);
});

interface ComponentDependencyModelInterface extends Model<ComponentDependencyDoc> {
    softDeleteMany: <T>(query: FilterQuery<T>) => Promise<void>;
}

export const ComponentDependencyModel = model<ComponentDependencyDoc, ComponentDependencyModelInterface>("ComponentDependency", ComponentDependencySchema, COMPONENT_DEPENDENCY_COLLECTION_NAME);

export interface DependencyGraphDoc {
    predecessors: Map<string, string[]>;
    analysis: Types.ObjectId;
    workspace: Types.ObjectId;
}

const DependencyGraphSchema = new Schema<DependencyGraphDoc>({
    predecessors: {
        type: Map,
        of: [String],
    },
    analysis: { type: Schema.Types.ObjectId, ref: "Analysis", required: true },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
});
DependencyGraphSchema.static("softDeleteMany", async function <T>(query: FilterQuery<T>): Promise<void> {
    try {
        await DependencyGraphModel.aggregate([
            { $match: query },
            {
                $merge: {
                    into: `${DEPENDENCY_GRAPH_COLLECTION_NAME}.deleted`,
                    on: "_id",
                    whenMatched: "replace",
                },
            },
        ]);
    } catch (e) {
        logException(new BaseError("Failed to soft delete", true, { reason: e as Error, details: { query } }));
    }

    await DependencyGraphModel.deleteMany(query);
});

interface DependencyGraphModelInterface extends Model<DependencyGraphDoc> {
    softDeleteMany: <T>(query: FilterQuery<T>) => Promise<void>;
}

export const DependencyGraphModel = model<DependencyGraphDoc, DependencyGraphModelInterface>("DependencyGraph", DependencyGraphSchema, DEPENDENCY_GRAPH_COLLECTION_NAME);

export interface DataAnalysis {
    analysisDate: string;
    parentPackageName: string;
    parentCustomProperty: string;
    childDefinitionId: string;
    childPackageName: string;
    childName: string;
    childTag: string;
    sumOfUsages: number;
}
