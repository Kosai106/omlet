import { type StatusCodes } from "http-status-codes/build/cjs/status-codes";

import { type ErrorDetails, type ErrorExtraInfo, BaseError } from "../error";

export enum ErrorResponseCode {
    UNAUTHORIZED = "unauthorized",
    FORBIDDEN = "forbidden",
    BAD_REQUEST = "bad-request",
    REQUEST_TOO_LONG = "request-too-long",
    CLI_NOT_SUPPORTED = "cli-not-supported",
    USER_NOT_FOUND = "user-not-found",
    WORKSPACE_NOT_FOUND = "workspace-not-found",
    PROJECT_NOT_FOUND = "project-not-found",
    PROJECT_NOT_INTERNAL = "project-not-internal",
    PROJECT_ALIAS_ALREADY_EXISTS = "project-alias-already-exists",
    COMPONENT_NOT_FOUND = "component-not-found",
    WORKSPACE_SLUG_NOT_AVAILABLE = "workspace-slug-not-available",
    WORKSPACE_ALREADY_SETUP = "workspace-already-setup",
    SHARED_PAGE_NOT_FOUND = "shared-page-not-found",
    JOIN_REQUEST_ALREADY_EXISTS = "join-request-already-exists",
    USER_NOT_HAVE_WORKSPACE = "user-not-have-workspace",
    USER_ALREADY_HAS_WORKSPACE = "user-already-has-workspace",
    USER_ALREADY_MEMBER = "user-already-member",
    USER_ALREADY_INVITED = "user-already-invited",
    TAG_NOT_FOUND = "tag-not-found",
    CORE_TAG_CANNOT_BE_DELETED = "core_tag_cannot_be_deleted",
    CUSTOM_PROPERTY_REQUIRED_FOR_ANALYSIS = "custom-property-required-for-analysis",
    SAVED_CHART_NOT_FOUND = "saved-chart-not-found",
    LOCKED = "locked",
    UNSUPPORTED_MEDIA_TYPE = "unsupported-media-type",
}

export interface ErrorResponse {
    code: ErrorResponseCode;
    title: string;
    detail: string;
    meta: unknown;
}

const map: Record<ErrorResponseCode, (d: ErrorDetails) => Pick<ErrorResponse, "title" | "detail">> = {
    [ErrorResponseCode.UNAUTHORIZED]: () => ({
        title: "Authorization failed",
        detail: "Please login first.",
    }),
    [ErrorResponseCode.FORBIDDEN]: () => ({
        title: "Action is not allowed",
        detail: "You don't have permission to fulfill this action.",
    }),
    [ErrorResponseCode.BAD_REQUEST]: () => ({
        title: "Request validation failed",
        detail: "Please check the request parameters.",
    }),
    [ErrorResponseCode.REQUEST_TOO_LONG]: () => ({
        title: "Request size is too big",
        detail: "Please check the request parameters.",
    }),
    [ErrorResponseCode.CLI_NOT_SUPPORTED]: () => ({
        title: "This CLI version is not supported",
        detail: "To be able to submit new scans you need to update Omlet CLI.",
    }),
    [ErrorResponseCode.USER_NOT_FOUND]: () => ({
        title: "User not found",
        detail: "Please try logging in again.",
    }),
    [ErrorResponseCode.WORKSPACE_NOT_FOUND]: () => ({
        title: "Workspace not found",
        detail: "Make sure that workspace slug is correct.",
    }),
    [ErrorResponseCode.WORKSPACE_SLUG_NOT_AVAILABLE]: () => ({
        title: "Workspace slug is not available",
        detail: "Please try another slug.",
    }),
    [ErrorResponseCode.WORKSPACE_ALREADY_SETUP]: () => ({
        title: "Setup has already been completed for this workspace",
        detail: "Visit https://github.com/zeplin/omlet/blob/main/docs/cli/commands/init.md for more details on how to reset your workspace and set it up again.",
    }),
    [ErrorResponseCode.SHARED_PAGE_NOT_FOUND]: () => ({
        title: "Shared page not found",
        detail: "Specified page is not publicly shared.",
    }),
    [ErrorResponseCode.JOIN_REQUEST_ALREADY_EXISTS]: () => ({
        title: "Workspace join request already exists",
        detail: "Your workspace join request is currently in review. We’ll let you know once it’s accepted.",
    }),
    [ErrorResponseCode.USER_NOT_HAVE_WORKSPACE]: () => ({
        title: "User does not have any workspace",
        detail: "Please create a workspace first.",
    }),
    [ErrorResponseCode.USER_ALREADY_HAS_WORKSPACE]: () => ({
        title: "User already belongs to a workspace",
        detail: "Please visit the workspace you're a member of.",
    }),
    [ErrorResponseCode.USER_ALREADY_MEMBER]: () => ({
        title: "User already member",
        detail: "User is currently member.",
    }),
    [ErrorResponseCode.USER_ALREADY_INVITED]: () => ({
        title: "User already invited",
        detail: "User is already invited to the workspace.",
    }),
    [ErrorResponseCode.TAG_NOT_FOUND]: () => ({
        title: "Tag not found",
        detail: "Tag is not found in specified workspace.",
    }),
    [ErrorResponseCode.CORE_TAG_CANNOT_BE_DELETED]: () => ({
        title: "Core tag cannot be deleted",
        detail: "The existence of Core tag is required for Omlet to work properly.",
    }),
    [ErrorResponseCode.CUSTOM_PROPERTY_REQUIRED_FOR_ANALYSIS]: () => ({
        title: "Custom property required",
        detail: "Custom property value is required for given analysis subject.",
    }),
    [ErrorResponseCode.SAVED_CHART_NOT_FOUND]: () => ({
        title: "Saved chart not found",
        detail: "Saved chart is not found in specified workspace.",
    }),
    [ErrorResponseCode.LOCKED]: () => ({
        title: "Analysis in progress",
        detail: "Omlet can only process one analysis at a time. Please wait for current analysis to be completed and try again later.",
    }),
    [ErrorResponseCode.UNSUPPORTED_MEDIA_TYPE]: () => ({
        title: "Unsupported media type",
        detail: "The media type of the request is not supported. Please check your 'Content-Type' or 'Content-Encoding' header.",
    }),
    [ErrorResponseCode.COMPONENT_NOT_FOUND]: () => ({
        title: "Component not found",
        detail: "It is probably deleted.",
    }),
    [ErrorResponseCode.PROJECT_NOT_FOUND]: () => ({
        title: "Project not found",
        detail: "Looks like this project does not exist or is deleted.",
    }),
    [ErrorResponseCode.PROJECT_NOT_INTERNAL]: () => ({
        title: "Project not internal",
        detail: "Only internal projects are eligible for a name change.",
    }),
    [ErrorResponseCode.PROJECT_ALIAS_ALREADY_EXISTS]: () => ({
        title: "Project alias already exists",
        detail: "This alias is already in use. Please choose a different one.",
    }),
};

export class ClientError extends BaseError {
    readonly statusCode: StatusCodes;
    readonly code: ErrorResponseCode;
    constructor(
        statusCode: StatusCodes,
        code: ErrorResponseCode,
        { details, reason }: ErrorExtraInfo = {}
    ) {
        super(code, false, { details: { statusCode, ...details }, reason });
        this.code = code;
        this.statusCode = statusCode;
    }
    get payload() {
        return {
            ...(map[this.code](this.details ?? {})),
            code: this.code,
            meta: this.details,
        };
    }
}
