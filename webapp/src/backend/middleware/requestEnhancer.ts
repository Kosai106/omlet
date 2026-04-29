import { randomUUID } from "crypto";
import { type NextFunction, type Request, type Response } from "express";

import { config } from "../../config/backend";
import { decodeAuthData } from "../service/auth/auth";

const REQUEST_ID_HEADER = "omlet-request-id";
export function requestEnhancer(req: Request, res: Response, next: NextFunction) {
    const requestId = req.get(REQUEST_ID_HEADER) ?? randomUUID();
    res.set(REQUEST_ID_HEADER, requestId);

    let authToken;
    let authData;
    let publicAuthToken;
    if (req.cookies) {
        const cookies = req.cookies as Record<string, string>;
        authToken = cookies[config.AUTH_COOKIE_NAME] as string | undefined;
        authData = authToken ? decodeAuthData(authToken) : undefined;

        publicAuthToken = cookies[config.PUBLIC_AUTH_TOKEN_COOKIE_NAME] as string | undefined;
    }

    req.authToken = authToken;
    req.publicAuthToken = publicAuthToken;
    req.meta = {
        requestId,
        ip: req.ip,
        userId: authData?.userId,
        sessionId: authData?.sessionId,
        fresh: req.fresh,
        hostname: req.hostname,
        method: req.method,
        originalUrl: req.originalUrl,
        path: req.path,
        protocol: req.protocol,
        userAgent: req.get("user-agent"),
    };

    next();
}
