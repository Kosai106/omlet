import upath from "upath";

function getProxyConfig() {
    const varNames = [
        "npm_config_https_proxy",
        "npm_config_http_proxy",
        "npm_config_proxy",
        "http_proxy",
        "https_proxy",
        "http-proxy",
        "https-proxy",
        "proxy",
        "HTTP_PROXY",
        "HTTPS_PROXY",
        "HTTP-PROXY",
        "HTTPS-PROXY",
        "PROXY",
    ];

    for (const name of varNames) {
        if (process.env[name]) {
            return process.env[name];
        }
    }
}

function readNumberEnvVar(name: string) {
    const value = process.env[name];
    if (!value) {
        return;
    }

    try {
        return Number.parseInt(value, 10);
    } catch {
        // Skip
    }
}

function resolveBaseUrl() {
    const configuredBaseUrl = process.env.OMLET_BASE_URL ?? process.env.APP_BASE_URL;
    if (configuredBaseUrl) {
        return configuredBaseUrl;
    }

    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
        return "http://localhost:3001";
    }

    throw new Error(
        "Missing base URL configuration. Set OMLET_BASE_URL or APP_BASE_URL. " +
            "The localhost default is only available in development/test."
    );
}

export const BASE_URL = resolveBaseUrl();
export const ENV_TOKEN = process.env.OMLET_TOKEN ?? "";

export const HTTP_PROXY_URL = getProxyConfig();
export const GIT_HISTORY_LIMIT_DAYS = readNumberEnvVar("GIT_LIMIT") ?? 365;
export const LOG_FILE_PATH = upath.join(process.cwd(), "omlet-cli.log");
export const LOGIN_SERVER_PORT = "8989";
export const OMLET_VALIDATE = process.env.OMLET_VALIDATE === "true";
export const WORKSPACE_SLUG = process.env.OMLET_WORKSPACE_SLUG;
