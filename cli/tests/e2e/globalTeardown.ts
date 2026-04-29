import * as fs from "fs";

import { pidFilePath } from "./helper/registry";

// eslint-disable-next-line import/no-default-export
export default async function () {
    const pidFileContent = fs.readFileSync(pidFilePath).toString().trim();

    if (pidFileContent) {
        console.log("Killing the registry server!");

        process.kill(Number.parseInt(pidFileContent, 10));
        fs.rmSync(pidFilePath);
    }
}
