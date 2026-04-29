import { type NextFunction, type Request, type Response } from "express";
import { StatusCodes as httpStatus } from "http-status-codes";

import { AppEnvType, config } from "../../config/backend";
import { ClientError } from "../router/clientError";
import { logRequestError } from "../service/logger";

export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
    logRequestError(req.method, req.originalUrl, { body: req.body, ...req.meta }, err);

    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof ClientError) {
        res.status(err.statusCode).json(err.payload);
        return;
    }

    const responseBody = config.APP_ENV === AppEnvType.Local
        ? `<pre>Error: ${err.message}.\n\n${err.stack ?? ""}</pre>`
        : "Something went wrong, please try again later.";

    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(responseBody);
}
