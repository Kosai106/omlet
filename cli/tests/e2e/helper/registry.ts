import axios from "axios";
import { type ChildProcess, fork } from "child_process";
import path from "upath";

export function spawnRegistry(): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
        const pathVerdaccioModule = require.resolve("verdaccio/bin/verdaccio");
        const configPath = path.join(__dirname, "verdaccio.yml");
        const childFork = fork(
            pathVerdaccioModule,
            ["-c", configPath],
            { silent: false }
        );

        childFork.on("message", (msg) => {
            if (typeof msg === "object" && "verdaccio_started" in msg) {
                resolve(childFork);
            }
        });

        childFork.on("error", (err) => {
            reject([err]);
        });
    });
}

export const registryUrl = "http://localhost:4873";

export const pidFilePath = path.join(path.dirname(__dirname), "verdaccio-local.pid");

export async function checkRegistryHealth() {
    try {
        const res = await axios(`${registryUrl}/-/ping`);

        return res.status >= 200 && res.status < 400;
    } catch (err) {
        console.error(err);

        return false;
    }
}
