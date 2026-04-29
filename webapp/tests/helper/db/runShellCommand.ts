import { exec } from "child_process";

export function runShellCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(command, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}
