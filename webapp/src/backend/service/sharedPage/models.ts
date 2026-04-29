import { type Types, Schema, model } from "mongoose";

export const SHARED_PAGE_COLLECTION_NAME = "sharedPages";

export interface SharedPageDoc {
    _id: Types.ObjectId;
    workspace: Types.ObjectId;
    url: string;
    code: string;
}

const SharedPageSchema = new Schema<SharedPageDoc>({
    workspace: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },
    url: {
        type: String,
        required: true,
        unique: true,
    },
    code: {
        type: String,
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

export const SharedPageModel = model<SharedPageDoc>("SharedPage", SharedPageSchema, SHARED_PAGE_COLLECTION_NAME);
