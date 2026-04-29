import { type NextFunction, type Request, type Response } from "express";

import { logRequest, logResponse } from "../service/logger";

export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
    logRequest(req.method, req.originalUrl, { body: req.body, ...req.meta });
    res.on("finish", () => {
        logResponse(req.method, req.originalUrl, { body: req.body, ...req.meta }, res.statusCode);
    });
    next();

}
