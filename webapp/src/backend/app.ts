import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import path from "path";

import { config } from "../config/backend";

import { errorMiddleware } from "./middleware/error";
import { jsonParser } from "./middleware/jsonParser";
import { loggerMiddleware } from "./middleware/logger";
import { requestEnhancer } from "./middleware/requestEnhancer";
import { router } from "./router/router";
import { closeCache, initCache } from "./service/cache/cache";
import { closeDb, initDb } from "./service/database";
import { initEmailing } from "./service/emailing";
import { logException, log } from "./service/logger";

const VITE_DEV_SERVER_PATH_PREFIX = "/vite-dev-server/";
const CACHE_TIMEOUT = 31556952000; // 1 year

interface AppOpts {
    addViteMw?: boolean;
    staticMiddlewareEnabled?: boolean;
}

export async function initServices() {
    initEmailing();

    await initDb({
        mongoUri: config.MONGODB_URI,
        debugEnabled: config.MONGODB_DEBUG_ENABLED,
    });

    await initCache();
}


export async function terminateServices() {
    async function tryCalling(fn: Function) {
        try {
            await fn();
        } catch (error) {
            logException(error);
        }
    }

    await tryCalling(closeDb);
    await tryCalling(closeCache);
    log("Services terminated successfully.");
}

export async function createApp({
    addViteMw = config.USE_VITE_MIDDLEWARE,
    staticMiddlewareEnabled = config.USE_STATIC_MIDDLEWARE,
}: AppOpts = {}) {
    const app = express();

    if (config.RESPONSE_COMPRESSION_ENABLED) {
        app.use(compression());
    }

    app.use(cookieParser());

    app.use(express.urlencoded({ extended: true }));
    app.use(requestEnhancer);

    // Middleware that parses json and looks at requests where the Content-Type header matches the type option.
    app.use(jsonParser());

    app.use("/api", loggerMiddleware);

    // Serve API requests from the router
    app.use("/", router);

    if (addViteMw) {
        /* eslint-disable-next-line import/no-extraneous-dependencies */
        const { createServer: createViteServer } = await import("vite");

        // Create Vite server in middleware mode.
        const vite = await createViteServer({
            server: {
                middlewareMode: "html",
            },
            base: VITE_DEV_SERVER_PATH_PREFIX,
        });

        app.use(vite.middlewares);
    }

    if (staticMiddlewareEnabled) {
        app.use(express.static("dist/frontend", {
            cacheControl: true,
            maxAge: CACHE_TIMEOUT,
            immutable: true,
        }));
    }

    app.get("*catchAll", (_req, res) => {
        res.sendFile(path.resolve("dist/frontend/index.html"), {
            headers: {
                "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate",
            },
            etag: false,
            lastModified: false,
        });
    });

    app.use(errorMiddleware);

    return app;
}
