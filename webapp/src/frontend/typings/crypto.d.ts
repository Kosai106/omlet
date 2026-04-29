// copied from vscode:lib.dom.d.ts
// TODO: remove after upgrade typescript to 4.6+
/**
 * Basic cryptography features available in the current context. It allows access to a cryptographically strong random number generator and to cryptographic primitives.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Crypto)
 */
interface Crypto {
    /**
     * Available only in secure contexts.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Crypto/subtle)
     */
    readonly subtle: SubtleCrypto;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Crypto/getRandomValues) */
    getRandomValues<T extends ArrayBufferView | null>(array: T): T;
    /**
     * Available only in secure contexts.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Crypto/randomUUID)
     */
    randomUUID(): `${string}-${string}-${string}-${string}-${string}`;
}
