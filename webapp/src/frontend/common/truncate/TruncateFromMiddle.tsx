import { type TruncateOptions, SpanType, truncateComponentGenerator } from "./truncateComponentGenerator";

function getTruncatedText({ originalText, ellipsis, width, getTextWidth }: TruncateOptions) : string {
    if (getTextWidth(ellipsis) >= width || getTextWidth(originalText) <= width) {
        return originalText;
    }

    const offsetToCut = Math.floor(originalText.length / 2) - 1;
    let result = `${originalText.substring(
        0,
        offsetToCut
    )}${ellipsis}${originalText.substring(
        originalText.length - offsetToCut,
        originalText.length
    )}`;

    while (getTextWidth(result) > width) {
        const cutIndex =
            Math.floor((result.length - ellipsis.length) / 2 - 1);
        result = `${result.substring(
            0,
            cutIndex
        )}${ellipsis}${result.substring(
            result.length - cutIndex,
            result.length
        )}`;
    }
    return result;
}

export const TruncateFromMiddle = truncateComponentGenerator(getTruncatedText);
export { SpanType };
