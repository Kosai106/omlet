import Redis from "ioredis";
import Redlock from "redlock";

import { config } from "../../../config/backend";
import { ServiceError } from "../error";
import { log, logException } from "../logger";

import { EXTEND_THRESHOLD, LOCK_TTL, RETRY_COUNT, RETRY_DELAY } from "./constants";

const redis = new Redis(config.REDIS_URI, { lazyConnect: true });
const redlock = new Redlock(
    [redis as unknown as Redlock.CompatibleRedisClient],
    {
        retryCount: RETRY_COUNT,
        retryDelay: RETRY_DELAY,
    }
);

export class LockError extends ServiceError {
    constructor(key: string, reason: Error) {
        super("Acquiring lock failed", {
            details: {
                key,
            },
            reason,
        });
    }
}

export async function initCache() {
    await redis.connect();
}


export async function closeCache() {
    await redis.disconnect();
}

async function acquireLock(key: string) {
    try {
        return await redlock.lock(key, LOCK_TTL);
    } catch (error) {
        if (error instanceof Redlock.LockError) {
            throw new LockError(key, error);
        }
        throw error;
    }
}

async function withLock<T>(key: string, callback: () => Promise<T>): Promise<T> {
    log(`REDIS-LOCK - acquiring lock: ${key}`, { key });
    const lock = await acquireLock(key);
    log(`REDIS-LOCK - acquired lock: ${key}`, { key });
    let timeout;
    function queue() {
        // If it's already unlocked, do nothing
        if (lock.expiration === 0) {
            return;
        }

        timeout = setTimeout(
            extend,
            lock.expiration - Date.now() - EXTEND_THRESHOLD
        );
    }

    async function extend() {
        // If it's already unlocked, do nothing
        if (lock.expiration === 0) {
            return;
        }

        try {
            log(`REDIS-LOCK - extending: ${key}`, { key });
            await lock.extend(LOCK_TTL);
            log(`REDIS-LOCK - extended: ${key}`, { key });
            queue();
        } catch (error) {
            if (lock.expiration > 0) {
                log(`REDIS-LOCK - failed to extend: ${key}`, { key });
                logException(error);
            }
        }
    }
    queue();
    try {
        return await callback();
    } finally {
        try {
            await redlock.unlock(lock);
            log(`REDIS-LOCK - unlocked: ${key}`, { key });
        } catch (error) {
            log(`REDIS-LOCK - failed to unlock: ${key}`, { key });
            logException(error);
        }
        clearTimeout(timeout);
    }
}

export function withAnalysisWriteLock<T>(workspaceId: string, callback: () => Promise<T>): Promise<T> {
    return withLock(`write:workspaces:${workspaceId}:analyses`, callback);
}

export function withWorkspaceSlugWriteLock<T>(slug: string, callback: () => Promise<T>): Promise<T> {
    return withLock(`write:workspaces:slugs:${slug}`, callback);
}

export async function getCachedValue<T>(key: string): Promise<T | null> {
    try {
        const value = await redis.get(key);
        return value === null ? value : (JSON.parse(value) as T);
    } catch (error) {
        logException(error);
        return null;
    }
}
export async function extendTTL(key: string, ttl: number): Promise<boolean> {
    try {
        const value = await redis.expire(key, ttl, "GT");
        return value > 0;
    } catch (error) {
        logException(error);
        return false;
    }
}

type CacheOptions = {
    ttl?: number;
    until?: Date;
};

export async function cacheValue<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const serializedValue = JSON.stringify(value);
    try {
        if (options.ttl) {
            await redis.setex(key, options.ttl, serializedValue);
            return;
        }
        if (options.until) {
            await redis.set(key, serializedValue, "PXAT", options.until.getTime());
            return;
        }
        await redis.set(key, serializedValue);
    } catch (error) {
        logException(error);
    }
}
export async function deleteCachedValue(key: string): Promise<void> {
    try {
        await redis.del(key);
    } catch (error) {
        logException(error);
    }
}
