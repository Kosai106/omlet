import { promises as fs, constants as fsConstants } from "fs";
import os from "os";
import upath from "upath";

export async function pathExists(p: string): Promise<boolean> {
    try {
        await fs.access(p, fsConstants.F_OK);
        return true;
    } catch {
        return false;
    }
}

export async function readIfExists(filePath: string): Promise<string | undefined> {
    if (await pathExists(filePath)) {
        return await fs.readFile(filePath, "utf8");
    }
}

export async function listDir(path: string) {
    try {
        return await fs.readdir(path, { withFileTypes: true });
    } catch (err) {
        console.error(err);

        return [];
    }
}

export function resolvePath(path: string) {
    if (path.startsWith("~/")) {
        return upath.resolve(os.homedir(), path.slice(2));
    }
    return upath.resolve(process.cwd(), path);
}

export function normalizeTrimPath(inputPath: string): string {
    // normalize ensures forward-slahses used and removes unnecessary . at the beginning of the path
    // normalizeTrim removes trailing slashes
    return upath.normalizeTrim(upath.normalize(inputPath));
}
