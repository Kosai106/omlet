import { JsonStreamStringify } from "json-stream-stringify";

export function toJsonStringStream(data: unknown, { spaces, bufferSize }: { spaces?: number; bufferSize?: number; } = { bufferSize: 1024 * 1024 }) {
    return new JsonStreamStringify(data, undefined, spaces, undefined, bufferSize);
}
