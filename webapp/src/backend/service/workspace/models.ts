import { type Model, type Types, model, Schema } from "mongoose";

import { FilterDataType } from "../../../common/models/FilterDataType";
import { FilterOperation } from "../../../common/models/FilterOperation";
import { type RepositorySubDoc, RepositorySchema } from "../models";

export interface WorkspaceInviteDoc {
    _id: Types.ObjectId;
    code: string;
    email: string;
    workspace: Types.ObjectId;
    referrer?: Types.ObjectId;
    user?: Types.ObjectId;
    expiresAt: Date;
    isUsed: boolean;
}

const WorkspaceInviteSchema = new Schema<WorkspaceInviteDoc>({
    code: {
        type: String,
        trim: true,
        required: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    referrer: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    workspace: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    isUsed: {
        type: Boolean,
        required: true,
        default: false,
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

export const WorkspaceInviteModel = model<WorkspaceInviteDoc>("WorkspaceInvite", WorkspaceInviteSchema);

const WORKSPACE_INVITE_LINK_COLLECTION_NAME = "workspaceInviteLinks";

export interface WorkspaceInviteLinkDoc {
    _id: Types.ObjectId;
    code: string;
    workspace: Types.ObjectId;
    numberUsed: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const WorkspaceInviteLinkSchema = new Schema<WorkspaceInviteLinkDoc>({
    code: {
        type: String,
        trim: true,
        required: true,
    },
    workspace: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },
    numberUsed: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true,
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

export const WorkspaceInviteLinkModel = model<WorkspaceInviteLinkDoc>("WorkspaceInviteLink", WorkspaceInviteLinkSchema, WORKSPACE_INVITE_LINK_COLLECTION_NAME);

const WORKSPACE_INVITE_LINK_USAGE_COLLECTION_NAME = "workspaceInviteLinks.usages";

export interface WorkspaceInviteLinkUsageDoc {
    _id: Types.ObjectId;
    code: string;
    workspace: Types.ObjectId;
    user: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const WorkspaceInviteLinkUsageSchema = new Schema<WorkspaceInviteLinkUsageDoc>({
    code: {
        type: String,
        trim: true,
        required: true,
    },
    workspace: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
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

export const WorkspaceInviteLinkUsageModel = model<WorkspaceInviteLinkUsageDoc>("WorkspaceInviteLinkUsage", WorkspaceInviteLinkUsageSchema, WORKSPACE_INVITE_LINK_USAGE_COLLECTION_NAME);

const WORKSPACE_JOIN_REQUEST_COLLECTION_NAME = "workspaceJoinRequests";

export interface WorkspaceJoinRequestDoc {
    _id: Types.ObjectId;
    workspace: Types.ObjectId;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

const WorkspaceJoinRequestSchema = new Schema<WorkspaceJoinRequestDoc>({
    workspace: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },
    email: {
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

export const WorkspaceJoinRequestModel = model<WorkspaceJoinRequestDoc>("WorkspaceJoinRequest", WorkspaceJoinRequestSchema, WORKSPACE_JOIN_REQUEST_COLLECTION_NAME);

export interface ProjectDoc {
    name: string;
    packageName: string;
    alias: string;
    slug: string;
    isInternal: boolean;
    repository?: RepositorySubDoc;
}

export interface ComponentTagFilterDoc {
    field: string;
    dataType: FilterDataType;
    operation: FilterOperation;
    value: string[];
}

export interface TreeNodeDoc {
    packageName: string;
    path: string;
}

export interface ComponentTagDoc {
    slug: string;
    name: string;
    color: string;
    searchTerm?: string[];
    selectedTreeNodes: TreeNodeDoc[];
    deselectedTreeNodes: TreeNodeDoc[];
    filters: ComponentTagFilterDoc[];
    createdAt: Date;
    updatedAt: Date;
}

const TreeNodeSchema = new Schema<TreeNodeDoc>({
    path: { type: String, default: "" },
    packageName: { type: String, required: true },
}, { _id: false });

export const ComponentTagSchema = new Schema<ComponentTagDoc>({
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    searchTerm: [String],
    selectedTreeNodes: [TreeNodeSchema],
    deselectedTreeNodes: [TreeNodeSchema],
    filters: [{
        _id: false,
        field: { type: String, required: true },
        dataType: { type: String, enum: Object.values(FilterDataType), required: true },
        operation: { type: String, enum: FilterOperation, required: true },
        value: { type: [String], required: true },
    }],
}, { _id: false, timestamps: true });

export interface WorkspaceDoc {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    isPublic: boolean;
    projects: ProjectDoc[];
    numOfComponents: number;
    members: {
        user: Types.ObjectId;
        joinedAt: Date;
    }[];
    tags: ComponentTagDoc[];
    createdAt: Date;
    createdBy: Types.ObjectId;
}

const WorkspaceSchema = new Schema<WorkspaceDoc>({
    name: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
        unique: true,
    },
    isPublic: {
        type: Boolean,
        default: false,
    },
    projects: [{
        _id: false,
        packageName: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        alias: { type: String, required: false, maxlength: 50 },
        slug: { type: String, required: true, unique: true },
        isInternal: { type: Boolean, required: true },
        repository: { type: RepositorySchema, required: false },
    }],
    numOfComponents: {
        type: Number,
        required: true,
        default: 0,
    },
    members: [{
        _id: false,
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        joinedAt: {
            type: Date,
            required: true,
        },
    }],
    tags: [ComponentTagSchema],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
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

interface WorkspaceModelInterface extends Model<WorkspaceDoc> {
    findBySlug: (slug: string) => Promise<WorkspaceDoc | null>;
    findSlugsStartingWith: (slug: string) => Promise<string[]>;
    findSlug: (workspaceId: Types.ObjectId) => Promise<string>;
    insertMember: (workspaceId: Types.ObjectId, userId: string) => Promise<void>;
}

WorkspaceSchema.static("findBySlug", function (slug: string): Promise<WorkspaceDoc | null> {
    return WorkspaceModel.findOne({
        slug,
    }).lean().exec();
});

WorkspaceSchema.static("findSlugsStartingWith", async function (slug: string): Promise<string[]> {
    const workspaces = await WorkspaceModel.find({
        slug: new RegExp(`^${slug}`),
    }, {
        slug: 1,
    }).exec();

    return workspaces.map(({ slug }) => slug);
});

WorkspaceSchema.static("insertMember", async function (workspaceId: Types.ObjectId, userId: string) {
    await WorkspaceModel.updateOne({
        _id: workspaceId,
    }, {
        $push: {
            members: {
                user: userId,
                joinedAt: new Date(),
            },
        },
    });
});

WorkspaceSchema.static("findSlug", async function (workspaceId: Types.ObjectId): Promise<string | null> {
    const result = await WorkspaceModel.findOne({
        _id: workspaceId,
    }, {
        slug: 1,
    }).lean().exec();

    return result && result.slug;
});

export const WorkspaceModel = model<WorkspaceDoc, WorkspaceModelInterface>("Workspace", WorkspaceSchema);
