import express, { type NextFunction, type Request, type Response } from "express";
import { type IncomingMessage } from "http";
import { StatusCodes as httpStatus } from "http-status-codes/build/cjs/status-codes";

import { ErrorResponseCode, ClientError } from "../router/clientError";
import { logException } from "../service/logger";

type ErrorType =
    | "entity.parse.failed"
    | "request.aborted"
    | "request.size.invalid"
    | "entity.verify.failed"
    | "entity.too.large"
    | "parameters.too.many"
    | "encoding.unsupported"
    | "charset.unsupported"
    | "stream.encoding.set"
    | "stream.not.readable";
interface ExpressError extends Error {
    type?: ErrorType;
}

export function jsonParser() {
    const wrappedMiddleware = express.json({
        limit: "500mb",
        verify: (req: IncomingMessage & { rawBody: Buffer; }, res, buf) => {
            req.rawBody = buf;
        },
    });
    return (req: Request, res: Response, next: NextFunction) => {
        wrappedMiddleware(req, res, (err: ExpressError) => {
            if (err) {
                logException(err);
                switch (err.type) {
                    case "entity.parse.failed":
                    case "request.aborted":
                    case "request.size.invalid":
                        throw new ClientError(httpStatus.BAD_REQUEST, ErrorResponseCode.BAD_REQUEST, { reason: err });
                    case "entity.verify.failed":
                        throw new ClientError(httpStatus.FORBIDDEN, ErrorResponseCode.FORBIDDEN, { reason: err });
                    case "entity.too.large":
                    case "parameters.too.many":
                        throw new ClientError(httpStatus.REQUEST_TOO_LONG, ErrorResponseCode.REQUEST_TOO_LONG, { reason: err });
                    case "encoding.unsupported":
                    case "charset.unsupported":
                        throw new ClientError(httpStatus.UNSUPPORTED_MEDIA_TYPE, ErrorResponseCode.UNSUPPORTED_MEDIA_TYPE, { reason: err });
                    default:
                        throw new ClientError(httpStatus.BAD_REQUEST, ErrorResponseCode.BAD_REQUEST, { reason: err });
                }
            } else {
                next();
            }
        });
    };
}
