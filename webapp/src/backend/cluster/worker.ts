import cluster from "cluster";
import { type HttpTerminator, createHttpTerminator } from "http-terminator";

import { config } from "../../config/backend";
import { createApp, initServices, terminateServices } from "../app";
import { healthCheckService } from "../service/healthcheck";
import { logException, log } from "../service/logger";


let httpTerminator: HttpTerminator;
async function main() {
    await initServices();

    const app = await createApp({
        addViteMw: config.USE_VITE_MIDDLEWARE,
    });

    const server = app.listen(config.PORT, () => {
        log(`App is running at http://localhost:${config.PORT} (env: ${config.APP_ENV})`);
    });

    httpTerminator = createHttpTerminator({ server, gracefulTerminationTimeout: config.HTTP_GRACEFUL_TERMINATION_TIMEOUT });

    const processName = `Worker ${cluster.worker?.id}`;

    ["SIGINT", "SIGTERM"].forEach(signal => {
        process.on(signal, () => {
            log(`${processName} (pid: ${process.pid}) received ${signal}, preparing for graceful shutdown.`);
            healthCheckService.markUnhealthy();

            // Kubernetes stops routing requests after (failureThreshold=2 * periodSecond=5) = 10s.
            // Delaying shutdown operation until there will be no incoming requests.
            setTimeout(() => shutdown(config.GRACEFUL_WORKER_SHUTDOWN_EXIT_CODE), config.SHUTDOWN_DELAY);
        });
    });
    healthCheckService.markHealthy();
}

const closeWebserver = async () => {
    if (httpTerminator) {
        await httpTerminator.terminate();
        log("Webserver terminated successfully.");
    }
};


const shutdown = async (exitCode: number) => {
    try {
        await closeWebserver();
        await terminateServices();
    } catch (err) {
        logException(err);
    } finally {
        process.exit(exitCode);
    }
};

export const start = () => {
    main().catch(async e => {
        log("Express server crashed. Terminating the process.");

        logException(e);

        await terminateServices();

        process.exit(1);
    }).catch(logException);
};
