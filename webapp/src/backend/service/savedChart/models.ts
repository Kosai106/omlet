import { type Model, type Types, Schema, model } from "mongoose";

import { AnalysisSubject } from "../../../common/models/AnalysisSubject";
import { AnalysisType } from "../../../common/models/AnalysisType";
import { BreakdownType } from "../../../common/models/BreakdownType";
import { DataFrequencyOption } from "../../../common/models/DataFrequencyOption";
import { type Filter } from "../../../common/models/Filter";
import { FilterOperation } from "../../../common/models/FilterOperation";
import { FilterType } from "../../../common/models/FilterType";
import { type TimeSeriesFilter } from "../../../common/models/TimeSeriesFilter";
import { TimeWindowOption } from "../../../common/models/TimeWindowOption";
import { BaseError } from "../../error";
import { logException } from "../logger";

export const SAVED_CHART_COLLECTION_NAME = "savedCharts";

export interface SavedChartDoc {
    _id: Types.ObjectId;
    slug: string;
    workspace: Types.ObjectId;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string;
    order: string;
    analysisType: AnalysisType;
    analysisSubject: AnalysisSubject;
    customProperty?: string;
    filters: Filter[];
    breakdownType?: BreakdownType;
    timeSeriesFilter: TimeSeriesFilter;
}

const SavedChartSchema = new Schema<SavedChartDoc>({
    slug: { type: String, required: true },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, maxlength: 72, required: true },
    description: { type: String, maxlength: 72, default: "" },
    order: { type: String, required: true },
    analysisType: {
        type: String,
        enum: AnalysisType,
        required: true,
    },
    analysisSubject: {
        type: String,
        enum: AnalysisSubject,
        required: true,
    },
    customProperty: {
        type: String,
        required: false,
    },
    filters: [{
        _id: false,
        type: {
            type: String,
            enum: FilterType,
            required: true,
        },
        operation: {
            type: String,
            enum: FilterOperation,
            required: true,
        },
        value: { type: [String], required: true },
    }],
    breakdownType: {
        type: String,
        enum: BreakdownType,
        default: undefined,
    },
    timeSeriesFilter: {
        _id: false,
        type: {
            frequency: {
                type: String,
                enum: DataFrequencyOption,
                required: true,
            },
            timeWindow: {
                type: String,
                enum: TimeWindowOption,
                required: true,
            },
        },
        required: false,
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
    },
    toObject: {
        virtuals: true,
    },
});

interface SavedChartModelInterface extends Model<SavedChartDoc> {
    softDelete(id: Types.ObjectId): Promise<void>;
}

SavedChartSchema.static("softDelete", async function (id: Types.ObjectId): Promise<void> {
    try {
        await SavedChartModel.aggregate([
            {
                $match: {
                    _id: id,
                },
            },
            {
                $merge: {
                    into: `${SAVED_CHART_COLLECTION_NAME}.deleted`,
                    on: "_id",
                    whenMatched: "replace",
                },
            },
        ]);
    } catch (error) {
        logException(new BaseError("Failed to soft delete", true, { reason: error as Error, details: { id } }));
    }

    await SavedChartModel.deleteOne({
        _id: id,
    });
});

export const SavedChartModel = model<SavedChartDoc, SavedChartModelInterface>("SavedChart", SavedChartSchema, SAVED_CHART_COLLECTION_NAME);
