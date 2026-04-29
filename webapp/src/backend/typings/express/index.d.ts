/* eslint-disable */
declare namespace Express {
    export interface Request {
        meta: {
            [key: string]: unknown;
            requestId: string;
            ip?: string;
            userId?: string;
            sessionId?: string;
            fresh: boolean;
            hostname: string;
            method: string;
            originalUrl: string;
            path: string;
            protocol: string;
            userAgent?: string;
            body?: unknown
        };
        authToken?: string;
        publicAuthToken?: string;
        auth?: import("../../service/auth/auth").AuthData;
        publicAuth?: import("../../service/auth/auth").PublicAuthData;
        cookies?: Record<string, string>;
        rawBody: Buffer;
    }
}
