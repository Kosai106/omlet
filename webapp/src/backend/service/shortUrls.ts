import { Schema, model } from "mongoose";

import { config } from "../../config/backend";


interface ShortUrlDoc {
    shortPath: string;
    fullUrl: string;
    description: string;
}

const ShortUrlSchema = new Schema<ShortUrlDoc>({
    shortPath: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
    },
    fullUrl: {
        type: String,
        required: true,
    },
    description: {
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

const ShortUrlModel = model<ShortUrlDoc>("ShortUrl", ShortUrlSchema);

function getShortUrlPath(shortPath: string): string {
    return `/l/${shortPath.replace(/^\/+/, "")}`;
}

export async function createShortUrl(shortPath: string, fullUrl: string, description: string): Promise<string> {
    const doc = new ShortUrlModel({
        fullUrl,
        shortPath: getShortUrlPath(shortPath),
        description,
    });

    await doc.save();

    const url = new URL(config.APP_BASE_URL);

    url.pathname = doc.shortPath;

    return url.toString();
}


export async function getFullUrl(shortPath: string): Promise<string | null> {
    const doc = await ShortUrlModel.findOne({ shortPath });

    return doc && doc.fullUrl;
}
