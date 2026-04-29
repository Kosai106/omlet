import { execFile } from "child_process";

export function runNpm(args: string[], opts = {}) {
    return new Promise<void>((resolve, reject) => {
        execFile(
            "npm",
            args,
            opts,
            (error, stdout, stderr) => {
                if (error) {
                    console.error("stderr", stderr);
                    return reject(error);
                }

                resolve();
            }
        );
    });
}


interface PackageJson {
    optionalDependencies?: Record<string, string>;
}

export async function removeOptionalDependencies() {
    const packageJson = await import("../../../package.json") as PackageJson;

    if (!packageJson.optionalDependencies) {
        return;
    }

    for (const dependency of Object.keys(packageJson.optionalDependencies)) {
        if (dependency.startsWith("@omlet/cli")) {
            await runNpm(["uninstall", dependency]);
        }
    }
}
