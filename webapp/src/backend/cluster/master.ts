import cluster from "cluster";
import os from "os";

import { config } from "../../config/backend";
import { error, log } from "../service/logger";
export const start = () => {
    const cores = os.cpus().length;

    for (let i = 0; i < cores; i++) {
        cluster.fork();
    }

    cluster.on("disconnect", worker => {
        log(`Worker ${worker.id} disconnected.`);
    });

    cluster.on("exit", (worker, code, signal) => {
        // if exit code is gracefulWorkerShutdownExitCode, that means worker exited with success, not by an exception. No need to restart it.
        if (code === config.GRACEFUL_WORKER_SHUTDOWN_EXIT_CODE) {
            log(`Worker ${worker.id} gracefully exited.`);
            return;
        }
        error(`Worker ${worker.id} died (${signal || code}), restarting.`);
        cluster.fork();
    });

    ["SIGINT", "SIGTERM"].forEach(signal => {
        process.on(signal, () => {
            log(`Master  ${process.pid} received ${signal}, preparing for graceful shutdown.`);

            // In container env,only master process receives the signal from Kubernetes. So master should pass the signal to the workers.
            if (config.ENABLE_CLUSTER && cluster.workers) {
                for (const worker of Object.values(cluster.workers)) {
                    worker?.kill(signal);
                }
            }

            setInterval(async () => {
                let workerCount = 0;
                if (cluster.workers) {
                    workerCount = Object.keys(cluster.workers).length;
                }

                // If there is no worker left, master can exit also.
                if (workerCount === 0) {
                    log("All workers exited gracefully, exiting master process.");

                    // Exit with success code.
                    // eslint-disable-next-line no-process-exit
                    process.exit(0);
                }
            }, 1000);
        });
    });
};
