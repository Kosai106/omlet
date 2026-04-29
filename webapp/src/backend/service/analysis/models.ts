import MongoPaging, {
    type PaginationParams as MongoPaginationParams,
    type PaginationResult as MongoPaginationResult,
} from "mongo-cursor-pagination";
import { type FilterQuery, type Model, type Types, model, Schema, type HydratedDocument } from "mongoose";

import { type AnalysisResult } from "../../../cliDataModels/AnalysisResult";
import { BaseError } from "../../error";
import { type ComponentViewModel } from "../component/models";
import { logException } from "../logger";
import { type RepositorySubDoc, RepositorySchema } from "../models";
import { type ComponentTagDoc, ComponentTagSchema } from "../workspace/models";

export const ANALYSIS_COLLECTION_NAME = "analyses";

export interface AnalysisDoc {
    _id: Types.ObjectId;
    workspace: Types.ObjectId;
    packageNames: string[];
    tags: ComponentTagDoc[];
    createdBy: Types.ObjectId;
    meta: {
        numOfComponents: number;
        numOfModules: number;
        numOfExports: number;
        numOfDependencies: number;
        numOfCommits?: number; // will be required when all clients send this data
        numOfDeltas?: number; // will be required when all clients send this data
        analyzeDurationMsec?: number; // will be required when all clients send this data
        parseDurationMsec?: number; // will be required when all clients send this data
        dateExtractionMsec?: number; // will be required when all clients send this data
        durationMsec: number;
        cliVersion: string;
        cliParams?: Record<string, unknown>;
        argv?: string;
        nodeVersion?: string;
        deviceInfo?: {
            os: string;
            arch: string;
            version: string;
        };
    };
    repository?: RepositorySubDoc;
    createdAt: Date;
    updatedAt: Date;
}

const AnalysisSchema = new Schema<AnalysisDoc>({
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    packageNames: [String],
    tags: [ComponentTagSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    repository: {
        type: RepositorySchema,
        required: false,
    },
    meta: {
        type: new Schema({
            numOfComponents: { type: Number, required: true },
            numOfModules: { type: Number, required: true },
            numOfExports: { type: Number, required: true },
            numOfDependencies: { type: Number, required: true },
            numOfCommits: { type: Number, required: false }, // will be required when all clients send this data
            numOfDeltas: { type: Number, required: false }, // will be required when all clients send this data
            analyzeDurationMsec: { type: Number, required: false }, // will be required when all clients send this data
            parseDurationMsec: { type: Number, required: false }, // will be required when all clients send this data
            dateExtractionMsec: { type: Number, required: false }, // will be required when all clients send this data
            durationMsec: { type: Number, required: true },
            cliVersion: { type: String, required: true },
            cliParams: { type: Object, required: false },
            cliConfig: { type: Object, required: false },
            argv: { type: String, required: false },
            nodeVersion: { type: String, required: false }, // will be when required all clients send this data
            deviceInfo: {
                type: new Schema({
                    os: String,
                    arch: String,
                    version: String,
                }, { _id: false }),
                required: false,
            },
        }, { _id: false }),
        required: true,
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


AnalysisSchema.plugin(MongoPaging.mongoosePlugin, { name: "__paginate" });

AnalysisSchema.static("paginate", async function (params: PaginationParams): Promise<PaginationResult> {
    const page = await AnalysisModel.__paginate({
        query: params.query,
        limit: params.limit,
        paginatedField: params.paginatedField,
        sortAscending: params.sortAscending,
        next: params.next,
        prev: params.prev,
    });

    return {
        ...page,
        results: page.results.map(doc => AnalysisModel.hydrate(doc)),
    };
});

AnalysisSchema.static("softDelete", async function (id: Types.ObjectId): Promise<void> {
    try {
        await AnalysisModel.aggregate([
            {
                $match: {
                    _id: id,
                },
            },
            {
                $merge: {
                    into: `${ANALYSIS_COLLECTION_NAME}.deleted`,
                    on: "_id",
                    whenMatched: "replace",
                },
            },
        ]);
    } catch (e) {
        logException(new BaseError("Failed to soft delete", true, { reason: e as Error, details: { id } }));
    }


    await AnalysisModel.deleteOne({
        _id: id,
    });
});

AnalysisSchema.static("softDeleteMany", async function <T>(query: FilterQuery<T>): Promise<void> {
    try {
        await AnalysisModel.aggregate([
            {
                $match: query,
            },
            {
                $merge: {
                    into: `${ANALYSIS_COLLECTION_NAME}.deleted`,
                    on: "_id",
                    whenMatched: "replace",
                },
            },
        ]);
    } catch (e) {
        logException(new BaseError("Failed to soft delete", true, { reason: e as Error, details: { query } }));
    }

    await AnalysisModel.deleteMany(query);
});

export type PaginationParams = MongoPaginationParams<AnalysisDoc>;
export type PaginationResult = MongoPaginationResult<AnalysisDoc>;

export type AnalysisDocument = HydratedDocument<AnalysisDoc>;
interface AnalysisModelInterface extends Model<AnalysisDoc> {
    __paginate: (params: PaginationParams) => Promise<MongoPaginationResult<unknown>>;
    paginate: (params: PaginationParams) => Promise<PaginationResult>;
    softDelete: (id: Types.ObjectId) => Promise<void>;
    softDeleteMany: <T>(query: FilterQuery<T>) => Promise<void>;
}

export const AnalysisModel = model<AnalysisDoc, AnalysisModelInterface>("Analysis", AnalysisSchema, ANALYSIS_COLLECTION_NAME);

export interface AnalysisViewModel extends Omit<AnalysisResult, "components"> {
    components: ComponentViewModel[];
}
