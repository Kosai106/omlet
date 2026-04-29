import mongoose from "mongoose";

import { initDb, closeDb } from "../../../src/backend/service/database";

export async function init(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI ?? "";
    await initDb({ mongoUri, debugEnabled: false });
}

export async function close(): Promise<void> {
    await closeDb();
}

export async function drop() {
    await mongoose.connection.dropDatabase();
}
