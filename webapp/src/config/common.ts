export function readBooleanVar(value: string | boolean | undefined, defaultValue: boolean): boolean {
    if (typeof value === "undefined") {
        return defaultValue;
    } else if (typeof value === "boolean") {
        return value;
    }

    return value === "true";
}

export function readIntegerVar(value: string | undefined, defaultValue: number): number {
    const result = Number.parseInt(value ?? "", 10);
    return Number.isNaN(result) ? defaultValue : result;
}

export function readRequiredVar(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export enum AppEnvType {
    Staging = "staging",
    Production = "production",
    Local = "local",
}

export function readAppEnv(value = ""): AppEnvType {
    if (value === "staging") {
        return AppEnvType.Staging;
    } else if (value === "production") {
        return AppEnvType.Production;
    } else if (value === "local") {
        return AppEnvType.Local;
    }

    return AppEnvType.Local;
}
