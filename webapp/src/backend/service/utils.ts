import { customAlphabet } from "nanoid";

// alphabet without _ and -
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
export function generateNanoId(size = 21): string {
    return nanoid(size);
}

export function escapeRegex(value: string): string {
    return value.replace(/[|\\\-{}()[\]^$+*?.]/g, "\\$&");
}

export function unescapeRegex(value: string): string {
    return value.replace(/\\([|\\\-{}()[\]^$+*?.])/g, "$1");
}

export function stringToNumber(value: string): number | undefined {
    const result = Number(value);
    return Number.isNaN(result) ? undefined : result;
}

export function stringToBoolean(value: string): boolean {
    return value === "true";
}
