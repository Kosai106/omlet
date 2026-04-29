import { type Request } from "express";
import { type StatusCodes } from "http-status-codes";

import { BaseError } from "../error";

const LOG_LEVEL = {
    default: "info",
    info: "info",
    error: "error",
    request: "request",
    response: "response",
};

interface Logger {
    log(message: string, options?: { meta?: unknown; level?: string; }): void;
    flush(): void;
}

function createLogger(): Logger {
    return {
        log(message: string, options?: { meta?: unknown; level?: string; }): void {
            const timestamp = new Date().toISOString();
            const level = options?.level || LOG_LEVEL.default;
            const meta = options?.meta ? ` ${JSON.stringify(options.meta)}` : "";
            // eslint-disable-next-line no-console
            console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${meta}`);
        },
        flush(): void {
            // No-op for stdout logging
        },
    };
}

const logger = createLogger();

interface FormattedError {
    message: string;
    type: string;
    details?: unknown;
    reason?: FormattedError;
    stack?: string;
}

function formatError(err: BaseError | Error): FormattedError {
    let reason;
    let details;

    if (err instanceof BaseError) {
        reason = err.reason && formatError(err.reason);
        details = err.details;
    }

    return {
        message: err.message,
        type: err.name,
        reason,
        details,
        stack: err.stack,
    };
}

type RequestMetadata = Request["meta"];

export function logRequestError(method: string, url: string, metadata: RequestMetadata, err: Error) {
    const line = `${method} - ${url}`;

    if (process.env.APP_ENV === "test") {
        delete metadata.body;
    }

    const meta = {
        error: formatError(err),
        ...metadata,
    };

    try {
        logger.log(line, {
            meta,
            level: LOG_LEVEL.error,
        });
    } catch (error) {
        logException(error);
    }
}

export function logRequest(method: string, url: string, metadata: RequestMetadata) {
    const line = `${method} - ${url}`;

    if (process.env.APP_ENV === "test") {
        delete metadata.body;
    }

    try {
        logger.log(line, {
            meta: metadata,
            level: LOG_LEVEL.request,
        });
    } catch (error) {
        logException(error);
    }
}

export function logResponse(method: string, url: string, metadata: RequestMetadata, statusCode: StatusCodes) {
    const line = `${method} - ${url}`;

    if (process.env.APP_ENV === "test") {
        delete metadata.body;
    }

    try {
        logger.log(line, {
            meta: {
                ...metadata,
                statusCode,
            },
            level: LOG_LEVEL.response,
        });
    } catch (error) {
        logException(error);
    }
}

export function logException(error: unknown) {
    try {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const meta = error instanceof Error ? formatError(error) : undefined;

        logger.log(
            `ERROR - ${errorMessage}`,
            {
                meta,
                level: LOG_LEVEL.error,
            },
        );
    } catch (logError) {
        // eslint-disable-next-line no-console
        console.error("Failed to log exception:", logError);
    }
}

export function log(line: string, meta?: object) {
    try {
        logger.log(line, { meta, level: LOG_LEVEL.info });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to log:", error);
    }
}

export function error(line: string, meta?: object) {
    try {
        logger.log(line, { meta, level: LOG_LEVEL.error });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to log error:", error);
    }
}
