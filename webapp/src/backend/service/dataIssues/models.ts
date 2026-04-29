import { type Model, model, type Types, Schema } from "mongoose";

import { BaseError } from "../../error";
import { logException } from "../logger";

const DATA_ISSUES_COLLECTION_NAME = "dataIssues";

interface InvalidDependencyDoc {
    packageName: string;
    path: string;
    sourcePackageName: string;
}

export interface DataIssuesDoc {
    workspace: Types.ObjectId;
    analysis: Types.ObjectId;
    invalidDependencies: InvalidDependencyDoc[];
}

const DataIssuesSchema = new Schema<DataIssuesDoc>({
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    analysis: { type: Schema.Types.ObjectId, ref: "Analysis", required: true },
    invalidDependencies: [{
        packageName: { type: String, required: true },
        path: { type: String, default: "" },
        sourcePackageName: { type: String, required: true },
    }],
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

interface SoftDeleteProps {
    workspace: Types.ObjectId;
    analysis: Types.ObjectId;
}
DataIssuesSchema.static("softDelete", async function (props: SoftDeleteProps) {
    try {
        await DataIssuesModel.aggregate([
            {
                $match: props,
            },
            {
                $merge: {
                    into: `${DATA_ISSUES_COLLECTION_NAME}.deleted`,
                    on: "_id",
                    whenMatched: "replace",
                },
            },
        ]);
    } catch (e) {
        logException(new BaseError("Failed to soft delete", true, { reason: e as Error, details: { ...props } }));
    }

    await DataIssuesModel.deleteOne(props);
});
DataIssuesSchema.static("softDeleteMany", async function (workspace: Types.ObjectId) {
    try {
        await DataIssuesModel.aggregate([
            {
                $match: {
                    workspace,
                },
            },
            {
                $merge: {
                    into: `${DATA_ISSUES_COLLECTION_NAME}.deleted`,
                    on: "_id",
                    whenMatched: "replace",
                },
            },
        ]);
    } catch (e) {
        logException(new BaseError("Failed to soft delete", true, { reason: e as Error, details: { workspace } }));
    }

    await DataIssuesModel.deleteMany({ workspace });
});

interface DataIssuesModelInterface extends Model<DataIssuesDoc> {
    softDelete: (props: SoftDeleteProps) => Promise<void>;
    softDeleteMany: (workspace: Types.ObjectId) => Promise<void>;
}
export const DataIssuesModel = model<DataIssuesDoc, DataIssuesModelInterface>("DataIssues", DataIssuesSchema, DATA_ISSUES_COLLECTION_NAME);

