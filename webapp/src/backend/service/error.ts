import { type ErrorExtraInfo, BaseError } from "../error";

export class ServiceError extends BaseError {
    constructor(
        message: string,
        {
            shouldCapture = true,
            ...extra
        }: ErrorExtraInfo & { shouldCapture?: boolean; } = {}
    ) {
        super(message, shouldCapture, extra);
    }

    static fromError(err: Error, details?: ErrorExtraInfo["details"]): ServiceError {
        return new ServiceError(err.message, {
            reason: err,
            details,
        });
    }
}

export type { ErrorExtraInfo };
