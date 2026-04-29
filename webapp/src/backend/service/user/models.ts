import { type Model, type Types, model, Schema } from "mongoose";

import { LoginProviderType } from "../auth/models";

export enum Profession {
    Developer = "developer",
    Designer = "designer",
    ProductManager = "productManager",
    TeamLead = "teamLead",
    Executive = "executive",
}

export interface UserDoc {
    id: string;
    email: string;
    referrer?: Types.ObjectId;
    fullName?: string;
    avatarUrl?: string;
    profession?: Profession;
    loginProviders: [{
        externalId: string;
        type: LoginProviderType;
    }];
    utm?: {
        source: string;
        medium: string;
        campaign?: string;
        content?: string;
        term?: string;
    };
    lastSeen?: Date;
    createdAt: Date;
}

const UserSchema = new Schema<UserDoc>({
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
    },
    referrer: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    loginProviders: [{
        _id: false,
        externalId: { type: String, required: true },
        type: { type: String, enum: LoginProviderType, required: true },
    }],
    utm: {
        source: {
            type: String,
            trim: true,
        },
        medium: {
            type: String,
            trim: true,
        },
        campaign: {
            type: String,
            trim: true,
        },
        content: {
            type: String,
            trim: true,
        },
        term: {
            type: String,
            trim: true,
        },
    },
    fullName: String,
    avatarUrl: String,
    profession: { type: String, enum: Profession, required: false },
    lastSeen: {
        type: Date,
        default: undefined,
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

interface UserModelInterface extends Model<UserDoc> {
    findByEmail: (email: string) => Promise<UserDoc | null>;
    findByEmails: (emails: string[]) => Promise<UserDoc | null>;
}

UserSchema.static("findByEmail", function (email: string): Promise<UserDoc | null> {
    return UserModel.findOne({
        email,
    }).exec();
});

UserSchema.static("findByEmails", function (emails: string[]): Promise<UserDoc | null> {
    return UserModel.findOne({
        email: { $in: emails },
    }).exec();
});

export const UserModel = model<UserDoc, UserModelInterface>("User", UserSchema);

export interface UserSessionDoc {
    id: string;
    user: Types.ObjectId;
    loginProvider: LoginProviderType;
}

const UserSessionSchema = new Schema<UserSessionDoc>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    loginProvider: {
        type: String,
        enum: LoginProviderType,
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

export const UserSessionModel = model<UserSessionDoc>("UserSession", UserSessionSchema);

export interface AdminUserDoc {
    user: Types.ObjectId;
}

const AdminUserSchema = new Schema<AdminUserDoc>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
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

export const AdminUserModel = model<AdminUserDoc>("AdminUser", AdminUserSchema);
