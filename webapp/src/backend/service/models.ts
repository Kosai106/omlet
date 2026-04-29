import { Schema } from "mongoose";

import { type DateOption } from "../../common/models/DateOption";
import { type DateFilterOperation, type EqualityFilterOperation, type NumberFilterOperation, type StringFilterOperation, FilterOperation } from "../../common/models/FilterOperation";

import { escapeRegex } from "./utils";
import { type TreeNode } from "./workspace/workspace";

export interface EqualityFilter {
    operation: EqualityFilterOperation;
    values: string[];
}

export interface StringFilter {
    operation: StringFilterOperation;
    value: string;
}

export interface NumberFilter {
    operation: NumberFilterOperation;
    value: number;
}

export type DateFilterValue = Date | DateOption | undefined;
export interface DateFilter {
    operation: DateFilterOperation;
    value: [DateFilterValue, DateFilterValue];
}

export enum ReservedProjectName {
    None = "<none>",
}

export enum ReservedCustomPropertyValue {
    NotSet = "<not-set>",
}

export interface RepositorySubDoc {
    scope?: string;
    name?: string;
    branch?: string;
    url?: string;
    initialCommitHash?: string;
}

export const RepositorySchema = new Schema<RepositorySubDoc>({
    scope: { type: String, required: false },
    name: { type: String, required: false },
    branch: { type: String, required: false },
    url: { type: String, required: false },
    initialCommitHash: { type: String, required: false },
}, { _id: false });

export function equalityFilterIntoQuery(filter: EqualityFilter) {
    switch (filter.operation) {
        case FilterOperation.Equals:
            return {
                $in: filter.values,
            };
        case FilterOperation.IsNotEqual:
            return {
                $nin: filter.values,
            };
    }
}

export function stringFilterIntoQuery(filter: StringFilter) {
    const escapedValue = escapeRegex(filter.value);

    switch (filter.operation) {
        case FilterOperation.StartsWith:
            return {
                $regex: `^${escapedValue}`,
                $options: "i",
            };
        case FilterOperation.DoesNotStartWith:
            return {
                $not: {
                    $regex: `^${escapedValue}`,
                    $options: "i",
                },
            };
        case FilterOperation.EndsWith:
            return {
                $regex: `${escapedValue}$`,
                $options: "i",
            };
        case FilterOperation.DoesNotEndWith:
            return {
                $not: {
                    $regex: `${escapedValue}$`,
                    $options: "i",
                },
            };
        case FilterOperation.Contains:
            return {
                $regex: escapedValue,
                $options: "i",
            };
        case FilterOperation.DoesNotContain:
            return {
                $not: {
                    $regex: escapedValue,
                    $options: "i",
                },
            };
        case FilterOperation.Regex:
            return {
                $regex: filter.value,
                $options: "i",
            };
    }
}

function numberFilterOperationIntoOperator(operation: NumberFilterOperation): string {
    switch (operation) {
        case FilterOperation.Equals:
            return "$eq";
        case FilterOperation.LessThan:
            return "$lt";
        case FilterOperation.GreaterThan:
            return "$gt";
    }
}

export function numberFilterIntoQuery(filter: NumberFilter) {
    const operator = numberFilterOperationIntoOperator(filter.operation);

    return { [operator]: filter.value };
}

export function folderFilterIntoQuery(selectedTreeNodes: TreeNode[], deselectedTreeNodes: TreeNode[]) {
    const reduceForMatchedTreeNode = {
        $cond: {
            if: {
                $and: [
                    { $eq: ["$$this.packageName", "$packageName"] },
                    {
                        $or: [
                            { $eq: ["$$this.path", ""] },
                            {
                                $regexMatch: {
                                    input: "$path",
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
        $expr: {
            $let: {
                vars: {
                    matchedSelectedTreeNodePath: {
                        $reduce: {
                            input: selectedTreeNodes,
                            initialValue: null,
                            in: reduceForMatchedTreeNode,
                        },
                    },
                    matchedDeselectedTreeNodePath: {
                        $reduce: {
                            input: deselectedTreeNodes,
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
    };
}
