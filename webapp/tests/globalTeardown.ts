import { close as closeDb, drop as dropDb } from "./helper/db/mongo";

// eslint-disable-next-line import/no-default-export
export default async (): Promise<void> => {
    await dropDb();
    await closeDb();
};
