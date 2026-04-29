export function concatStrings(...args: string[]): string {
    return ["single-part:concatStrings", ...args].join('|');
}
