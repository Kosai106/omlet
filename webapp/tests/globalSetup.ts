import { config } from "dotenv";

import { drop as dropDb, init as initDb } from "./helper/db/mongo";
import { runShellCommand } from "./helper/db/runShellCommand";

config({ path: "./.env.test" });

// eslint-disable-next-line import/no-default-export
export default async (): Promise<void> => {
    await initDb();
    await dropDb();

    await runShellCommand("migrate-mongo up -f ./tests/helper/db/migrate-mongo-test-config.js");
};
