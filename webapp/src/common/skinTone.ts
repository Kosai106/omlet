// copied from https://github.com/sindresorhus/skin-tone/blob/main/index.js
// copied because the library is a pure ESM package, and with current configuration we cannot transpile it
// TODO: remove after backend code is converted to an ESM module and typescript is updated
export enum SkinToneType {
    None = "",
    White = "🏻",
    CreamWhite = "🏼",
    LightBrown = "🏽",
    Brown = "🏾",
    DarkBrown = "🏿",
}

// Emoji presentation selector takes the same place as skin tone modifier https://unicode.org/reports/tr51/#composing_zwj_seq
// So it should be removed if present, otherwise, it causes issues with emojis with several traits.
// For example `female-detective` turns into a detective with gender symbol next to it, instead of showing a female detective with set skin tone `🕵🏼️‍♀️`.
const emojiPresentationSelector = "\u{FE0F}";

// Skin tones are not supported for family emojis.
// Family emojis with 3+ person emojis can easily checked by the number of modifiable component emojis.
// For two person family emojis it's needed to check directly
// to distinguish them from other two person emojis: couple, handshake, fencing, etc.
const twoFamilyEmojis = new Set(["👩‍👦", "👩‍👧", "👨‍👧", "👨‍👦"]);

export function convertSkinTone(emoji: string, tone: SkinToneType) {
    emoji = emoji.replaceAll(/[\u{1F3FB}-\u{1F3FF}]/ug, "");

    // This emoji modifier base is present in emojis that the skin tone can apply to.
    const emojiBaseModifierRegex = /\p{Emoji_Modifier_Base}/ug;

    // If tone is `"none"`, the emoji has more than two modifiable components, or it is a two-person family emoji, then skin tone should not be applied.
    if (tone === SkinToneType.None || (emoji.match(emojiBaseModifierRegex)?.length ?? 0) > 2 || twoFamilyEmojis.has(emoji)) {
        return emoji;
    }

    let processedEmoji = "";

    for (const codePoint of emoji) {
        // If this code point is a emoji presentation selector, it should not be added to toned emoji.
        if (codePoint === emojiPresentationSelector) {
            continue;
        }

        processedEmoji += codePoint;
        // Tone should be applied to all modifiable components.
        // For example, both persons in couple emojis, etc.
        if (emojiBaseModifierRegex.test(codePoint)) {
            processedEmoji += tone;
        }
    }

    return processedEmoji;
}
