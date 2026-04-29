import { execFile } from "child_process";

export function runCli(cliPath: string, args?: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        execFile(
            cliPath,
            args,
            (error, stdout, stderr) => {
                if (error) {
                    console.log("stdout", stdout);
                    console.error("stderr", stderr);
                    return reject(error);
                }

                resolve(stdout);
            }
        );
    });
}
