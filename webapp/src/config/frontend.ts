import { AppEnvType, readAppEnv, readBooleanVar } from "./common";

declare const __APP_VERSION__: string;

const env = import.meta.env;

const APP_BASE_URL = env.VITE_APP_BASE_URL as string;
const LANDING_PAGE_BASE_URL = env.VITE_LANDING_PAGE_BASE_URL as string;
const APP_ENV = env.MODE === "development" ? AppEnvType.Local : readAppEnv(env.MODE);

interface FrontendConfig {
    APP_BASE_URL: string;
    LANDING_PAGE_BASE_URL: string;
    APP_VERSION: string;
    APP_ENV: AppEnvType;
    DEMO_WORKSPACE_SLUG: string;
    EMAILS_ENABLED: boolean;
}

export const config: FrontendConfig = {
    APP_BASE_URL,
    LANDING_PAGE_BASE_URL,
    APP_VERSION: __APP_VERSION__,
    APP_ENV,
    DEMO_WORKSPACE_SLUG: "proton",
    EMAILS_ENABLED: readBooleanVar(env.VITE_EMAILS_ENABLED as string, false),
};
