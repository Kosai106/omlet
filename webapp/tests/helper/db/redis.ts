import { closeCache, initCache } from "../../../src/backend/service/cache/cache";

jest.mock("../../../src/backend/service/cache/constants", () => ({
    LOCK_TTL: 1000,
    EXTEND_THRESHOLD: 500,
    RETRY_COUNT: 5,
    RETRY_DELAY: 100,
}));

export async function init(): Promise<void> {
    await initCache();
}

export async function close(): Promise<void> {
    await closeCache();
}
