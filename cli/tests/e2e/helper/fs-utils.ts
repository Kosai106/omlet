import fs from "fs";
import os from "os";
import path from "upath";

export function getTempFolder() {
    const tempRoot = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "omlet-cli"));

    return tempRoot;
}
