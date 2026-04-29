interface ErrorInfo {
    name: string;
    message: string;
    stack?: string;
    reason?: ErrorInfo;
    details?: ErrorDetails;
}

export type ErrorDetails = Record<string, unknown>;

export interface ErrorExtraInfo {
    details?: ErrorDetails;
    reason?: Error;
}

export class BaseError extends Error {
    readonly shouldCapture: boolean;
    readonly details?: ErrorDetails;
    readonly reason?: Error;
    readonly name: string;
    readonly message: string;

    constructor(
        message: string,
        shouldCapture: boolean,
        extra: ErrorExtraInfo = {}
    ) {
        super(message);
        this.message = message;
        this.name = this.constructor.name;

        this.shouldCapture = shouldCapture;
        this.details = extra.details;
        this.reason = extra.reason;
    }

    getReasonInfo(): ErrorInfo | undefined {
        const { reason } = this;
        if (!reason) {
            return;
        }

        return reason instanceof BaseError ? reason.getInfo() : {
            stack: reason.stack ?? "No stack trace found",
            name: reason.name,
            message: reason.message,
        };
    }

    getInfo(): ErrorInfo {
        return {
            message: this.message,
            name: this.name,
            stack: this.stack,
            reason: this.getReasonInfo(),
            details: this.details,
        };
    }
}
