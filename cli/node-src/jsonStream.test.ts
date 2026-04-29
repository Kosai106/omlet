import { toJsonStringStream } from "./jsonStream";

describe("jsonStream", () => {
    describe("toJsonStringStream", () => {
        it("should create a read stream (of string) from an object", async () => {
            const stream = toJsonStringStream({ a: 1, b: 2 });
            const result = await stream.read() as string;
            expect(result).toBe("{\"a\":1,\"b\":2}");
        });
    });
});
