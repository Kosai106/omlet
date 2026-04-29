import * as fs from "fs";

import { runNpm, removeOptionalDependencies } from "./helper/npm";
import { spawnRegistry, pidFilePath, registryUrl } from "./helper/registry";

// eslint-disable-next-line import/no-default-export
export default async function () {
    console.log("Setting up the registry server!");
    const childProc = await spawnRegistry();

    fs.writeFileSync(pidFilePath, childProc.pid?.toString() ?? "");

    await runNpm(["publish", "--registry", registryUrl]);

    // After publishing to the registry, we remove the optional dependencies.
    // This is done because these dependencies are added during the `npm publish` command,
    // but are not necessary for the main functionality of our application.
    // By removing them, we keep our repository clean and focused.
    await removeOptionalDependencies();
}
