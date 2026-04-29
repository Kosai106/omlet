import { type NextFunction, type Request, type RequestHandler, type Response } from "express";
import { expressjwt, UnauthorizedError } from "express-jwt";
import { StatusCodes } from "http-status-codes";

import { config } from "../../config/backend";
import { ErrorResponseCode, ClientError } from "../router/clientError";


export function authMiddleware({ credentialsRequired = true } = {}): RequestHandler {
    return (req, res, next) => {
        expressjwt({
            secret: config.JWT_PUBLIC_KEY,
            algorithms: ["RS256"],
            requestProperty: "auth",
            credentialsRequired,
            getToken: function (req) {
                return req.authToken;
            },
        })(req, res, err => {
            if (!err) {
                next();
                return;
            }

            if (err instanceof UnauthorizedError) {
                next(new ClientError(StatusCodes.UNAUTHORIZED, ErrorResponseCode.UNAUTHORIZED));
                return;
            }
            next(err);
        });
    };
}

export function publicAuthMiddleware(): RequestHandler {
    return (req, res, next) => {
        expressjwt({
            secret: config.JWT_PUBLIC_KEY,
            algorithms: ["RS256"],
            requestProperty: "publicAuth",
            credentialsRequired: false,
            getToken(req) {
                return req.publicAuthToken;
            },
        })(req, res, err => {
            if (err) {
                if (err instanceof UnauthorizedError) {
                    next(new ClientError(StatusCodes.UNAUTHORIZED, ErrorResponseCode.UNAUTHORIZED));
                    return;
                }

                next(err);
                return;
            }

            if (req.auth || !req.publicAuth) {
                next();
                return;
            }

            const referrer = req.get("Referrer");
            if (!referrer) {
                next(new ClientError(StatusCodes.UNAUTHORIZED, ErrorResponseCode.UNAUTHORIZED));
                return;
            }

            const referrerURL = new URL(referrer);
            referrerURL.searchParams.delete("token");

            if (req.publicAuth.url !== referrerURL.toString()) {
                next(new ClientError(StatusCodes.UNAUTHORIZED, ErrorResponseCode.UNAUTHORIZED));
                return;
            }

            next();
        });
    };
}

export function adminAuthMiddleware() {
    return async (req: Request, _: Response, next: NextFunction) => {
        if (!req.auth?.isAdmin) {
            throw new ClientError(StatusCodes.UNAUTHORIZED, ErrorResponseCode.UNAUTHORIZED);
        }
        next();
    };
}
