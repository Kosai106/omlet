import * as clr from "colorette";
import { StatusCodes as httpStatus } from "http-status-codes";
import createProxyAgent from "https-proxy-agent";
import fetch, { type RequestInit, type Response, FetchError, Headers } from "node-fetch";
import os from "os";
import { performance } from "perf_hooks";
import { v4 as uuidv4 } from "uuid";
import { createGzip } from "zlib";

import { version } from "../package.json";

import { type AnalyzeResult } from "./analyzer";
import { getToken } from "./auth";
import { BASE_URL, HTTP_PROXY_URL } from "./config";
import { CliError } from "./error";
import { toJsonStringStream } from "./jsonStream";
import { getLogFilePath, logError, logger } from "./logger";

type APIResponse<TData, TMeta = never> = {
    data: TData;
    meta: TMeta;
};

function generateUserAgent() {
    return `OmletCLI/${version} (${os.type()}; ${os.arch()}; ${os.release()})`;
}

function parseAPIError(responseBody?: string): ErrorResponse | undefined {
    if (!responseBody) {
        return;
    }

    try {
        return JSON.parse(responseBody) as ErrorResponse;
    } catch {
        logger.error("Error response couldn't be parsed");
        logger.error("Response:", responseBody);

        return;
    }
}

export enum ErrorResponseCode {
    UNAUTHORIZED = "unauthorized",
    BAD_REQUEST = "bad-request",
    REQUEST_TOO_LONG = "request-too-long",
    CLI_NOT_SUPPORTED = "cli-not-supported",
    WORKSPACE_NOT_FOUND = "workspace-not-found",
    WORKSPACE_SLUG_NOT_AVAILABLE = "workspace-slug-not-available",
    WORKSPACE_ALREADY_SETUP = "workspace-already-setup",
    USER_NOT_HAVE_WORKSPACE = "user-not-have-workspace",
    USER_ALREADY_HAS_WORKSPACE = "user-already-has-workspace",
    USER_ALREADY_MEMBER = "user-already-member",
    TAG_NOT_FOUND = "tag-not-found",
    SAVED_CHART_NOT_FOUND = "saved-chart-not-found",
    LOCKED = "locked",
    UNSUPPORTED_MEDIA_TYPE = "unsupported-media-type",
}

export interface ErrorResponse {
    code?: ErrorResponseCode;
    title: string;
    detail: string;
    meta?: unknown;
}

interface ApiErrorContext extends Record<string, unknown> {
    url: string;
    method: string;
    requestHeaders: Record<string, string>;
    cli_version: string;
    node_version: string;
    device_info: {
        os: string;
        arch: string;
        version: string;
    };
    duration: number;
    responseStatus?: number;
    responseHeaders?: Record<string, string>;
    responseBody?: string;
}

export class ApiError<T extends ApiErrorContext = ApiErrorContext> extends CliError<T> {
    readonly context: T;
    protected _errorInfo: ErrorResponse;

    constructor(message: string, { context }: { context: T; }) {
        // Clone the headers to prevent mutation
        context.requestHeaders = { ...context.requestHeaders };

        super(message, { context });

        if (context.requestHeaders.cookie) {
            context.requestHeaders.cookie = "[REDACTED]";
        }
        this.context = context;
        this.name = this.constructor.name;
        this._errorInfo = parseAPIError(context.responseBody) ?? {
            title: "Analysis failed with an unexpected error",
            detail: `Details: ${message}\nTry again and if the issue continues, you can find the error logs here:\n${getLogFilePath()}`,
        };
    }

    get errorInfo() {
        return this._errorInfo;
    }
}

export class LoginRequiredError extends ApiError {
    constructor({ context }: { context: ApiErrorContext; }) {
        super("Login required", { context });
        this.name = this.constructor.name;

        this._errorInfo = parseAPIError(context.responseBody) ?? {
            code: ErrorResponseCode.UNAUTHORIZED,
            title: "Authentication failed!",
            detail:
                "Please make sure you have a working Omlet token set as the OMLET_TOKEN variable.\n" +
                "Run `omlet login --print-token` to obtain a token.",
        };
    }
}

export class RequestFailedError extends ApiError {
    readonly statusCode: number;

    constructor(statusCode: number, { context }: { context: ApiErrorContext; }) {
        super("API request failed", { context });
        this.name = this.constructor.name;
        this.statusCode = statusCode;

        this._errorInfo = parseAPIError(context?.responseBody) ?? {
            title: "Analysis failed with an unexpected error",
            detail: `Details: API request failed\nTry again and if the issue continues, you can find the error logs here:\n${getLogFilePath()}`,
        };

    }
}

export class UnknownRequestError extends ApiError {
    constructor(reason: Error, { context }: { context: ApiErrorContext; }) {
        super(`HTTP request error: ${reason.message}`, { context });
        this.name = this.constructor.name;
    }
}

export class RequestTimeoutError extends ApiError {
    constructor(message: string, { context }: { context: ApiErrorContext; }) {
        super(message, { context });
        this.name = this.constructor.name;
    }
}

const CLI_STATUS_HEADER = "omlet-cli-status";

enum CLIStatus {
    Deprecated = "deprecated",
    Obsolete = "obsolete",
}

enum CLIStatusMetaKey {
    MinVersion = "min-version",
}

