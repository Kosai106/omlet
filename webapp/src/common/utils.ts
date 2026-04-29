import emojiRegexFactory from "emoji-regex";
import slugify from "slugify";
import emojiData from "unicode-emoji-json";

import { convertSkinTone, SkinToneType } from "./skinTone";

const emojiRegex = emojiRegexFactory();

function convertEmojiToSlug(text: string): string {
    return text.replaceAll(emojiRegex, match =>
        (emojiData[convertSkinTone(match, SkinToneType.None) as keyof typeof emojiData]?.slug ?? "emoji").replaceAll("_", "-")
    );
}

export function generateSlug(s: string): string {
    return slugify(convertEmojiToSlug(s), {
        lower: true,
        strict: true,
    });
}

export function isCapitalized(str: string): boolean {
    return /^\p{Lu}/u.test(str);
}

export function arrayGroup<T>(array: T[], callback: (item: T) => string | number): Record<string, T[]> {
    const result: Record<string, T[]> = {};

    for (const value of array) {
        const key = callback(value);

        if (key in result) {
            result[key].push(value);
        } else {
            result[key] = [value];
        }
    }

    return result;
}

interface PluralizeOptions {
    pluralSuffix?: string;
    pluralForm?: string;
}

export function pluralize(noun: string, count: number, options: PluralizeOptions = {}) {
    const pluralForm = options.pluralForm ?? `${noun}${options.pluralSuffix ?? "s"}`;
    return `${count} ${count === 1 ? noun : pluralForm}`;
}

export function uppercaseFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.substring(1);
}
