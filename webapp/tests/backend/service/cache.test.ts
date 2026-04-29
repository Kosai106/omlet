import { LockError, withAnalysisWriteLock } from "../../../src/backend/service/cache/cache";

function sleep(duration: number) {
    return new Promise(resolve => setTimeout(resolve, duration));
}

describe("Cache Service", () => {
    describe("withAnalysisWriteLock", () => {
        it("should run the callback.", async () => {
            const workspaceId = "dummy_id_1";
            const callback = jest.fn();
            await withAnalysisWriteLock(workspaceId, callback);
            expect(callback).toHaveBeenCalled();
        });

        it("should return the callback's return value.", async () => {
            const workspaceId = "dummy_id_2";
            const returnValue = "return value";
            const callback = jest.fn().mockResolvedValue(returnValue);
            await expect(withAnalysisWriteLock(workspaceId, callback)).resolves.toBe(returnValue);
        });

        it("should throw an error if the lock is already acquired.", async () => {
            expect.assertions(2);
            const workspaceId = "dummy_id_3";
            await Promise.all([
                withAnalysisWriteLock(workspaceId, () => sleep(1200)),
                (async () => {
                    await sleep(100);
                    try {
                        await withAnalysisWriteLock(workspaceId, () => Promise.resolve());
                    } catch (e) {
                        expect(e).toBeInstanceOf(LockError);
                        expect((e as LockError).details).toStrictEqual({
                            key: expect.stringContaining(`:${workspaceId}:`) as unknown,
                        });
                    }
                })(),
            ]);
        });

        it("should success if the lock is released before last retry attempt.", async () => {
            const workspaceId = "dummy_id_4";
            await Promise.all([
                withAnalysisWriteLock(workspaceId, () => sleep(250)),
                (async () => {
                    await sleep(100);
                    await expect(withAnalysisWriteLock(workspaceId, () => Promise.resolve())).resolves.toBeUndefined();
                })(),
            ]);
        });
    });
});
