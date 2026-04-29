import mongoose from "mongoose";

const options = {
    readPreference: mongoose.mongo.ReadPreference.SECONDARY_PREFERRED,
};

export async function initDb({ mongoUri, debugEnabled } : { mongoUri: string; debugEnabled?: boolean; }) {
    if (!mongoUri) {
        throw new Error("Mongo URI is required");
    }

    if (debugEnabled) {
        mongoose.set("debug", debugEnabled);
    }

    await mongoose.connect(mongoUri, options);
    mongoose.set("strictQuery", true);
}

export async function closeDb() {
    await mongoose.disconnect();
}
