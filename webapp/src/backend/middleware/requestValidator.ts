import { type Request, type RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { type Schema, type ValidationError, type ValidationOptions } from "joi";

import { ErrorResponseCode, ClientError } from "../router/clientError";

const VALIDATION_OPTIONS: ValidationOptions = {
    convert: true,
    presence: "required",
};

const validateRule = (rule: ValidationRule, payload: object, options: ValidationOptions = {}): void => {
    const { error } = rule.schema.validate(payload, {
        ...VALIDATION_OPTIONS,
        ...options,
    });

    if (error) {
        throw error;
    }
};

const validateRequest = (req: Request, rules: ValidationRuleSet): void => {
    if (rules.headers) {
        const headersInLowercase: {
            [index: string]: string | undefined;
        } = {};

        // Header rules are defined with lowercase letters
        for (const key of Object.keys(req.headers)) {
            headersInLowercase[key.toLowerCase()] = req.header(key);
        }

        validateRule(rules.headers, headersInLowercase);
    }

    if (rules.params) {
        validateRule(rules.params, req.params);
    }

    if (rules.query) {
        validateRule(rules.query, req.query);
    }

    if (rules.body) {
        validateRule(rules.body, req.body as Record<string, unknown>);
    }
};

interface ValidationRule {
    schema: Schema;
    errors?: {
        readonly [index: string]: Error;
    };
}

interface ValidationRuleSet {
    headers?: ValidationRule;
    params?: ValidationRule;
    query?: ValidationRule;
    body?: ValidationRule;
}

const MAX_SIZE = 1024;

function validationErrorToErrorDetails(error?: ValidationError): Record<string, unknown> {
    if (!error) {
        return {};
    }

    try {
        if (JSON.stringify(error._original).length > MAX_SIZE) {
            return {
                items: error.details,
            };
        }
        return {
            items: error.details,
            input: error._original as unknown,
        };
    } catch {
        return {
            items: error.details,
        };
    }
}

export class RequestValidationError extends ClientError {
    constructor({ reason, meta = {} }: { reason?: ValidationError; meta?: Record<string, unknown>; }) {
        super(StatusCodes.BAD_REQUEST, ErrorResponseCode.BAD_REQUEST, {
            reason,
            details: {
                ...validationErrorToErrorDetails(reason),
                ...meta,
            },
        });
    }
}

export function requestValidator(rules: ValidationRuleSet): RequestHandler {
    return (req, res, next) => {
        try {
            validateRequest(req, rules);
            next();
        } catch (error) {
            next(new RequestValidationError({ reason: error as ValidationError }));
        }
    };
}
