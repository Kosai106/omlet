import * as fs from "fs/promises";
import winston from "winston";

import { AuthenticationError } from "./auth";
import { LOG_FILE_PATH } from "./config";
import { CliError } from "./error";

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `[${level.toUpperCase()} ${timestamp}][JS] ${message}`;
});

export const logger = winston.createLogger({
    level: "error",
    format: winston.format.combine(
        winston.format.timestamp({
            format: "MM-DD HH:mm:ss.SSS",
        }),
        logFormat,
    ),
    transports: [
        new winston.transports.File({ filename: LOG_FILE_PATH }),
    ],
});

export enum LogLevel {
    Error = "error",
    Warn = "warn",
    Info = "info",
    Debug = "debug",
    Trace = "trace",
}

export function setLogLevel(level: LogLevel) {
    logger.level = level;
}

export function getLogFilePath() {
    return LOG_FILE_PATH;
}

export function logError<T extends Error>(error: T) {
    logger.error(`Error: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);

    if (error instanceof CliError) {
        logger.error(`Context: ${error.getContextString()}`);
    } else if (error instanceof AuthenticationError) {
        logger.error(`Reason: ${error.reason}`);
    }
}

export function endLogger(): Promise<void> {
    return new Promise((resolve) => {
        logger.on("finish", function () {
            fs.stat(LOG_FILE_PATH).then((stats) => {
                if (stats.size === 0) {
                    return fs.unlink(LOG_FILE_PATH);
                }
            }).catch(() => {
                // ignore
            }).finally(() => {
                resolve();
            });
        });
        logger.end();
    });
}
