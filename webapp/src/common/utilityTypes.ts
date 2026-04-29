/**
 * Partializes properties of keys K in T.
 *
 * e.g.
 * ```
 * interface Something {
 *   a: string;
 *   b: string;
 *   c: string
 * }
 *
 * type ARequired = PickPartial<Something, "b" | "c">;
 * type ARequired = {
 *   a: string;
 *   b?: string;
 *   c?: string;
 * };
 * ```
 */
export type PickPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Partializes all properties expect of keys K in T.
 *
 * e.g.
 * interface Something {
 *   a: string;
 *   b: string;
 *   c: string
 * }
 *
 * type ARequired = PartialExcept<Something, "a">;
 * type ARequired = {
 *   a: string;
 *   b?: string;
 *   c?: string;
 * };
 */
export type PartialExcept<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

export type Optional<T> = T | undefined;