async function checkCLIStatus(response: Response) {
    const cliStatus = response.headers.get(CLI_STATUS_HEADER);

    if (cliStatus === null) {
        return;
    }

    // Omlet-CLI-Status: deprecated
    // Omlet-CLI-Status: deprecated; min-version=v2.0.0
    // Omlet-CLI-Status: obsolete
    const { status, meta } = cliStatus.match(/^(?<status>deprecated|obsolete)(\s*;\s*(?<meta>.*))?$/)?.groups ?? {};
    let metaObj: Partial<Record<CLIStatusMetaKey, string>> = {};
    if (meta) {
        try {
            metaObj = Object.fromEntries(meta.split(/\s*;\s*/).map(kv => kv.split("=")).map(([k, v]) => [k.toLowerCase(), v]));
        } catch {
            // Error parsing header
        }
    }

    if (status === CLIStatus.Deprecated) {
        console.log("");
        console.error(clr.yellow(clr.bold("This CLI version is deprecated")));
        console.error(clr.yellow(`The support for version ${version} will be dropped in near future`));

        const minVersion = metaObj[CLIStatusMetaKey.MinVersion];
        console.error(clr.yellow(`For an uninterrupted workflow please update Omlet CLI${minVersion ? ` to at least ${minVersion}` : "."}`));
        return;
    }
}

const REQUEST_TIMEOUT_MSEC = 150000;
const REQUEST_ID_HEADER = "omlet-request-id";
async function apiRequest<D = unknown>(pathname: string, options: RequestInit = {}): Promise<{ data: D; response: Response; }> {
    try {
        const token = await getToken();

        const url = new URL(pathname, BASE_URL).toString();
        const requestId = uuidv4();
        const headers = new Headers(options.headers);
        headers.set("User-Agent", generateUserAgent());
        headers.set("Content-Type", "application/json");
        headers.set("Cookie", `omlet-auth-token=${token}`);
        headers.set(REQUEST_ID_HEADER, requestId);

        let response;
        const requestTime = performance.now();
        const context: ApiErrorContext = {
            url,
            method: options.method ?? "GET",
            requestHeaders: Object.fromEntries(headers),
            cli_version: version,
            node_version: process.version,
            device_info: {
                os: os.type(),
                arch: os.arch(),
                version: os.release(),
            },
            duration: 0,
        };

        if (!token) {
            throw new LoginRequiredError({ context });
        }

        try {
            const proxyAgent = HTTP_PROXY_URL ? createProxyAgent(HTTP_PROXY_URL) : null;

            logger.debug(`API request: ${context.method} ${context.url}`);

            response = await fetch(url, {
                timeout: REQUEST_TIMEOUT_MSEC,
                ...options,
                headers,
                ...(proxyAgent ? { agent: proxyAgent } : {}),
            });
        } catch (e) {
            const responseTime = performance.now();
            context.duration = responseTime - requestTime;

            if (e instanceof FetchError && e.type === "request-timeout") {
                throw new RequestTimeoutError(`"Request timed out": ${e.message}`, { context });
            }

            throw new UnknownRequestError(e as Error, { context });
        }

        const responseTime = performance.now();
        context.duration = responseTime - requestTime;
        context.responseHeaders = Object.fromEntries(response.headers);
        context.responseStatus = response.status;

        await checkCLIStatus(response);

        if (response.status === httpStatus.UNAUTHORIZED) {
            context.responseBody = await response.text();
            throw new LoginRequiredError({ context });
        } else if (response.status === httpStatus.REQUEST_TIMEOUT || response.status === httpStatus.GATEWAY_TIMEOUT) {
            context.responseBody = await response.text();
            throw new RequestTimeoutError("Request timed out", { context });
        }

        if (!response.ok) {
            context.responseBody = await response.text();
            throw new RequestFailedError(response.status, { context });
        }

        logger.debug(`API request successful: ${context.method} ${context.url}`);
        logger.debug(`${response.status} ${response.statusText} Headers: ${JSON.stringify(response.headers)}`);

        return { data: await response.json() as D, response };
    } catch (e) {
        if (e instanceof Error) {
            logError(e);
        }
        throw e;
    }
}

export interface User {
    id: string;
    email: string;
    fullName?: string;
    lastSeen?: Date;
}

export async function getMe(): Promise<User> {
    const { data } = await apiRequest<User>("/api/users/me");

    return data;
}

export interface Workspace {
    id: string;
    name: string;
    slug: string;
    projects: {
        slug: string;
        packageName: string;
        name: string;
    }[];
}

export async function getDefaultWorkspace(): Promise<Workspace> {
    const { data } = await apiRequest<Workspace>("/api/workspaces/default");

    return data;
}

export async function getWorkspace(slug: string): Promise<Workspace> {
    const { data: { workspace } } = await apiRequest<{ workspace: Workspace; }>(`/api/workspaces/${slug}`);

    return workspace;
}

export interface Analysis {
    id: string;
    createdAt: Date;
    numOfComponents: number;
}

type PostAnalysisResponse = APIResponse<Analysis, { dataIssueCount: number; }>;

export async function postAnalysis(workspace: Workspace, analysisData: AnalyzeResult): Promise<PostAnalysisResponse> {
    const { data } = await apiRequest<PostAnalysisResponse>(`/api/workspaces/${workspace.slug}/analyses`, {
        method: "POST",
        body: toJsonStringStream(analysisData).pipe(createGzip()),
        headers: {
            "content-encoding": "gzip",
        },
    });

    return data;
}

export async function initWorkspace(workspace: Workspace, analyses: AnalyzeResult[]) {
    const { data } = await apiRequest<Workspace>(`/api/workspaces/${workspace.slug}/init`, {
        method: "POST",
        body: toJsonStringStream({ analyses }).pipe(createGzip()),
        headers: {
            "content-encoding": "gzip",
        },
    });

    return data;
}
